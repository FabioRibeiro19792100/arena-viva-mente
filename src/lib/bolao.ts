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

export type WorldCupLeaderboardScope = "general" | "brazil";
export type WorldCupCreditEventKind = "exact_hit_grant" | "edit_consume";

export interface WorldCupCreditSummary {
  availableCredits: number;
  exactHitCredits: number;
  consumedCredits: number;
}

export interface WorldCupCreditLedgerEntry {
  eventKey: string;
  userId: string;
  kind: WorldCupCreditEventKind;
  sourceMatchId: string | null;
  targetMatchId: string | null;
  createdAt: string;
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
  editCreditsAvailable: number;
}

type CreditMutationErrorCode = "NO_CREDITS" | "MATCH_STARTED" | "UNCHANGED";

export class WorldCupCreditMutationError extends Error {
  code: CreditMutationErrorCode;

  constructor(code: CreditMutationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const LOCAL_PREDICTIONS_PREFIX = "arena-viva-mente.world-cup-predictions";
const LOCAL_CREDITS_PREFIX = "arena-viva-mente.world-cup-prediction-credits";
const DEV_LOCAL_USER_ID = "dev-local";
const LEGACY_WORLD_CUP_MATCH_ID_MAP: Record<string, string> = {
  "api-football-1489369": "wc2026-01",
  "api-football-1538999": "wc2026-02",
};

const normalizeWorldCupPredictionMatchId = (matchId: string) =>
  LEGACY_WORLD_CUP_MATCH_ID_MAP[matchId] || matchId;

const localPredictionsKey = (userId: string) => `${LOCAL_PREDICTIONS_PREFIX}.${userId}`;
const localCreditsKey = (userId: string) => `${LOCAL_CREDITS_PREFIX}.${userId}`;

const isDevLocalUser = (userId: string) => userId === DEV_LOCAL_USER_ID || userId.startsWith("dev-local-");

const collectLegacyDevLocalKeys = (prefix: string) => {
  const keys: string[] = [];

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(`${prefix}.dev-local`)) {
        keys.push(key);
      }
    }
  } catch {
    return [];
  }

  return keys;
};

const getPredictionStorageKeys = (userId: string) => {
  if (!isDevLocalUser(userId)) {
    return [localPredictionsKey(userId)];
  }

  return Array.from(
    new Set([localPredictionsKey(DEV_LOCAL_USER_ID), localPredictionsKey(userId), ...collectLegacyDevLocalKeys(LOCAL_PREDICTIONS_PREFIX)]),
  );
};

const getCreditStorageKeys = (userId: string) => {
  if (!isDevLocalUser(userId)) {
    return [localCreditsKey(userId)];
  }

  return Array.from(
    new Set([localCreditsKey(DEV_LOCAL_USER_ID), localCreditsKey(userId), ...collectLegacyDevLocalKeys(LOCAL_CREDITS_PREFIX)]),
  );
};

const readLocalPredictions = (userId: string): WorldCupPrediction[] => {
  try {
    const merged = getPredictionStorageKeys(userId).flatMap((key) => {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as WorldCupPrediction[]) : [];
    });

    return dedupePredictionsByMatchId(merged);
  } catch {
    return [];
  }
};

const saveLocalPredictions = (userId: string, predictions: WorldCupPrediction[]) => {
  const targetKey = isDevLocalUser(userId) ? localPredictionsKey(DEV_LOCAL_USER_ID) : localPredictionsKey(userId);
  localStorage.setItem(targetKey, JSON.stringify(predictions));
};

const readLocalCreditLedger = (userId: string): WorldCupCreditLedgerEntry[] => {
  try {
    const merged = getCreditStorageKeys(userId).flatMap((key) => {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as WorldCupCreditLedgerEntry[]) : [];
    });

    return Array.from(
      new Map(
        merged
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((entry) => [entry.eventKey, entry]),
      ).values(),
    );
  } catch {
    return [];
  }
};

const saveLocalCreditLedger = (userId: string, entries: WorldCupCreditLedgerEntry[]) => {
  const targetKey = isDevLocalUser(userId) ? localCreditsKey(DEV_LOCAL_USER_ID) : localCreditsKey(userId);
  localStorage.setItem(targetKey, JSON.stringify(entries));
};

const canUseSupabasePredictions = async (userId: string) => {
  if (!isSupabaseConfigured || !supabase) return false;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id === userId;
};

const fetchApiLeaderboard = async (scope: WorldCupLeaderboardScope) => {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch(`/api/world-cup-leaderboard?scope=${scope}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { entries?: WorldCupLeaderboardEntry[] };
    return payload.entries || [];
  } catch {
    return null;
  }
};

const getMatchOutcome = (homeScore: number, awayScore: number) => {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
};

const dedupePredictionsByMatchId = (predictions: WorldCupPrediction[]) =>
  Array.from(
    new Map(
      [...predictions]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((prediction) => [
          normalizeWorldCupPredictionMatchId(prediction.matchId),
          {
            ...prediction,
            matchId: normalizeWorldCupPredictionMatchId(prediction.matchId),
          },
        ]),
    ).values(),
  );

const buildPredictionMap = (predictions: WorldCupPrediction[]) =>
  new Map(predictions.map((prediction) => [prediction.matchId, prediction]));

const normalizeLeaderboardMatches = (
  matches: WorldCupPoolMatch[],
  scope: WorldCupLeaderboardScope,
) => {
  const scorableMatches = matches.filter(
    (match) =>
      match.homeScore !== undefined &&
      match.awayScore !== undefined &&
      getCurrentMatchStatus(match) === "ended",
  );

  if (scope === "brazil") {
    return scorableMatches.filter((match) => match.homeTeam === "Brazil" || match.awayTeam === "Brazil");
  }

  return scorableMatches;
};

const exactGrantEventKey = (matchId: string) => `exact:${matchId}`;
const consumeEventKey = (matchId: string) =>
  `consume:${matchId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

const deriveCreditSummary = (ledger: WorldCupCreditLedgerEntry[]) => {
  const exactHitCredits = ledger.filter((entry) => entry.kind === "exact_hit_grant").length;
  const consumedCredits = ledger.filter((entry) => entry.kind === "edit_consume").length;

  return {
    exactHitCredits,
    consumedCredits,
    availableCredits: Math.max(0, exactHitCredits - consumedCredits),
  } satisfies WorldCupCreditSummary;
};

const syncLocalCreditLedger = (
  userId: string,
  predictions: WorldCupPrediction[],
  matches: WorldCupPoolMatch[],
) => {
  const ledger = readLocalCreditLedger(userId);
  const predictionMap = buildPredictionMap(predictions);
  const existingKeys = new Set(ledger.map((entry) => entry.eventKey));
  const newEntries = matches
    .filter((match) => {
      const prediction = predictionMap.get(match.id);
      return scoreWorldCupPrediction(match, prediction) === 5;
    })
    .filter((match) => !existingKeys.has(exactGrantEventKey(match.id)))
    .map<WorldCupCreditLedgerEntry>((match) => ({
      eventKey: exactGrantEventKey(match.id),
      userId,
      kind: "exact_hit_grant",
      sourceMatchId: match.id,
      targetMatchId: null,
      createdAt: new Date().toISOString(),
    }));

  if (newEntries.length === 0) {
    return ledger;
  }

  const nextLedger = [...ledger, ...newEntries];
  saveLocalCreditLedger(userId, nextLedger);
  return nextLedger;
};

const syncSupabaseCreditLedger = async (
  userId: string,
  predictions: WorldCupPrediction[],
  matches: WorldCupPoolMatch[],
) => {
  const { data, error } = await supabase
    .from("world_cup_prediction_credits")
    .select("event_key, user_id, kind, source_match_id, target_match_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar créditos do bolão:", error);
    return [] as WorldCupCreditLedgerEntry[];
  }

  const ledger = (data || []).map<WorldCupCreditLedgerEntry>((entry) => ({
    eventKey: entry.event_key,
    userId: entry.user_id,
    kind: entry.kind,
    sourceMatchId: entry.source_match_id,
    targetMatchId: entry.target_match_id,
    createdAt: entry.created_at,
  }));

  const predictionMap = buildPredictionMap(predictions);
  const existingKeys = new Set(ledger.map((entry) => entry.eventKey));
  const missingGrants = matches
    .filter((match) => {
      const prediction = predictionMap.get(match.id);
      return scoreWorldCupPrediction(match, prediction) === 5;
    })
    .filter((match) => !existingKeys.has(exactGrantEventKey(match.id)))
    .map((match) => ({
      event_key: exactGrantEventKey(match.id),
      user_id: userId,
      kind: "exact_hit_grant" as const,
      source_match_id: match.id,
      target_match_id: null,
    }));

  if (missingGrants.length === 0) {
    return ledger;
  }

  const { error: insertError } = await supabase
    .from("world_cup_prediction_credits")
    .insert(missingGrants);

  if (insertError) {
    console.error("Erro ao sincronizar créditos do bolão:", insertError);
    return ledger;
  }

  return [
    ...ledger,
    ...missingGrants.map<WorldCupCreditLedgerEntry>((entry) => ({
      eventKey: entry.event_key,
      userId: entry.user_id,
      kind: entry.kind,
      sourceMatchId: entry.source_match_id,
      targetMatchId: entry.target_match_id,
      createdAt: new Date().toISOString(),
    })),
  ];
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

export const getWorldCupPredictions = async (
  userId: string,
  matches: WorldCupPoolMatch[] = [],
): Promise<WorldCupPrediction[]> => {
  if (!(await canUseSupabasePredictions(userId))) {
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
      matchId: normalizeWorldCupPredictionMatchId(row.match_id),
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
) => {
  const normalizedMatchId = normalizeWorldCupPredictionMatchId(matchId);
  const payload: WorldCupPrediction = {
    matchId: normalizedMatchId,
    predictedHomeScore,
    predictedAwayScore,
    updatedAt: new Date().toISOString(),
  };

  if (!(await canUseSupabasePredictions(userId))) {
    const current = readLocalPredictions(userId);
    const next = [
      payload,
      ...current.filter((prediction) => prediction.matchId !== normalizedMatchId),
    ];
    saveLocalPredictions(userId, next);
    return;
  }

  const { error } = await supabase.from("world_cup_predictions").upsert({
    user_id: userId,
    match_id: normalizedMatchId,
    predicted_home_score: predictedHomeScore,
    predicted_away_score: predictedAwayScore,
    updated_at: payload.updatedAt,
  });

  if (error) {
    console.error("Erro ao salvar palpite do bolão:", error);
    throw error;
  }
};

export const getWorldCupEditCreditSummary = async (
  userId: string,
  matches: WorldCupPoolMatch[],
  providedPredictions?: WorldCupPrediction[],
): Promise<WorldCupCreditSummary> => {
  const predictions =
    providedPredictions || (await getWorldCupPredictions(userId, matches));

  if (!(await canUseSupabasePredictions(userId))) {
    const ledger = syncLocalCreditLedger(userId, predictions, matches);
    return deriveCreditSummary(ledger);
  }

  const ledger = await syncSupabaseCreditLedger(userId, predictions, matches);
  return deriveCreditSummary(ledger);
};

export const consumeWorldCupEditCredit = async (
  userId: string,
  match: WorldCupPoolMatch,
  nextValues: { home: number; away: number },
  matches: WorldCupPoolMatch[],
  currentPrediction: WorldCupPrediction,
) => {
  if (getCurrentMatchStatus(match) !== "scheduled") {
    throw new WorldCupCreditMutationError(
      "MATCH_STARTED",
      "Este jogo já começou e não pode mais ser alterado.",
    );
  }

  if (
    currentPrediction.predictedHomeScore === nextValues.home &&
    currentPrediction.predictedAwayScore === nextValues.away
  ) {
    throw new WorldCupCreditMutationError("UNCHANGED", "O palpite já está com esse placar.");
  }

  const predictions = await getWorldCupPredictions(userId, matches);
  const summary = await getWorldCupEditCreditSummary(userId, matches, predictions);

  if (summary.availableCredits <= 0) {
    throw new WorldCupCreditMutationError(
      "NO_CREDITS",
      "Você não possui créditos de edição disponíveis.",
    );
  }

  const consumeEntry: WorldCupCreditLedgerEntry = {
    eventKey: consumeEventKey(match.id),
    userId,
    kind: "edit_consume",
    sourceMatchId: null,
    targetMatchId: match.id,
    createdAt: new Date().toISOString(),
  };

  if (!(await canUseSupabasePredictions(userId))) {
    const ledger = readLocalCreditLedger(userId);
    saveLocalCreditLedger(userId, [...ledger, consumeEntry]);
    await saveWorldCupPrediction(
      userId,
      match.id,
      nextValues.home,
      nextValues.away,
    );

    return {
      ...summary,
      consumedCredits: summary.consumedCredits + 1,
      availableCredits: Math.max(0, summary.availableCredits - 1),
    } satisfies WorldCupCreditSummary;
  }

  const { error: insertError } = await supabase
    .from("world_cup_prediction_credits")
    .insert({
      event_key: consumeEntry.eventKey,
      user_id: consumeEntry.userId,
      kind: consumeEntry.kind,
      source_match_id: consumeEntry.sourceMatchId,
      target_match_id: consumeEntry.targetMatchId,
    });

  if (insertError) {
    console.error("Erro ao consumir crédito do bolão:", insertError);
    throw insertError;
  }

  try {
    await saveWorldCupPrediction(
      userId,
      match.id,
      nextValues.home,
      nextValues.away,
    );
  } catch (error) {
    await supabase
      .from("world_cup_prediction_credits")
      .delete()
      .eq("event_key", consumeEntry.eventKey)
      .eq("user_id", userId);
    throw error;
  }

  return {
    ...summary,
    consumedCredits: summary.consumedCredits + 1,
    availableCredits: Math.max(0, summary.availableCredits - 1),
  } satisfies WorldCupCreditSummary;
};

export const getWorldCupLeaderboard = async (
  matches: WorldCupPoolMatch[],
  currentUser?: MockUser | null,
  scope: WorldCupLeaderboardScope = "general",
): Promise<WorldCupLeaderboardEntry[]> => {
  const apiLeaderboard = await fetchApiLeaderboard(scope);
  if (apiLeaderboard) {
    return apiLeaderboard;
  }

  const scopedMatches = normalizeLeaderboardMatches(matches, scope);

  if (!currentUser || !(await canUseSupabasePredictions(currentUser.id))) {
    if (!currentUser) return [];

    const predictions = readLocalPredictions(currentUser.id);
    const ledger = syncLocalCreditLedger(currentUser.id, predictions, matches);
    const scoreSummary = predictions.reduce(
      (summary, prediction) => {
        const match = scopedMatches.find((item) => item.id === prediction.matchId);
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
        editCreditsAvailable: deriveCreditSummary(ledger).availableCredits,
        ...scoreSummary,
      },
    ];
  }

  const [predictionsResult, profilesResult, creditsResult] = await Promise.all([
    supabase
      .from("world_cup_predictions")
      .select("user_id, match_id, predicted_home_score, predicted_away_score, updated_at"),
    supabase
      .from("profiles")
      .select("id, name, username, avatar_url"),
    supabase
      .from("world_cup_prediction_credits")
      .select("user_id, kind"),
  ]);

  if (predictionsResult.error || profilesResult.error || creditsResult.error) {
    console.error("Erro ao buscar ranking do bolão:", {
      predictions: predictionsResult.error,
      profiles: profilesResult.error,
      credits: creditsResult.error,
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

  const consumedCreditsByUser = new Map<string, number>();
  for (const row of creditsResult.data || []) {
    if (row.kind !== "edit_consume") continue;
    consumedCreditsByUser.set(row.user_id, (consumedCreditsByUser.get(row.user_id) || 0) + 1);
  }

  const leaderboardMap = new Map<string, WorldCupLeaderboardEntry>();
  const dedupedRows = Array.from(
    new Map(
      (predictionsResult.data || [])
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((row) => [
          `${row.user_id}:${normalizeWorldCupPredictionMatchId(row.match_id)}`,
          { ...row, match_id: normalizeWorldCupPredictionMatchId(row.match_id) },
        ]),
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
        editCreditsAvailable: 0,
      };

    currentEntry.predictionsCount += 1;

    const match = scopedMatches.find((item) => item.id === row.match_id);
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

  const sorted = Array.from(leaderboardMap.values())
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

  return sorted;
};
