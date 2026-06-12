import { getSupabaseAdmin } from "../_lib/supabase-admin.js";
import { getWorldCupPoolMatches } from "../_lib/world-cup-matches.js";

type Scope = "general" | "brazil";

const endedMatchStatus = "ended";

const isMissingCreditsTableError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : "";

  return /world_cup_prediction_credits/i.test(message) && /schema cache|does not exist|relation/i.test(message);
};

const scorePrediction = (
  match: { homeScore?: number; awayScore?: number; status: string },
  prediction: { home: number; away: number },
) => {
  if (
    match.status !== endedMatchStatus ||
    typeof match.homeScore !== "number" ||
    typeof match.awayScore !== "number"
  ) {
    return null;
  }

  if (match.homeScore === prediction.home && match.awayScore === prediction.away) {
    return 5;
  }

  const matchOutcome =
    match.homeScore === match.awayScore
      ? "draw"
      : match.homeScore > match.awayScore
        ? "home"
        : "away";
  const predictionOutcome =
    prediction.home === prediction.away
      ? "draw"
      : prediction.home > prediction.away
        ? "home"
        : "away";

  return matchOutcome === predictionOutcome ? 3 : 0;
};

const normalizeMatchesForScope = (scope: Scope) =>
  getWorldCupPoolMatches().then((matches) =>
    matches.filter((match) => {
      const isEnded =
        match.status === endedMatchStatus &&
        typeof match.homeScore === "number" &&
        typeof match.awayScore === "number";

      if (!isEnded) return false;
      if (scope === "brazil") {
        return match.homeTeam === "Brazil" || match.awayTeam === "Brazil";
      }

      return true;
    }),
  );

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const scope: Scope = req.query?.scope === "brazil" ? "brazil" : "general";
    const admin = getSupabaseAdmin();
    const [matches, predictionsResult, profilesResult, creditsResult] = await Promise.all([
      normalizeMatchesForScope(scope),
      admin
        .from("world_cup_predictions")
        .select("user_id, match_id, predicted_home_score, predicted_away_score, updated_at"),
      admin.from("profiles").select("id, name, username, avatar_url"),
      admin.from("world_cup_prediction_credits").select("user_id, kind"),
    ]);

    const canIgnoreCreditsError = isMissingCreditsTableError(creditsResult.error);

    if (predictionsResult.error || profilesResult.error || (creditsResult.error && !canIgnoreCreditsError)) {
      return res.status(500).json({
        error: "world_cup_leaderboard_read_failed",
        predictions: predictionsResult.error?.message || null,
        profiles: profilesResult.error?.message || null,
        credits: creditsResult.error?.message || null,
      });
    }

    const legacyAliasMap = new Map(
      matches
        .filter((match) => match.linkedSportsMatchId)
        .map((match) => [match.linkedSportsMatchId as string, match.id]),
    );

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
    for (const row of canIgnoreCreditsError ? [] : creditsResult.data || []) {
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
      const entry =
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

      entry.predictionsCount += 1;

      const match = matches.find((item) => item.id === row.match_id);
      const points = match
        ? scorePrediction(match, {
            home: row.predicted_home_score,
            away: row.predicted_away_score,
          })
        : null;

      if (points !== null) {
        entry.totalPoints += points;
        entry.exactScoreHits += points === 5 ? 1 : 0;
        entry.outcomeHits += points === 3 ? 1 : 0;
      }

      leaderboardMap.set(row.user_id, entry);
    }

    const entries = Array.from(leaderboardMap.values())
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

    return res.status(200).json({ entries, scope });
  } catch (error: any) {
    return res.status(500).json({
      error: "world_cup_leaderboard_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
