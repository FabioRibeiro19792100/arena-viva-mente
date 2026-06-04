import type { WorldCupMatch } from "@/data/worldCup2026";

export interface MatchInsightEvent {
  minute: string;
  team: string;
  type: string;
  detail: string;
  player?: string;
  assist?: string;
}

export interface MatchInsightLineupTeam {
  team: string;
  coach: string;
  formation: string;
  starters: string[];
  substitutes: string[];
}

export interface MatchInsightTeamStat {
  team: string;
  stats: Array<{ label: string; value: string }>;
}

export interface MatchInsightPlayerStat {
  player: string;
  team: string;
  rating?: string;
  summary: string;
}

export interface MatchInsightOdds {
  bookmaker: string;
  home?: string;
  draw?: string;
  away?: string;
}

export interface MatchInsightPrediction {
  advice?: string;
  homePercent?: string;
  drawPercent?: string;
  awayPercent?: string;
}

export interface MatchInsightHeadToHead {
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
}

export interface MatchInsightsPayload {
  events: MatchInsightEvent[];
  lineups: MatchInsightLineupTeam[];
  teamStats: MatchInsightTeamStat[];
  playerStats: MatchInsightPlayerStat[];
  odds: MatchInsightOdds[];
  prediction?: MatchInsightPrediction;
  headToHead: MatchInsightHeadToHead[];
}

interface ApiFootballEvent {
  time?: { elapsed?: number | null; extra?: number | null };
  team?: { name?: string | null };
  player?: { name?: string | null };
  assist?: { name?: string | null };
  type?: string | null;
  detail?: string | null;
  comments?: string | null;
}

interface ApiFootballLineup {
  team?: { name?: string | null };
  formation?: string | null;
  coach?: { name?: string | null };
  startXI?: Array<{ player?: { name?: string | null } }>;
  substitutes?: Array<{ player?: { name?: string | null } }>;
}

interface ApiFootballTeamStatistic {
  team?: { name?: string | null };
  statistics?: Array<{ type?: string | null; value?: string | number | null }>;
}

interface ApiFootballPlayerBlock {
  team?: { name?: string | null };
  players?: Array<{
    player?: { name?: string | null };
    statistics?: Array<{
      games?: { rating?: string | null };
      goals?: { total?: number | null; assists?: number | null };
      shots?: { total?: number | null; on?: number | null };
      passes?: { total?: number | null; key?: number | null; accuracy?: string | null };
      tackles?: { total?: number | null };
      cards?: { yellow?: number | null; red?: number | null };
    }>;
  }>;
}

interface ApiFootballPrediction {
  predictions?: {
    advice?: string | null;
    percent?: {
      home?: string | null;
      draw?: string | null;
      away?: string | null;
    };
  };
}

interface ApiFootballOddsFixture {
  bookmakers?: Array<{
    name?: string | null;
    bets?: Array<{
      name?: string | null;
      values?: Array<{ value?: string | null; odd?: string | null }>;
    }>;
  }>;
}

interface ApiFootballHeadToHeadFixture {
  fixture?: { date?: string | null };
  league?: { name?: string | null };
  teams?: {
    home?: { name?: string | null };
    away?: { name?: string | null };
  };
  goals?: { home?: number | null; away?: number | null };
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const buildQuery = (input: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  return search.toString();
};

const fetchJsonSafely = async (url: string) => {
  const response = await fetch(url);
  if (response.status === 204) {
    return { response: [] };
  }
  if (!response.ok) {
    return { response: [] };
  }
  return response.json();
};

const formatMinute = (elapsed?: number | null, extra?: number | null) => {
  if (typeof elapsed !== "number") return "";
  return typeof extra === "number" ? `${elapsed}+${extra}'` : `${elapsed}'`;
};

const pickStat = (statistics: ApiFootballTeamStatistic["statistics"], label: string) =>
  statistics?.find((item) => item.type === label)?.value;

const formatStatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const buildPlayerSummary = (stat?: ApiFootballPlayerBlock["players"][number]["statistics"][number]) => {
  if (!stat) return "";

  const parts: string[] = [];

  if (typeof stat.goals?.total === "number" && stat.goals.total > 0) {
    parts.push(`${stat.goals.total} gol`);
  }
  if (typeof stat.goals?.assists === "number" && stat.goals.assists > 0) {
    parts.push(`${stat.goals.assists} assistência`);
  }
  if (typeof stat.shots?.on === "number" && stat.shots.on > 0) {
    parts.push(`${stat.shots.on} no alvo`);
  }
  if (typeof stat.passes?.key === "number" && stat.passes.key > 0) {
    parts.push(`${stat.passes.key} passe-chave`);
  }
  if (typeof stat.tackles?.total === "number" && stat.tackles.total > 0) {
    parts.push(`${stat.tackles.total} desarmes`);
  }
  if (typeof stat.cards?.yellow === "number" && stat.cards.yellow > 0) {
    parts.push(`${stat.cards.yellow} amarelo`);
  }
  if (typeof stat.cards?.red === "number" && stat.cards.red > 0) {
    parts.push(`${stat.cards.red} vermelho`);
  }

  return parts.slice(0, 2).join(" • ") || "Participação registrada";
};

export const getMockMatchInsights = (game: WorldCupMatch): MatchInsightsPayload | null => {
  if (game.id !== "wc2026-test-01") return null;

  return {
    events: [
      { minute: "12'", team: "Brazil", type: "Gol", detail: "Finalização dentro da área", player: "Vinicius Jr.", assist: "Bruno Guimarães" },
      { minute: "29'", team: "Argentina", type: "Cartão", detail: "Entrada dura no meio-campo", player: "Enzo Fernández" },
      { minute: "41'", team: "Argentina", type: "Gol", detail: "Empate em bola parada", player: "Julián Álvarez", assist: "Mac Allister" },
      { minute: "58'", team: "Brazil", type: "VAR", detail: "Gol validado após revisão", player: "Rodrygo" },
      { minute: "67'", team: "Brazil", type: "Gol", detail: "Rebote aproveitado na pequena área", player: "Rodrygo", assist: "Raphinha" },
      { minute: "73'", team: "Argentina", type: "Substituição", detail: "Sai Lautaro Martínez, entra Garnacho" },
      { minute: "82'", team: "Brazil", type: "Pênalti", detail: "Cobrança desperdiçada por Bruno Guimarães", player: "Bruno Guimarães" },
    ],
    lineups: [
      {
        team: "Brazil",
        coach: "Dorival Júnior",
        formation: "4-3-3",
        starters: ["Alisson", "Danilo", "Marquinhos", "Gabriel Magalhães", "Wendell", "Bruno Guimarães", "João Gomes", "Paquetá", "Raphinha", "Rodrygo", "Vinicius Jr."],
        substitutes: ["Bento", "Bremer", "Andreas Pereira", "Martinelli", "Savinho", "Endrick"],
      },
      {
        team: "Argentina",
        coach: "Lionel Scaloni",
        formation: "4-4-2",
        starters: ["Emiliano Martínez", "Molina", "Romero", "Otamendi", "Tagliafico", "De Paul", "Enzo Fernández", "Mac Allister", "Nicolás González", "Julián Álvarez", "Lautaro Martínez"],
        substitutes: ["Rulli", "Lisandro Martínez", "Paredes", "Lo Celso", "Di María", "Garnacho"],
      },
    ],
    teamStats: [
      { team: "Brazil", stats: [{ label: "Posse", value: "57%" }, { label: "Finalizações", value: "16" }, { label: "No alvo", value: "7" }, { label: "Escanteios", value: "6" }, { label: "Faltas", value: "11" }] },
      { team: "Argentina", stats: [{ label: "Posse", value: "43%" }, { label: "Finalizações", value: "9" }, { label: "No alvo", value: "4" }, { label: "Escanteios", value: "3" }, { label: "Faltas", value: "14" }] },
    ],
    playerStats: [
      { player: "Rodrygo", team: "Brazil", rating: "8.2", summary: "2 gols • 3 finalizações no alvo" },
      { player: "Bruno Guimarães", team: "Brazil", rating: "7.6", summary: "1 assistência • 5 passes-chave" },
      { player: "Julián Álvarez", team: "Argentina", rating: "7.4", summary: "1 gol • 2 finalizações no alvo" },
      { player: "Mac Allister", team: "Argentina", rating: "7.1", summary: "1 assistência • 88% de acerto no passe" },
    ],
    odds: [
      { bookmaker: "Bet365", home: "2.10", draw: "3.20", away: "3.60" },
      { bookmaker: "1xBet", home: "2.12", draw: "3.18", away: "3.55" },
    ],
    prediction: {
      advice: "Brasil ou empate e menos de 3.5 gols",
      homePercent: "48%",
      drawPercent: "29%",
      awayPercent: "23%",
    },
    headToHead: [
      { date: "22/11/2023", league: "Eliminatórias", homeTeam: "Brazil", awayTeam: "Argentina", score: "0-1" },
      { date: "17/11/2021", league: "Eliminatórias", homeTeam: "Argentina", awayTeam: "Brazil", score: "0-0" },
      { date: "11/07/2021", league: "Copa América", homeTeam: "Argentina", awayTeam: "Brazil", score: "1-0" },
      { date: "15/11/2019", league: "Amistoso", homeTeam: "Brazil", awayTeam: "Argentina", score: "0-1" },
    ],
  };
};

export const fetchFootballMatchInsights = async (game: WorldCupMatch): Promise<MatchInsightsPayload | null> => {
  if (game.apiSource !== "football" || !game.apiFixtureId) {
    return getMockMatchInsights(game);
  }

  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const payload = isLocalDev
    ? await (async () => {
        const timezone = "America/Sao_Paulo";
        const [events, lineups, statistics, players, predictions, odds, headToHead] =
          await Promise.all([
            fetchJsonSafely(`/api/football/fixtures/events?${buildQuery({ fixture: game.apiFixtureId, timezone })}`),
            fetchJsonSafely(`/api/football/fixtures/lineups?${buildQuery({ fixture: game.apiFixtureId, timezone })}`),
            fetchJsonSafely(`/api/football/fixtures/statistics?${buildQuery({ fixture: game.apiFixtureId, timezone })}`),
            fetchJsonSafely(`/api/football/fixtures/players?${buildQuery({ fixture: game.apiFixtureId, timezone })}`),
            fetchJsonSafely(`/api/football/predictions?${buildQuery({ fixture: game.apiFixtureId })}`),
            fetchJsonSafely(`/api/football/odds?${buildQuery({ fixture: game.apiFixtureId, timezone, page: 1 })}`),
            game.apiHomeTeamId && game.apiAwayTeamId
              ? fetchJsonSafely(
                  `/api/football/fixtures/headtohead?${buildQuery({
                    h2h: `${game.apiHomeTeamId}-${game.apiAwayTeamId}`,
                    league: game.apiLeagueId,
                    season: game.apiSeason,
                    last: 5,
                    timezone,
                  })}`,
                )
              : Promise.resolve({ response: [] }),
          ]);

        return {
          events: events?.response || [],
          lineups: lineups?.response || [],
          statistics: statistics?.response || [],
          players: players?.response || [],
          predictions: predictions?.response || [],
          odds: odds?.response || [],
          headToHead: headToHead?.response || [],
        };
      })()
    : await (async () => {
        const query = new URLSearchParams({
          fixture: String(game.apiFixtureId),
          timezone: "America/Sao_Paulo",
        });

        if (game.apiHomeTeamId) query.set("homeTeam", String(game.apiHomeTeamId));
        if (game.apiAwayTeamId) query.set("awayTeam", String(game.apiAwayTeamId));
        if (game.apiLeagueId) query.set("league", String(game.apiLeagueId));
        if (game.apiSeason) query.set("season", String(game.apiSeason));

        const response = await fetch(`/api/football/fixture-details?${query.toString()}`);
        if (!response.ok) {
          throw new Error("football_fixture_details_failed");
        }

        return response.json();
      })();

  const events = ((payload.events || []) as ApiFootballEvent[])
    .map((item) => ({
      minute: formatMinute(item.time?.elapsed, item.time?.extra),
      team: item.team?.name || "",
      type: item.type || "Evento",
      detail: item.detail || item.comments || "Sem detalhe",
      player: item.player?.name || undefined,
      assist: item.assist?.name || undefined,
    }))
    .filter((item) => item.minute || item.team || item.detail);

  const lineups = ((payload.lineups || []) as ApiFootballLineup[])
    .map((item) => ({
      team: item.team?.name || "",
      coach: item.coach?.name || "—",
      formation: item.formation || "—",
      starters: (item.startXI || []).map((entry) => entry.player?.name || "").filter(Boolean),
      substitutes: (item.substitutes || []).map((entry) => entry.player?.name || "").filter(Boolean),
    }))
    .filter((item) => item.team);

  const teamStats = ((payload.statistics || []) as ApiFootballTeamStatistic[])
    .map((item) => ({
      team: item.team?.name || "",
      stats: [
        { label: "Posse", value: formatStatValue(pickStat(item.statistics, "Ball Possession")) },
        { label: "Finalizações", value: formatStatValue(pickStat(item.statistics, "Total Shots")) },
        { label: "No alvo", value: formatStatValue(pickStat(item.statistics, "Shots on Goal")) },
        { label: "Escanteios", value: formatStatValue(pickStat(item.statistics, "Corner Kicks")) },
        { label: "Faltas", value: formatStatValue(pickStat(item.statistics, "Fouls")) },
      ],
    }))
    .filter((item) => item.team);

  const playerStats = ((payload.players || []) as ApiFootballPlayerBlock[])
    .flatMap((teamBlock) =>
      (teamBlock.players || []).map((entry) => {
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
    .slice(0, 6);

  const predictionSource = ((payload.predictions || []) as ApiFootballPrediction[])[0];
  const prediction = predictionSource?.predictions
    ? {
        advice: predictionSource.predictions.advice || undefined,
        homePercent: predictionSource.predictions.percent?.home || undefined,
        drawPercent: predictionSource.predictions.percent?.draw || undefined,
        awayPercent: predictionSource.predictions.percent?.away || undefined,
      }
    : undefined;

  const odds = ((payload.odds || []) as ApiFootballOddsFixture[])
    .flatMap((fixtureOdds) => fixtureOdds.bookmakers || [])
    .map((bookmaker) => {
      const matchWinner = bookmaker.bets?.find((bet) => bet.name === "Match Winner");
      const home = matchWinner?.values?.find((value) => value.value === "Home")?.odd;
      const draw = matchWinner?.values?.find((value) => value.value === "Draw")?.odd;
      const away = matchWinner?.values?.find((value) => value.value === "Away")?.odd;

      return {
        bookmaker: bookmaker.name || "Bookmaker",
        home: home || undefined,
        draw: draw || undefined,
        away: away || undefined,
      };
    })
    .filter((item) => item.home || item.draw || item.away)
    .slice(0, 3);

  const headToHead = ((payload.headToHead || []) as ApiFootballHeadToHeadFixture[])
    .map((item) => ({
      date: formatDate(item.fixture?.date),
      league: item.league?.name || "",
      homeTeam: item.teams?.home?.name || "",
      awayTeam: item.teams?.away?.name || "",
      score: `${item.goals?.home ?? "—"}-${item.goals?.away ?? "—"}`,
    }))
    .filter((item) => item.date && item.homeTeam && item.awayTeam);

  return {
    events,
    lineups,
    teamStats,
    playerStats,
    odds,
    prediction,
    headToHead,
  };
};
