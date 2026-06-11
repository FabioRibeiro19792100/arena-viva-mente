import type { MockUser } from "@/contexts/MockAuthContext";
import { getCurrentMatchStatus, type WorldCupMatch } from "@/data/worldCup2026";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { WorldCupPoolMatch } from "@/lib/worldCupPoolApi";

export interface WorldCupPrediction {
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  updatedAt: string;
}

export interface WorldCupLeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactScoreHits: number;
  outcomeHits: number;
  predictionsCount: number;
}

const LOCAL_PREDICTIONS_PREFIX = "arena-viva-mente.world-cup-predictions";

const localPredictionsKey = (userId: string) => `${LOCAL_PREDICTIONS_PREFIX}.${userId}`;

const readLocalPredictions = (userId: string): WorldCupPrediction[] => {
  try {
    const stored = localStorage.getItem(localPredictionsKey(userId));
    return stored ? (JSON.parse(stored) as WorldCupPrediction[]) : [];
  } catch {
    return [];
  }
};

const saveLocalPredictions = (userId: string, predictions: WorldCupPrediction[]) => {
  localStorage.setItem(localPredictionsKey(userId), JSON.stringify(predictions));
};

const getMatchOutcome = (homeScore: number, awayScore: number) => {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
};

export const scoreWorldCupPrediction = (match: WorldCupMatch, prediction?: WorldCupPrediction | null) => {
  if (!prediction) return null;
  if (match.homeScore === undefined || match.awayScore === undefined) return null;
  if (getCurrentMatchStatus(match) !== "ended") return null;

  if (
    prediction.predictedHomeScore === match.homeScore &&
    prediction.predictedAwayScore === match.awayScore
  ) {
    return 5;
  }

  const predictedOutcome = getMatchOutcome(
    prediction.predictedHomeScore,
    prediction.predictedAwayScore,
  );
  const actualOutcome = getMatchOutcome(match.homeScore, match.awayScore);

  return predictedOutcome === actualOutcome ? 3 : 0;
};

const buildLegacyAliasMap = (matches: WorldCupPoolMatch[]) =>
  new Map(
    matches
      .filter((match) => match.linkedSportsMatchId)
      .map((match) => [match.linkedSportsMatchId as string, match.id]),
  );

const dedupePredictionsByMatchId = (predictions: WorldCupPrediction[]) =>
  Array.from(
    new Map(
      [...predictions]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((prediction) => [prediction.matchId, prediction]),
    ).values(),
  );

export const getWorldCupPredictions = async (
  userId: string,
  matches: WorldCupPoolMatch[] = [],
): Promise<WorldCupPrediction[]> => {
  const legacyAliasMap = buildLegacyAliasMap(matches);

  if (!isSupabaseConfigured || !supabase) {
    return readLocalPredictions(userId);
  }

  const { data, error } = await supabase
    .from("world_cup_predictions")
    .select("match_id, predicted_home_score, predicted_away_score, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar palpites do bolão:", error);
    return [];
  }

  return dedupePredictionsByMatchId(
    data.map((row) => ({
      matchId: legacyAliasMap.get(row.match_id) || row.match_id,
      predictedHomeScore: row.predicted_home_score,
      predictedAwayScore: row.predicted_away_score,
      updatedAt: row.updated_at,
    })),
  );
};

export const saveWorldCupPrediction = async (
  userId: string,
  matchId: string,
  predictedHomeScore: number,
  predictedAwayScore: number,
  legacyMatchIds: string[] = [],
) => {
  const payload: WorldCupPrediction = {
    matchId,
    predictedHomeScore,
    predictedAwayScore,
    updatedAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase) {
    const current = readLocalPredictions(userId);
    const next = [
      payload,
      ...current.filter(
        (prediction) => prediction.matchId !== matchId && !legacyMatchIds.includes(prediction.matchId),
      ),
    ];
    saveLocalPredictions(userId, next);
    return;
  }

  const { error } = await supabase.from("world_cup_predictions").upsert({
    user_id: userId,
    match_id: matchId,
    predicted_home_score: predictedHomeScore,
    predicted_away_score: predictedAwayScore,
    updated_at: payload.updatedAt,
  });

  if (error) {
    console.error("Erro ao salvar palpite do bolão:", error);
    throw error;
  }

  if (legacyMatchIds.length > 0) {
    const { error: cleanupError } = await supabase
      .from("world_cup_predictions")
      .delete()
      .eq("user_id", userId)
      .in("match_id", legacyMatchIds);

    if (cleanupError) {
      console.error("Erro ao limpar palpites antigos do bolão:", cleanupError);
    }
  }
};

export const getWorldCupLeaderboard = async (
  matches: WorldCupPoolMatch[],
  currentUser?: MockUser | null,
): Promise<WorldCupLeaderboardEntry[]> => {
  const legacyAliasMap = buildLegacyAliasMap(matches);
  const scorableMatches = matches.filter(
    (match) =>
      match.homeScore !== undefined &&
      match.awayScore !== undefined &&
      getCurrentMatchStatus(match) === "ended",
  );

  if (!isSupabaseConfigured || !supabase) {
    if (!currentUser) return [];

    const predictions = readLocalPredictions(currentUser.id);
    const scoreSummary = predictions.reduce(
      (summary, prediction) => {
        const match = scorableMatches.find((item) => item.id === prediction.matchId);
        const points = match ? scoreWorldCupPrediction(match, prediction) : null;
        if (points === null) return summary;
        return {
          totalPoints: summary.totalPoints + points,
          exactScoreHits: summary.exactScoreHits + (points === 5 ? 1 : 0),
          outcomeHits: summary.outcomeHits + (points === 3 ? 1 : 0),
          predictionsCount: summary.predictionsCount + 1,
        };
      },
      {
        totalPoints: 0,
        exactScoreHits: 0,
        outcomeHits: 0,
        predictionsCount: 0,
      },
    );

    return [
      {
        userId: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatarUrl: currentUser.avatar,
        ...scoreSummary,
      },
    ];
  }

  const [predictionsResult, profilesResult] = await Promise.all([
    supabase
      .from("world_cup_predictions")
      .select("user_id, match_id, predicted_home_score, predicted_away_score, updated_at"),
    supabase
      .from("profiles")
      .select("id, name, username, avatar_url"),
  ]);

  if (predictionsResult.error || profilesResult.error) {
    console.error("Erro ao buscar ranking do bolão:", {
      predictions: predictionsResult.error,
      profiles: profilesResult.error,
    });
    return [];
  }

  const profilesById = new Map(
    (profilesResult.data || []).map((profile) => [
      profile.id,
      {
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      },
    ]),
  );

  const leaderboardMap = new Map<string, WorldCupLeaderboardEntry>();
  const dedupedRows = Array.from(
    new Map(
      (predictionsResult.data || [])
        .map((row) => ({
          ...row,
          match_id: legacyAliasMap.get(row.match_id) || row.match_id,
        }))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((row) => [`${row.user_id}:${row.match_id}`, row]),
    ).values(),
  );

  for (const row of dedupedRows) {
    const profile = profilesById.get(row.user_id);
    const currentEntry =
      leaderboardMap.get(row.user_id) ||
      {
        userId: row.user_id,
        name: profile?.name || "Torcedor",
        username: profile?.username || "@torcedor",
        avatarUrl: profile?.avatarUrl || null,
        totalPoints: 0,
        exactScoreHits: 0,
        outcomeHits: 0,
        predictionsCount: 0,
      };

    currentEntry.predictionsCount += 1;

    const match = scorableMatches.find((item) => item.id === row.match_id);
    if (match) {
      const points = scoreWorldCupPrediction(match, {
        matchId: row.match_id,
        predictedHomeScore: row.predicted_home_score,
        predictedAwayScore: row.predicted_away_score,
        updatedAt: "",
      });

      if (points !== null) {
        currentEntry.totalPoints += points;
        currentEntry.exactScoreHits += points === 5 ? 1 : 0;
        currentEntry.outcomeHits += points === 3 ? 1 : 0;
      }
    }

    leaderboardMap.set(row.user_id, currentEntry);
  }

  return Array.from(leaderboardMap.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScoreHits !== a.exactScoreHits) return b.exactScoreHits - a.exactScoreHits;
    if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits;
    return b.predictionsCount - a.predictionsCount;
  });
};
