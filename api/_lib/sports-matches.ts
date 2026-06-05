import {
  parseWorldCupMatchDate,
  type MatchStatus,
  worldCup2026Matches,
  type WorldCupMatch,
} from "../../src/data/worldCup2026.js";
import {
  buildFootballLeagueLabel,
  buildFootballLiveDetail,
  buildNbaLiveDetail,
  buildVolleyballLiveDetail,
  mapApiStatus,
  mapNbaStatus,
  mapVolleyballStatus,
  type ApiFootballFixture,
  type ApiNbaGame,
  type ApiVolleyballGame,
} from "../../src/lib/apiFootball.js";
import {
  normalizeSearchText,
} from "../../src/lib/matchLabels.js";

export type SportType = "futebol" | "basquete" | "volei";
export type SyncStatus = "ok" | "partial" | "offline" | "plan" | "limit" | "suspended";

export interface SportsMatchRow {
  id: string;
  provider: "internal" | "football" | "nba" | "volleyball";
  provider_match_id: string | null;
  sport: SportType;
  league_name: string;
  country_name: string | null;
  stage: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  starts_at: string;
  timezone: string;
  status: MatchStatus;
  status_detail: string | null;
  home_score: number | null;
  away_score: number | null;
  live_clock: string | null;
  venue: string | null;
  city: string | null;
  has_room: boolean;
  league_external_id: number | null;
  season: number | null;
  home_team_external_id: number | null;
  away_team_external_id: number | null;
  raw_payload: unknown;
  last_synced_at: string;
}

export interface DisplayMatch extends WorldCupMatch {
  sport: SportType;
}

export interface MatchesFeedPayload {
  matches: DisplayMatch[];
  todayMatches: DisplayMatch[];
  apiFeedStatus: {
    football: SyncStatus;
    nba: SyncStatus;
    volleyball: SyncStatus;
  };
}

const formatPtBrDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const formatPtBrTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const buildStaticStartsAt = (match: WorldCupMatch) => {
  const kickoff = parseWorldCupMatchDate(match);
  return kickoff ? kickoff.toISOString() : new Date().toISOString();
};

const inferCityFromVenue = (venue?: string) => {
  if (!venue) return null;
  const parts = venue.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
};

const statusLabelFromStatus = (status: MatchStatus) => {
  if (status === "live") return "Ao vivo";
  if (status === "ended") return "Encerrado";
  return "Agendado";
};

export const buildStaticMatchRows = () =>
  worldCup2026Matches.map<SportsMatchRow>((match) => ({
    id: match.id,
    provider: "internal",
    provider_match_id: match.id,
    sport: "futebol",
    league_name: match.league,
    country_name: null,
    stage: match.stage,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    home_logo: match.homeTeamLogo,
    away_logo: match.awayTeamLogo,
    starts_at: buildStaticStartsAt(match),
    timezone: "America/Sao_Paulo",
    status: match.status,
    status_detail: match.statusLabel || statusLabelFromStatus(match.status),
    home_score: typeof match.homeScore === "number" ? match.homeScore : null,
    away_score: typeof match.awayScore === "number" ? match.awayScore : null,
    live_clock: match.liveDetail || null,
    venue: match.venue,
    city: inferCityFromVenue(match.venue),
    has_room: true,
    league_external_id: match.apiLeagueId ?? null,
    season: match.apiSeason ?? null,
    home_team_external_id: match.apiHomeTeamId ?? null,
    away_team_external_id: match.apiAwayTeamId ?? null,
    raw_payload: match,
    last_synced_at: new Date().toISOString(),
  }));

export const buildFootballMatchRow = (fixture: ApiFootballFixture): SportsMatchRow => {
  const status = mapApiStatus(fixture.fixture.status.short);

  return {
    id: `api-football-${fixture.fixture.id}`,
    provider: "football",
    provider_match_id: String(fixture.fixture.id),
    sport: "futebol",
    league_name: buildFootballLeagueLabel(fixture.league.name, fixture.league.country),
    country_name: fixture.league.country?.trim() || null,
    stage: fixture.league.round || "Partida",
    home_team: fixture.teams.home.name,
    away_team: fixture.teams.away.name,
    home_logo: fixture.teams.home.logo || null,
    away_logo: fixture.teams.away.logo || null,
    starts_at: fixture.fixture.date,
    timezone: "America/Sao_Paulo",
    status,
    status_detail: fixture.fixture.status.long || fixture.fixture.status.short,
    home_score: fixture.goals.home ?? null,
    away_score: fixture.goals.away ?? null,
    live_clock: buildFootballLiveDetail(fixture, status) ?? null,
    venue: fixture.fixture.venue?.name?.trim() || null,
    city: fixture.fixture.venue?.city?.trim() || null,
    has_room: true,
    league_external_id: fixture.league.id,
    season: fixture.league.season,
    home_team_external_id: fixture.teams.home.id ?? null,
    away_team_external_id: fixture.teams.away.id ?? null,
    raw_payload: fixture,
    last_synced_at: new Date().toISOString(),
  };
};

export const buildNbaMatchRow = (game: ApiNbaGame): SportsMatchRow => {
  const status = mapNbaStatus(game.status.long, game.status.short);
  const leagueName = game.league?.toLowerCase() === "standard" ? "NBA" : game.league;

  return {
    id: `api-nba-${game.id}`,
    provider: "nba",
    provider_match_id: String(game.id),
    sport: "basquete",
    league_name: leagueName,
    country_name: game.arena?.country?.trim() || null,
    stage: typeof game.stage === "string" ? game.stage : `Stage ${game.stage ?? "NBA"}`,
    home_team: game.teams.home.name,
    away_team: game.teams.visitors.name,
    home_logo: game.teams.home.logo || null,
    away_logo: game.teams.visitors.logo || null,
    starts_at: game.date.start,
    timezone: "America/Sao_Paulo",
    status,
    status_detail: game.status.long || String(game.status.short),
    home_score: game.scores.home.points ?? null,
    away_score: game.scores.visitors.points ?? null,
    live_clock: buildNbaLiveDetail(game, status) ?? null,
    venue: game.arena?.name?.trim() || null,
    city: game.arena?.city?.trim() || null,
    has_room: true,
    league_external_id: null,
    season: game.season ?? null,
    home_team_external_id: null,
    away_team_external_id: null,
    raw_payload: game,
    last_synced_at: new Date().toISOString(),
  };
};

export const buildVolleyballMatchRow = (game: ApiVolleyballGame): SportsMatchRow => {
  const status = mapVolleyballStatus(game.status?.short, game.status?.long);
  const startsAt =
    game.date ||
    (typeof game.timestamp === "number" ? new Date(game.timestamp * 1000).toISOString() : new Date().toISOString());

  return {
    id: `api-volleyball-${game.id ?? Math.round(Date.now() / 1000)}`,
    provider: "volleyball",
    provider_match_id: game.id ? String(game.id) : null,
    sport: "volei",
    league_name: buildFootballLeagueLabel(
      game.league?.name || "Vôlei",
      game.country?.name || game.league?.country || null,
    ),
    country_name: game.country?.name || game.league?.country || null,
    stage: game.league?.round || game.league?.type || "Partida",
    home_team: game.teams?.home?.name || "Mandante",
    away_team: game.teams?.away?.name || "Visitante",
    home_logo: game.teams?.home?.logo || null,
    away_logo: game.teams?.away?.logo || null,
    starts_at: startsAt,
    timezone: game.timezone || "America/Sao_Paulo",
    status,
    status_detail: game.status?.long || game.status?.short || null,
    home_score: game.scores?.home ?? null,
    away_score: game.scores?.away ?? null,
    live_clock: buildVolleyballLiveDetail(game, status) ?? null,
    venue: null,
    city: null,
    has_room: true,
    league_external_id: game.league?.id ?? null,
    season: game.league?.season ?? null,
    home_team_external_id: game.teams?.home?.id ?? null,
    away_team_external_id: game.teams?.away?.id ?? null,
    raw_payload: game,
    last_synced_at: new Date().toISOString(),
  };
};

export const mapSportsMatchRowToDisplayMatch = (row: SportsMatchRow): DisplayMatch => ({
  id: row.id,
  homeTeam: row.home_team,
  awayTeam: row.away_team,
  league: row.league_name,
  stage: row.stage,
  status: row.status,
  statusLabel: row.status_detail || statusLabelFromStatus(row.status),
  date: formatPtBrDate(row.starts_at),
  startTime: formatPtBrTime(row.starts_at),
  venue:
    row.venue && row.city && !row.venue.includes(row.city)
      ? `${row.venue}, ${row.city}`
      : row.venue || row.city || "",
  homeTeamLogo: row.home_logo || "",
  awayTeamLogo: row.away_logo || "",
  homeScore: row.home_score ?? undefined,
  awayScore: row.away_score ?? undefined,
  liveDetail: row.live_clock || undefined,
  apiSource:
    row.provider === "internal"
      ? undefined
      : row.provider === "volleyball"
        ? "volleyball"
        : row.provider,
  apiFixtureId: row.provider_match_id ? Number(row.provider_match_id) : undefined,
  apiLeagueId: row.league_external_id ?? undefined,
  apiSeason: row.season ?? undefined,
  apiHomeTeamId: row.home_team_external_id ?? undefined,
  apiAwayTeamId: row.away_team_external_id ?? undefined,
  sport: row.sport,
});

export const dedupeDisplayMatches = (matches: DisplayMatch[]) =>
  Array.from(new Map(matches.map((match) => [match.id, match])).values());

export const matchesSearchText = (match: DisplayMatch) =>
  normalizeSearchText(
    [match.homeTeam, match.awayTeam, match.league, match.stage, match.venue, match.date].join(" "),
  );
