import { getSupabaseAdmin } from "./supabase-admin.js";
import { getMatchByIdFromDb } from "./matches-read.js";

const FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const TTL_MS = 5 * 60 * 1000;

type MatchInsightsPayload = {
  events: Array<{
    minute: string;
    team: string;
    type: string;
    detail: string;
    player?: string;
    assist?: string;
  }>;
  lineups: Array<{
    team: string;
    coach: string;
    formation: string;
    starters: string[];
    substitutes: string[];
  }>;
  teamStats: Array<{
    team: string;
    stats: Array<{ label: string; value: string }>;
  }>;
  playerStats: Array<{
    player: string;
    team: string;
    rating?: string;
    summary: string;
  }>;
  odds: Array<{
    bookmaker: string;
    home?: string;
    draw?: string;
    away?: string;
  }>;
  prediction?: {
    advice?: string;
    homePercent?: string;
    drawPercent?: string;
    awayPercent?: string;
  };
  headToHead: Array<{
    date: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
  }>;
};

const getApiKey = () => process.env.API_SPORTS_KEY || process.env.API_FOOTBALL_KEY;

const fetchFootballJson = async (path: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_SPORTS_KEY or API_FOOTBALL_KEY is not configured");
  }

  const response = await fetch(`${FOOTBALL_BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (response.status === 204) {
    return { response: [] };
  }

  if (!response.ok) {
    return { response: [] };
  }

  return response.json();
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const formatMinute = (elapsed?: number | null, extra?: number | null) => {
  if (typeof elapsed !== "number") return "";
  return typeof extra === "number" ? `${elapsed}+${extra}'` : `${elapsed}'`;
};

const buildPlayerSummary = (stat?: any) => {
  if (!stat) return "";
  const parts: string[] = [];
  if (typeof stat.goals?.total === "number" && stat.goals.total > 0) parts.push(`${stat.goals.total} gol`);
  if (typeof stat.goals?.assists === "number" && stat.goals.assists > 0) parts.push(`${stat.goals.assists} assistência`);
  if (typeof stat.shots?.on === "number" && stat.shots.on > 0) parts.push(`${stat.shots.on} no alvo`);
  if (typeof stat.passes?.key === "number" && stat.passes.key > 0) parts.push(`${stat.passes.key} passe-chave`);
  return parts.slice(0, 2).join(" • ") || "Participação registrada";
};

const formatStatValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);

export const getMatchInsights = async (matchId: string) => {
  const admin = getSupabaseAdmin();
  const { data: cached } = await admin
    .from("match_insights_cache")
    .select("payload, expires_at")
    .eq("match_id", matchId)
    .maybeSingle();

  if (cached?.payload && cached?.expires_at && new Date(cached.expires_at).getTime() > Date.now()) {
    return cached.payload as MatchInsightsPayload;
  }

  const match = await getMatchByIdFromDb(matchId);
  if (!match?.apiFixtureId || match.apiSource !== "football") {
    return null;
  }

  const timezone = "America/Sao_Paulo";
  const [eventsPayload, lineupsPayload, statisticsPayload, playersPayload, predictionsPayload, oddsPayload, headToHeadPayload] =
    await Promise.all([
      fetchFootballJson(`/fixtures/events?fixture=${match.apiFixtureId}&timezone=${timezone}`),
      fetchFootballJson(`/fixtures/lineups?fixture=${match.apiFixtureId}&timezone=${timezone}`),
      fetchFootballJson(`/fixtures/statistics?fixture=${match.apiFixtureId}&timezone=${timezone}`),
      fetchFootballJson(`/fixtures/players?fixture=${match.apiFixtureId}&timezone=${timezone}`),
      fetchFootballJson(`/predictions?fixture=${match.apiFixtureId}`),
      fetchFootballJson(`/odds?fixture=${match.apiFixtureId}&timezone=${timezone}&page=1`),
      match.apiHomeTeamId && match.apiAwayTeamId
        ? fetchFootballJson(
            `/fixtures/headtohead?h2h=${match.apiHomeTeamId}-${match.apiAwayTeamId}&league=${match.apiLeagueId || ""}&season=${match.apiSeason || ""}&last=5&timezone=${timezone}`,
          )
        : Promise.resolve({ response: [] }),
    ]);

  const payload: MatchInsightsPayload = {
    events: ((eventsPayload.response || []) as any[])
      .map((item) => ({
        minute: formatMinute(item.time?.elapsed, item.time?.extra),
        team: item.team?.name || "",
        type: item.type || "Evento",
        detail: item.detail || item.comments || "Sem detalhe",
        player: item.player?.name || undefined,
        assist: item.assist?.name || undefined,
      }))
      .filter((item) => item.minute || item.team || item.detail),
    lineups: ((lineupsPayload.response || []) as any[])
      .map((item) => ({
        team: item.team?.name || "",
        coach: item.coach?.name || "—",
        formation: item.formation || "—",
        starters: (item.startXI || []).map((entry: any) => entry.player?.name || "").filter(Boolean),
        substitutes: (item.substitutes || []).map((entry: any) => entry.player?.name || "").filter(Boolean),
      }))
      .filter((item) => item.team),
    teamStats: ((statisticsPayload.response || []) as any[])
      .map((item) => ({
        team: item.team?.name || "",
        stats: [
          { label: "Posse", value: formatStatValue(item.statistics?.find((entry: any) => entry.type === "Ball Possession")?.value) },
          { label: "Finalizações", value: formatStatValue(item.statistics?.find((entry: any) => entry.type === "Total Shots")?.value) },
          { label: "No alvo", value: formatStatValue(item.statistics?.find((entry: any) => entry.type === "Shots on Goal")?.value) },
          { label: "Escanteios", value: formatStatValue(item.statistics?.find((entry: any) => entry.type === "Corner Kicks")?.value) },
          { label: "Faltas", value: formatStatValue(item.statistics?.find((entry: any) => entry.type === "Fouls")?.value) },
        ],
      }))
      .filter((item) => item.team),
    playerStats: ((playersPayload.response || []) as any[])
      .flatMap((teamBlock: any) =>
        (teamBlock.players || []).map((entry: any) => {
          const primaryStat = entry.statistics?.[0];
          return {
            player: entry.player?.name || "",
            team: teamBlock.team?.name || "",
            rating: primaryStat?.games?.rating || undefined,
            summary: buildPlayerSummary(primaryStat),
          };
        }),
      )
      .filter((item) => item.player)
      .sort((a, b) => Number.parseFloat(b.rating || "0") - Number.parseFloat(a.rating || "0"))
      .slice(0, 6),
    odds: ((oddsPayload.response || []) as any[])
      .flatMap((fixtureOdds: any) => fixtureOdds.bookmakers || [])
      .map((bookmaker: any) => {
        const matchWinner = bookmaker.bets?.find((bet: any) => bet.name === "Match Winner");
        return {
          bookmaker: bookmaker.name || "Bookmaker",
          home: matchWinner?.values?.find((value: any) => value.value === "Home")?.odd || undefined,
          draw: matchWinner?.values?.find((value: any) => value.value === "Draw")?.odd || undefined,
          away: matchWinner?.values?.find((value: any) => value.value === "Away")?.odd || undefined,
        };
      })
      .filter((item) => item.home || item.draw || item.away)
      .slice(0, 3),
    prediction: ((predictionsPayload.response || []) as any[])[0]?.predictions
      ? {
          advice: predictionsPayload.response[0].predictions.advice || undefined,
          homePercent: predictionsPayload.response[0].predictions.percent?.home || undefined,
          drawPercent: predictionsPayload.response[0].predictions.percent?.draw || undefined,
          awayPercent: predictionsPayload.response[0].predictions.percent?.away || undefined,
        }
      : undefined,
    headToHead: ((headToHeadPayload.response || []) as any[])
      .map((item) => ({
        date: formatDate(item.fixture?.date),
        league: item.league?.name || "",
        homeTeam: item.teams?.home?.name || "",
        awayTeam: item.teams?.away?.name || "",
        score: `${item.goals?.home ?? "—"}-${item.goals?.away ?? "—"}`,
      }))
      .filter((item) => item.date && item.homeTeam && item.awayTeam),
  };

  await admin.from("match_insights_cache").upsert({
    match_id: matchId,
    payload,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + TTL_MS).toISOString(),
  });

  return payload;
};
