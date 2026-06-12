import { getCurrentMatchStatus } from "../../src/data/worldCup2026";
import { getSupabaseAdmin } from "../_lib/supabase-admin";
import { getWorldCupPoolMatches } from "../_lib/world-cup-matches";

type WorldCupLeaderboardScope = "general" | "brazil";

const getMatchOutcome = (homeScore: number, awayScore: number) => {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
};

const scorePrediction = (
  match: Awaited<ReturnType<typeof getWorldCupPoolMatches>>[number],
  prediction: { predictedHomeScore: number; predictedAwayScore: number },
) => {
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

const normalizeMatches = (
  matches: Awaited<ReturnType<typeof getWorldCupPoolMatches>>,
  scope: WorldCupLeaderboardScope,
) => {
  const scorable = matches.filter(
    (match) =>
      match.homeScore !== undefined &&
      match.awayScore !== undefined &&
      getCurrentMatchStatus(match) === "ended",
  );

  if (scope === "brazil") {
    return scorable.filter((match) => match.homeTeam === "Brazil" || match.awayTeam === "Brazil");
  }

  return scorable;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const scope: WorldCupLeaderboardScope = req.query?.scope === "brazil" ? "brazil" : "general";
    const [matches, admin] = await Promise.all([getWorldCupPoolMatches(), Promise.resolve(getSupabaseAdmin())]);
    const scopedMatches = normalizeMatches(matches, scope);
    const legacyAliasMap = new Map(
      matches
        .filter((match) => match.linkedSportsMatchId)
        .map((match) => [match.linkedSportsMatchId as string, match.id]),
    );

    const [predictionsResult, profilesResult, creditsResult] = await Promise.all([
      admin
        .from("world_cup_predictions")
        .select("user_id, match_id, predicted_home_score, predicted_away_score, updated_at"),
      admin.from("profiles").select("id, name, username, avatar_url"),
      admin.from("world_cup_prediction_credits").select("user_id, kind"),
    ]);

    if (predictionsResult.error || profilesResult.error || creditsResult.error) {
      return res.status(500).json({
        error: "world_cup_leaderboard_read_failed",
        details: {
          predictions: predictionsResult.error?.message || null,
          profiles: profilesResult.error?.message || null,
          credits: creditsResult.error?.message || null,
        },
      });
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

    const consumedCreditsByUser = new Map<string, number>();
    for (const row of creditsResult.data || []) {
      if (row.kind !== "edit_consume") continue;
      consumedCreditsByUser.set(row.user_id, (consumedCreditsByUser.get(row.user_id) || 0) + 1);
    }

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

    const leaderboardMap = new Map<string, any>();

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
          editCreditsAvailable: 0,
        };

      currentEntry.predictionsCount += 1;

      const match = scopedMatches.find((item) => item.id === row.match_id);
      if (match) {
        const points = scorePrediction(match, {
          predictedHomeScore: row.predicted_home_score,
          predictedAwayScore: row.predicted_away_score,
        });

        if (points !== null) {
          currentEntry.totalPoints += points;
          currentEntry.exactScoreHits += points === 5 ? 1 : 0;
          currentEntry.outcomeHits += points === 3 ? 1 : 0;
        }
      }

      leaderboardMap.set(row.user_id, currentEntry);
    }

    const leaderboard = Array.from(leaderboardMap.values())
      .map((entry) => ({
        ...entry,
        editCreditsAvailable: Math.max(
          0,
          entry.exactScoreHits - (consumedCreditsByUser.get(entry.userId) || 0),
        ),
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.exactScoreHits !== a.exactScoreHits) return b.exactScoreHits - a.exactScoreHits;
        if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits;
        return b.predictionsCount - a.predictionsCount;
      });

    return res.status(200).json({ leaderboard });
  } catch (error: any) {
    return res.status(500).json({
      error: "world_cup_leaderboard_read_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
