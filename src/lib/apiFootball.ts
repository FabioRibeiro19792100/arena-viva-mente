import type { MatchStatus, WorldCupMatch } from "../data/worldCup2026.js";
import { normalizeSearchText, translateTeamLabel } from "./matchLabels.js";

export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number | null;
    };
    venue?: {
      name?: string | null;
      city?: string | null;
    } | null;
  };
  league: {
    id: number;
    name: string;
    country?: string | null;
    round: string;
    season: number;
  };
  teams: {
    home: {
      id?: number;
      name: string;
      logo: string;
    };
    away: {
      id?: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface ApiNbaGame {
  id: number;
  league: string;
  season: number;
  date: {
    start: string;
  };
  stage?: number | string;
  status: {
    long: string;
    short: number | string;
    clock?: string | null;
  };
  periods?: {
    current?: number | null;
    total?: number | null;
    endOfPeriod?: boolean;
  };
  arena?: {
    name?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
  teams: {
    home: {
      name: string;
      logo: string;
    };
    visitors: {
      name: string;
      logo: string;
    };
  };
  scores: {
    home: {
      points: number | null;
    };
    visitors: {
      points: number | null;
    };
  };
}

export interface ApiVolleyballGame {
  id?: number;
  date?: string;
  time?: string;
  timestamp?: number;
  timezone?: string;
  status?: {
    short?: string;
    long?: string;
    elapsed?: number | null;
  };
  league?: {
    id?: number;
    name?: string;
    country?: string | null;
    round?: string;
    season?: number;
    type?: string;
    logo?: string;
  };
  country?: {
    name?: string;
    code?: string | null;
    flag?: string | null;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    away?: {
      id?: number;
      name?: string;
      logo?: string;
    };
  };
  scores?: {
    home?: number | null;
    away?: number | null;
  };
}

const flag = (code: string) => `https://flagcdn.com/w160/${code}.png`;

const nationalTeamFlags: Record<string, string> = {
  Mexico: flag("mx"),
  "South Africa": flag("za"),
  "South Korea": flag("kr"),
  "Czech Republic": flag("cz"),
  Canada: flag("ca"),
  "Bosnia and Herzegovina": flag("ba"),
  "United States": flag("us"),
  Paraguay: flag("py"),
  Haiti: flag("ht"),
  Scotland: flag("gb"),
  Australia: flag("au"),
  Turkey: flag("tr"),
  Brazil: flag("br"),
  Morocco: flag("ma"),
  Qatar: flag("qa"),
  Switzerland: flag("ch"),
  "Ivory Coast": flag("ci"),
  Ecuador: flag("ec"),
  Germany: flag("de"),
  "Curaçao": flag("cw"),
  Curacao: flag("cw"),
  Netherlands: flag("nl"),
  Japan: flag("jp"),
  Sweden: flag("se"),
  Tunisia: flag("tn"),
  "Saudi Arabia": flag("sa"),
  Uruguay: flag("uy"),
  Spain: flag("es"),
  "Cape Verde": flag("cv"),
  Iran: flag("ir"),
  "New Zealand": flag("nz"),
  Belgium: flag("be"),
  Egypt: flag("eg"),
  France: flag("fr"),
  Senegal: flag("sn"),
  Iraq: flag("iq"),
  Norway: flag("no"),
  Argentina: flag("ar"),
  Algeria: flag("dz"),
  Austria: flag("at"),
  Jordan: flag("jo"),
  Ghana: flag("gh"),
  Panama: flag("pa"),
  England: flag("gb"),
  Croatia: flag("hr"),
  Portugal: flag("pt"),
  "DR Congo": flag("cd"),
  Uzbekistan: flag("uz"),
  Colombia: flag("co"),
  Albania: flag("al"),
  Israel: flag("il"),
  Denmark: flag("dk"),
  Congo: flag("cg"),
  Ukraine: flag("ua"),
  Iceland: flag("is"),
  Slovenia: flag("si"),
  Montenegro: flag("me"),
  Wales: flag("gb-wls"),
  Poland: flag("pl"),
  Italy: flag("it"),
  Serbia: flag("rs"),
  Georgia: flag("ge"),
  Bahrain: flag("bh"),
  Belarus: flag("by"),
  Syria: flag("sy"),
  Greece: flag("gr"),
  Finland: flag("fi"),
  Slovakia: flag("sk"),
  Hungary: flag("hu"),
  Romania: flag("ro"),
  Latvia: flag("lv"),
};

const normalizeNationalTeamName = (teamName: string) =>
  teamName
    .replace(/\s+\((?:W|Women)\)$/i, "")
    .replace(/\s+W$/i, "")
    .replace(/\s+Women$/i, "")
    .replace(/\s+U\d{2}$/i, "")
    .replace(/\s+Olympic$/i, "")
    .trim();

const nbaLogo = (slug: string) => `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${slug}.png`;

const nbaTeamLogos: Record<string, string> = {
  "Atlanta Hawks": nbaLogo("atl"),
  "Boston Celtics": nbaLogo("bos"),
  "Brooklyn Nets": nbaLogo("bkn"),
  "Charlotte Hornets": nbaLogo("cha"),
  "Chicago Bulls": nbaLogo("chi"),
  "Cleveland Cavaliers": nbaLogo("cle"),
  "Dallas Mavericks": nbaLogo("dal"),
  "Denver Nuggets": nbaLogo("den"),
  "Detroit Pistons": nbaLogo("det"),
  "Golden State Warriors": nbaLogo("gs"),
  "Houston Rockets": nbaLogo("hou"),
  "Indiana Pacers": nbaLogo("ind"),
  "LA Clippers": nbaLogo("lac"),
  "Los Angeles Lakers": nbaLogo("lal"),
  "Memphis Grizzlies": nbaLogo("mem"),
  "Miami Heat": nbaLogo("mia"),
  "Milwaukee Bucks": nbaLogo("mil"),
  "Minnesota Timberwolves": nbaLogo("min"),
  "New Orleans Pelicans": nbaLogo("no"),
  "New York Knicks": nbaLogo("ny"),
  "Oklahoma City Thunder": nbaLogo("okc"),
  "Orlando Magic": nbaLogo("orl"),
  "Philadelphia 76ers": nbaLogo("phi"),
  "Phoenix Suns": nbaLogo("phx"),
  "Portland Trail Blazers": nbaLogo("por"),
  "Sacramento Kings": nbaLogo("sac"),
  "San Antonio Spurs": nbaLogo("sa"),
  "Toronto Raptors": nbaLogo("tor"),
  "Utah Jazz": nbaLogo("utah"),
  "Washington Wizards": nbaLogo("wsh"),
};

const formatPtBrDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const capitalizeMonth = (value: string) =>
  value.replace(/ de ([a-zà-ú]+)/i, (_, month) => ` de ${month.toLowerCase()}`);

const formatPtBrTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const buildVenue = (fixture: ApiFootballFixture) => {
  const name = fixture.fixture.venue?.name?.trim();
  const city = fixture.fixture.venue?.city?.trim();

  if (name && city) return `${name}, ${city}`;
  if (name) return name;
  return "";
};

const buildNbaVenue = (game: ApiNbaGame) => {
  const parts = [
    game.arena?.name?.trim(),
    game.arena?.city?.trim(),
  ].filter(Boolean);

  return parts.join(", ");
};

export const mapApiStatus = (shortStatus: string): MatchStatus => {
  const normalized = shortStatus.toUpperCase();

  if (["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO"].includes(normalized)) {
    return "ended";
  }

  if (["NS", "TBD"].includes(normalized)) {
    return "scheduled";
  }

  return "live";
};

export const buildFootballLiveDetail = (fixture: ApiFootballFixture, status: MatchStatus) => {
  if (status !== "live") return undefined;

  const elapsed = fixture.fixture.status.elapsed;
  if (typeof elapsed === "number" && Number.isFinite(elapsed)) {
    return `${elapsed}'`;
  }

  return fixture.fixture.status.long || undefined;
};

export const buildNbaLiveDetail = (game: ApiNbaGame, status: MatchStatus) => {
  if (status !== "live") return undefined;

  const currentPeriod = typeof game.periods?.current === "number" ? game.periods.current : null;
  const clock = game.status.clock;

  if (currentPeriod && clock) {
    return `Q${currentPeriod} ${clock}`;
  }

  if (currentPeriod) {
    return `Q${currentPeriod}`;
  }

  return game.status.long || undefined;
};

const buildFixtureKey = (homeTeam: string, awayTeam: string, date: string) =>
  `${normalizeSearchText(homeTeam)}::${normalizeSearchText(awayTeam)}::${formatPtBrDate(date)}`;

export const resolveFootballVisual = (teamName: string, fallbackLogo: string) =>
  nationalTeamFlags[normalizeNationalTeamName(teamName)] || fallbackLogo;

export const resolveNationalTeamVisual = (teamName: string, fallbackLogo: string) =>
  nationalTeamFlags[normalizeNationalTeamName(teamName)] || fallbackLogo;

export const resolveNbaVisual = (teamName: string, fallbackLogo: string) =>
  nbaTeamLogos[teamName] || fallbackLogo;

export const buildFootballLeagueLabel = (leagueName?: string | null, country?: string | null) => {
  const trimmedLeagueName = leagueName?.trim();
  const trimmedCountry = country?.trim();
  const countryLabel = trimmedCountry ? translateTeamLabel(trimmedCountry) : "";

  if (!trimmedLeagueName) return "";
  if (!trimmedCountry || trimmedCountry.toLowerCase() === "world") return trimmedLeagueName;
  if (trimmedLeagueName.toLowerCase().includes(`(${trimmedCountry.toLowerCase()})`)) return trimmedLeagueName;

  return `${trimmedLeagueName} (${countryLabel || trimmedCountry})`;
};

const buildFootballLeagueLabelFromFixture = (fixture: ApiFootballFixture) => {
  const leagueName = fixture.league.name?.trim();
  const country = fixture.league.country?.trim();
  const countryLabel = country ? translateTeamLabel(country) : "";

  if (!leagueName) return "";
  if (!country || country.toLowerCase() === "world") return leagueName;
  if (leagueName.toLowerCase().includes(`(${country.toLowerCase()})`)) return leagueName;

  return `${leagueName} (${countryLabel || country})`;
};

const buildVolleyballLeagueLabel = (game: ApiVolleyballGame) => {
  const leagueName = game.league?.name?.trim();
  const country = game.league?.country?.trim() || game.country?.name?.trim();
  const countryLabel = country ? translateTeamLabel(country) : "";

  if (!leagueName) return "Vôlei";
  if (!country || country.toLowerCase() === "world") return leagueName;
  if (leagueName.toLowerCase().includes(`(${country.toLowerCase()})`)) return leagueName;

  return `${leagueName} (${countryLabel || country})`;
};

export const mapNbaStatus = (statusLong: string, statusShort: number | string): MatchStatus => {
  const shortStatus = String(statusShort);

  return shortStatus === "1"
    ? "scheduled"
    : shortStatus === "3" || shortStatus === "4" || shortStatus === "5" || shortStatus === "6"
      ? "ended"
      : statusLong.toLowerCase().includes("finished")
        ? "ended"
        : "live";
};

export const mapVolleyballStatus = (
  shortStatus?: string | null,
  _longStatus?: string | null,
): MatchStatus => {
  const normalized = String(shortStatus || "").toUpperCase();

  if (normalized === "NS" || normalized === "TBD") {
    return "scheduled";
  }

  if (["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO"].includes(normalized)) {
    return "ended";
  }

  return "live";
};

export const buildVolleyballLiveDetail = (game: ApiVolleyballGame, status: MatchStatus) => {
  if (status !== "live") return undefined;

  if (typeof game.status?.elapsed === "number" && Number.isFinite(game.status.elapsed)) {
    return `${game.status.elapsed}'`;
  }

  return game.status?.long || undefined;
};

export const mapApiFixtureToWorldCupMatch = (fixture: ApiFootballFixture): WorldCupMatch => {
  const venue = buildVenue(fixture);
  const formattedDate = capitalizeMonth(formatPtBrDate(fixture.fixture.date));
  const formattedTime = formatPtBrTime(fixture.fixture.date);
  const status = mapApiStatus(fixture.fixture.status.short);

  return {
    id: `api-football-${fixture.fixture.id}`,
    homeTeam: fixture.teams.home.name,
    awayTeam: fixture.teams.away.name,
    league: buildFootballLeagueLabelFromFixture(fixture),
    stage: fixture.league.round,
    status,
    statusLabel: fixture.fixture.status.long,
    date: formattedDate,
    startTime: formattedTime,
    venue,
    homeTeamLogo: resolveFootballVisual(fixture.teams.home.name, fixture.teams.home.logo),
    awayTeamLogo: resolveFootballVisual(fixture.teams.away.name, fixture.teams.away.logo),
    homeScore: fixture.goals.home ?? undefined,
    awayScore: fixture.goals.away ?? undefined,
    liveDetail: buildFootballLiveDetail(fixture, status),
    apiSource: "football",
    apiFixtureId: fixture.fixture.id,
    apiLeagueId: fixture.league.id,
    apiSeason: fixture.league.season,
    apiHomeTeamId: fixture.teams.home.id,
    apiAwayTeamId: fixture.teams.away.id,
  };
};

export const mapApiNbaGameToMatch = (game: ApiNbaGame): WorldCupMatch => {
  const status = mapNbaStatus(game.status.long, game.status.short);

  return {
    id: `api-nba-${game.id}`,
    homeTeam: game.teams.home.name,
    awayTeam: game.teams.visitors.name,
    league: "NBA",
    stage: game.league || "NBA",
    status,
    statusLabel: game.status.long,
    date: capitalizeMonth(formatPtBrDate(game.date.start)),
    startTime: formatPtBrTime(game.date.start),
    venue: buildNbaVenue(game),
    homeTeamLogo: resolveNbaVisual(game.teams.home.name, game.teams.home.logo),
    awayTeamLogo: resolveNbaVisual(game.teams.visitors.name, game.teams.visitors.logo),
    homeScore: game.scores.home.points ?? undefined,
    awayScore: game.scores.visitors.points ?? undefined,
    liveDetail: buildNbaLiveDetail(game, status),
    apiSource: "nba",
  };
};

export const mapApiVolleyballGameToMatch = (game: ApiVolleyballGame): WorldCupMatch => {
  const rawDate = game.date || "";
  const rawStatus = game.status;
  const status = mapVolleyballStatus(rawStatus?.short, rawStatus?.long);
  const liveDetail = buildVolleyballLiveDetail(game, status);

  return {
    id: `api-volleyball-${game.id}`,
    homeTeam: game.teams?.home?.name || "Mandante",
    awayTeam: game.teams?.away?.name || "Visitante",
    league: buildVolleyballLeagueLabel(game),
    stage: game.league?.round || game.league?.name || "Vôlei",
    status,
    statusLabel: rawStatus?.long || "",
    date: capitalizeMonth(formatPtBrDate(rawDate)),
    startTime: formatPtBrTime(rawDate),
    venue: "",
    homeTeamLogo: game.teams?.home?.logo || "",
    awayTeamLogo: game.teams?.away?.logo || "",
    homeScore: game.scores?.home ?? undefined,
    awayScore: game.scores?.away ?? undefined,
    liveDetail,
    apiSource: "volleyball",
  };
};

export const mergeStaticMatchesWithApiFixtures = (
  matches: WorldCupMatch[],
  fixtures: ApiFootballFixture[],
) => {
  const fixtureMap = new Map(
    fixtures.map((fixture) => [
      buildFixtureKey(
        fixture.teams.home.name,
        fixture.teams.away.name,
        fixture.fixture.date,
      ),
      fixture,
    ]),
  );

  return matches.map((match) => {
    const fixture = fixtureMap.get(
      `${normalizeSearchText(match.homeTeam)}::${normalizeSearchText(match.awayTeam)}::${match.date}`,
    );

    if (!fixture) {
      return match;
    }

    const venue = buildVenue(fixture) || match.venue;
    const status = mapApiStatus(fixture.fixture.status.short);
    const fixtureDate = capitalizeMonth(formatPtBrDate(fixture.fixture.date));
    const fixtureTime = formatPtBrTime(fixture.fixture.date);

    return {
      ...match,
      league: buildFootballLeagueLabelFromFixture(fixture) || match.league,
      stage: fixture.league.round || match.stage,
      status,
      statusLabel: fixture.fixture.status.long || match.statusLabel,
      date: fixtureDate,
      startTime: fixtureTime,
      venue,
      homeTeamLogo: resolveFootballVisual(fixture.teams.home.name, fixture.teams.home.logo) || match.homeTeamLogo,
      awayTeamLogo: resolveFootballVisual(fixture.teams.away.name, fixture.teams.away.logo) || match.awayTeamLogo,
      homeScore: fixture.goals.home ?? match.homeScore,
      awayScore: fixture.goals.away ?? match.awayScore,
      liveDetail: buildFootballLiveDetail(fixture, status) || match.liveDetail,
      apiSource: "football",
      apiFixtureId: fixture.fixture.id,
      apiLeagueId: fixture.league.id,
      apiSeason: fixture.league.season,
      apiHomeTeamId: fixture.teams.home.id,
      apiAwayTeamId: fixture.teams.away.id,
    };
  });
};
