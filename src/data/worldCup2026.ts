const flag = (code: string) => `https://flagcdn.com/w160/${code}.png`;
const worldCupLogo =
  "https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/2026_FIFA_World_Cup_logo.svg/240px-2026_FIFA_World_Cup_logo.svg.png";

export type MatchStatus = "live" | "scheduled" | "ended";

export interface WorldCupMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  stage: string;
  status: MatchStatus;
  statusLabel: string;
  date: string;
  startTime: string;
  venue: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore?: number;
  awayScore?: number;
  liveDetail?: string;
  apiSource?: "football" | "nba" | "volleyball";
  apiFixtureId?: number;
  apiLeagueId?: number;
  apiSeason?: number;
  apiHomeTeamId?: number;
  apiAwayTeamId?: number;
}

export interface WorldCupSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  league: string;
  date: string;
  sentiment: "euforia" | "tensao" | "frustracao" | "neutro";
  messagesCount: number;
  topPhrase: string;
}

const monthMap: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  março: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

const teamLogo = (team: string) => {
  const map: Record<string, string> = {
    "Mexico": flag("mx"),
    "South Africa": flag("za"),
    "South Korea": flag("kr"),
    "Czech Republic": flag("cz"),
    "Canada": flag("ca"),
    "Bosnia and Herzegovina": flag("ba"),
    "United States": flag("us"),
    "Paraguay": flag("py"),
    "Haiti": flag("ht"),
    "Scotland": flag("gb"),
    "Australia": flag("au"),
    "Turkey": flag("tr"),
    "Brazil": flag("br"),
    "Morocco": flag("ma"),
    "Qatar": flag("qa"),
    "Switzerland": flag("ch"),
    "Ivory Coast": flag("ci"),
    "Ecuador": flag("ec"),
    "Germany": flag("de"),
    "Curaçao": flag("cw"),
    "Netherlands": flag("nl"),
    "Japan": flag("jp"),
    "Sweden": flag("se"),
    "Tunisia": flag("tn"),
    "Saudi Arabia": flag("sa"),
    "Uruguay": flag("uy"),
    "Spain": flag("es"),
    "Cape Verde": flag("cv"),
    "Iran": flag("ir"),
    "New Zealand": flag("nz"),
    "Belgium": flag("be"),
    "Egypt": flag("eg"),
    "France": flag("fr"),
    "Senegal": flag("sn"),
    "Iraq": flag("iq"),
    "Norway": flag("no"),
    "Argentina": flag("ar"),
    "Algeria": flag("dz"),
    "Austria": flag("at"),
    "Jordan": flag("jo"),
    "Ghana": flag("gh"),
    "Panama": flag("pa"),
    "England": flag("gb"),
    "Croatia": flag("hr"),
    "Portugal": flag("pt"),
    "DR Congo": flag("cd"),
    "Uzbekistan": flag("uz"),
    "Colombia": flag("co"),
  };

  return map[team] || worldCupLogo;
};

type RawMatch = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const rawMatches: RawMatch[] = [
  ["wc2026-01", "Grupo A", "Mexico", "South Africa", "11 de junho de 2026", "13:00", "Estadio Azteca, Mexico City", "Abertura • 11 jun 2026"],
  ["wc2026-02", "Grupo A", "South Korea", "Czech Republic", "11 de junho de 2026", "20:00", "Estadio Akron, Guadalajara", "11 jun 2026"],
  ["wc2026-03", "Grupo B", "Canada", "Bosnia and Herzegovina", "12 de junho de 2026", "15:00", "BMO Field, Toronto", "12 jun 2026"],
  ["wc2026-04", "Grupo D", "United States", "Paraguay", "12 de junho de 2026", "18:00", "SoFi Stadium, Los Angeles", "12 jun 2026"],
  ["wc2026-05", "Grupo C", "Haiti", "Scotland", "13 de junho de 2026", "21:00", "Gillette Stadium, Boston", "13 jun 2026"],
  ["wc2026-06", "Grupo D", "Australia", "Turkey", "13 de junho de 2026", "21:00", "BC Place, Vancouver", "13 jun 2026"],
  ["wc2026-07", "Grupo C", "Brazil", "Morocco", "13 de junho de 2026", "18:00", "MetLife Stadium, New York / New Jersey", "13 jun 2026"],
  ["wc2026-08", "Grupo B", "Qatar", "Switzerland", "13 de junho de 2026", "12:00", "Levi's Stadium, San Francisco Bay Area", "13 jun 2026"],
  ["wc2026-09", "Grupo E", "Ivory Coast", "Ecuador", "14 de junho de 2026", "19:00", "Lincoln Financial Field, Philadelphia", "14 jun 2026"],
  ["wc2026-10", "Grupo E", "Germany", "Curaçao", "14 de junho de 2026", "12:00", "NRG Stadium, Houston", "14 jun 2026"],
  ["wc2026-11", "Grupo F", "Netherlands", "Japan", "14 de junho de 2026", "15:00", "AT&T Stadium, Dallas", "14 jun 2026"],
  ["wc2026-12", "Grupo F", "Sweden", "Tunisia", "14 de junho de 2026", "20:00", "Estadio BBVA, Monterrey", "14 jun 2026"],
  ["wc2026-13", "Grupo H", "Saudi Arabia", "Uruguay", "15 de junho de 2026", "18:00", "Hard Rock Stadium, Miami", "15 jun 2026"],
  ["wc2026-14", "Grupo H", "Spain", "Cape Verde", "15 de junho de 2026", "12:00", "Mercedes-Benz Stadium, Atlanta", "15 jun 2026"],
  ["wc2026-15", "Grupo G", "Iran", "New Zealand", "15 de junho de 2026", "18:00", "SoFi Stadium, Los Angeles", "15 jun 2026"],
  ["wc2026-16", "Grupo G", "Belgium", "Egypt", "15 de junho de 2026", "12:00", "Lumen Field, Seattle", "15 jun 2026"],
  ["wc2026-17", "Grupo I", "France", "Senegal", "16 de junho de 2026", "15:00", "MetLife Stadium, New York / New Jersey", "16 jun 2026"],
  ["wc2026-18", "Grupo I", "Iraq", "Norway", "16 de junho de 2026", "18:00", "Gillette Stadium, Boston", "16 jun 2026"],
  ["wc2026-19", "Grupo J", "Argentina", "Algeria", "16 de junho de 2026", "20:00", "Arrowhead Stadium, Kansas City", "16 jun 2026"],
  ["wc2026-20", "Grupo J", "Austria", "Jordan", "16 de junho de 2026", "21:00", "Levi's Stadium, San Francisco Bay Area", "16 jun 2026"],
  ["wc2026-21", "Grupo L", "Ghana", "Panama", "17 de junho de 2026", "19:00", "BMO Field, Toronto", "17 jun 2026"],
  ["wc2026-22", "Grupo L", "England", "Croatia", "17 de junho de 2026", "15:00", "AT&T Stadium, Dallas", "17 jun 2026"],
  ["wc2026-23", "Grupo K", "Portugal", "DR Congo", "17 de junho de 2026", "12:00", "NRG Stadium, Houston", "17 jun 2026"],
  ["wc2026-24", "Grupo K", "Uzbekistan", "Colombia", "17 de junho de 2026", "20:00", "Estadio Azteca, Mexico City", "17 jun 2026"],
  ["wc2026-25", "Grupo A", "Czech Republic", "South Africa", "18 de junho de 2026", "12:00", "Mercedes-Benz Stadium, Atlanta", "18 jun 2026"],
  ["wc2026-26", "Grupo B", "Switzerland", "Bosnia and Herzegovina", "18 de junho de 2026", "12:00", "SoFi Stadium, Los Angeles", "18 jun 2026"],
  ["wc2026-27", "Grupo B", "Canada", "Qatar", "18 de junho de 2026", "15:00", "BC Place, Vancouver", "18 jun 2026"],
  ["wc2026-28", "Grupo A", "Mexico", "South Korea", "18 de junho de 2026", "19:00", "Estadio Akron, Guadalajara", "18 jun 2026"],
  ["wc2026-29", "Grupo C", "Brazil", "Haiti", "19 de junho de 2026", "21:00", "Lincoln Financial Field, Philadelphia", "19 jun 2026"],
  ["wc2026-30", "Grupo C", "Scotland", "Morocco", "19 de junho de 2026", "18:00", "Gillette Stadium, Boston", "19 jun 2026"],
  ["wc2026-31", "Grupo D", "Turkey", "Paraguay", "19 de junho de 2026", "20:00", "Levi's Stadium, San Francisco Bay Area", "19 jun 2026"],
  ["wc2026-32", "Grupo D", "United States", "Australia", "19 de junho de 2026", "12:00", "Lumen Field, Seattle", "19 jun 2026"],
  ["wc2026-33", "Grupo E", "Germany", "Ivory Coast", "20 de junho de 2026", "16:00", "BMO Field, Toronto", "20 jun 2026"],
  ["wc2026-34", "Grupo E", "Ecuador", "Curaçao", "20 de junho de 2026", "19:00", "Arrowhead Stadium, Kansas City", "20 jun 2026"],
  ["wc2026-35", "Grupo F", "Netherlands", "Sweden", "20 de junho de 2026", "12:00", "NRG Stadium, Houston", "20 jun 2026"],
  ["wc2026-36", "Grupo F", "Tunisia", "Japan", "20 de junho de 2026", "22:00", "Estadio BBVA, Monterrey", "20 jun 2026"],
  ["wc2026-37", "Grupo H", "Uruguay", "Cape Verde", "21 de junho de 2026", "18:00", "Hard Rock Stadium, Miami", "21 jun 2026"],
  ["wc2026-38", "Grupo H", "Spain", "Saudi Arabia", "21 de junho de 2026", "12:00", "Mercedes-Benz Stadium, Atlanta", "21 jun 2026"],
  ["wc2026-39", "Grupo G", "Belgium", "Iran", "21 de junho de 2026", "12:00", "SoFi Stadium, Los Angeles", "21 jun 2026"],
  ["wc2026-40", "Grupo G", "New Zealand", "Egypt", "21 de junho de 2026", "18:00", "BC Place, Vancouver", "21 jun 2026"],
  ["wc2026-41", "Grupo I", "Norway", "Senegal", "22 de junho de 2026", "20:00", "MetLife Stadium, New York / New Jersey", "22 jun 2026"],
  ["wc2026-42", "Grupo I", "France", "Iraq", "22 de junho de 2026", "17:00", "Lincoln Financial Field, Philadelphia", "22 jun 2026"],
  ["wc2026-43", "Grupo J", "Argentina", "Austria", "22 de junho de 2026", "12:00", "AT&T Stadium, Dallas", "22 jun 2026"],
  ["wc2026-44", "Grupo J", "Jordan", "Algeria", "22 de junho de 2026", "20:00", "Levi's Stadium, San Francisco Bay Area", "22 jun 2026"],
  ["wc2026-45", "Grupo L", "England", "Ghana", "23 de junho de 2026", "16:00", "Gillette Stadium, Boston", "23 jun 2026"],
  ["wc2026-46", "Grupo L", "Panama", "Croatia", "23 de junho de 2026", "19:00", "BMO Field, Toronto", "23 jun 2026"],
  ["wc2026-47", "Grupo K", "Portugal", "Uzbekistan", "23 de junho de 2026", "12:00", "NRG Stadium, Houston", "23 jun 2026"],
  ["wc2026-48", "Grupo K", "Colombia", "DR Congo", "23 de junho de 2026", "20:00", "Estadio Akron, Guadalajara", "23 jun 2026"],
  ["wc2026-49", "Grupo C", "Scotland", "Brazil", "24 de junho de 2026", "18:00", "Hard Rock Stadium, Miami", "24 jun 2026"],
  ["wc2026-50", "Grupo C", "Morocco", "Haiti", "24 de junho de 2026", "18:00", "Mercedes-Benz Stadium, Atlanta", "24 jun 2026"],
  ["wc2026-51", "Grupo B", "Switzerland", "Canada", "24 de junho de 2026", "12:00", "BC Place, Vancouver", "24 jun 2026"],
  ["wc2026-52", "Grupo B", "Bosnia and Herzegovina", "Qatar", "24 de junho de 2026", "12:00", "Lumen Field, Seattle", "24 jun 2026"],
  ["wc2026-53", "Grupo A", "Czech Republic", "Mexico", "24 de junho de 2026", "19:00", "Estadio Azteca, Mexico City", "24 jun 2026"],
  ["wc2026-54", "Grupo A", "South Africa", "South Korea", "24 de junho de 2026", "19:00", "Estadio BBVA, Monterrey", "24 jun 2026"],
  ["wc2026-55", "Grupo E", "Curaçao", "Ivory Coast", "25 de junho de 2026", "16:00", "Lincoln Financial Field, Philadelphia", "25 jun 2026"],
  ["wc2026-56", "Grupo E", "Ecuador", "Germany", "25 de junho de 2026", "16:00", "MetLife Stadium, New York / New Jersey", "25 jun 2026"],
  ["wc2026-57", "Grupo F", "Japan", "Sweden", "25 de junho de 2026", "18:00", "AT&T Stadium, Dallas", "25 jun 2026"],
  ["wc2026-58", "Grupo F", "Tunisia", "Netherlands", "25 de junho de 2026", "18:00", "Arrowhead Stadium, Kansas City", "25 jun 2026"],
  ["wc2026-59", "Grupo D", "Turkey", "United States", "25 de junho de 2026", "19:00", "SoFi Stadium, Los Angeles", "25 jun 2026"],
  ["wc2026-60", "Grupo D", "Paraguay", "Australia", "25 de junho de 2026", "19:00", "Levi's Stadium, San Francisco Bay Area", "25 jun 2026"],
  ["wc2026-61", "Grupo I", "Norway", "France", "26 de junho de 2026", "15:00", "Gillette Stadium, Boston", "26 jun 2026"],
  ["wc2026-62", "Grupo I", "Senegal", "Iraq", "26 de junho de 2026", "15:00", "BMO Field, Toronto", "26 jun 2026"],
  ["wc2026-63", "Grupo G", "Egypt", "Iran", "26 de junho de 2026", "20:00", "Lumen Field, Seattle", "26 jun 2026"],
  ["wc2026-64", "Grupo G", "New Zealand", "Belgium", "26 de junho de 2026", "20:00", "BC Place, Vancouver", "26 jun 2026"],
  ["wc2026-65", "Grupo H", "Cape Verde", "Saudi Arabia", "26 de junho de 2026", "19:00", "NRG Stadium, Houston", "26 jun 2026"],
  ["wc2026-66", "Grupo H", "Uruguay", "Spain", "26 de junho de 2026", "18:00", "Estadio Akron, Guadalajara", "26 jun 2026"],
  ["wc2026-67", "Grupo L", "Panama", "England", "27 de junho de 2026", "17:00", "MetLife Stadium, New York / New Jersey", "27 jun 2026"],
  ["wc2026-68", "Grupo L", "Croatia", "Ghana", "27 de junho de 2026", "17:00", "Lincoln Financial Field, Philadelphia", "27 jun 2026"],
  ["wc2026-69", "Grupo J", "Algeria", "Austria", "27 de junho de 2026", "21:00", "Arrowhead Stadium, Kansas City", "27 jun 2026"],
  ["wc2026-70", "Grupo J", "Jordan", "Argentina", "27 de junho de 2026", "21:00", "AT&T Stadium, Dallas", "27 jun 2026"],
  ["wc2026-71", "Grupo K", "Colombia", "Portugal", "27 de junho de 2026", "19:30", "Hard Rock Stadium, Miami", "27 jun 2026"],
  ["wc2026-72", "Grupo K", "DR Congo", "Uzbekistan", "27 de junho de 2026", "19:30", "Mercedes-Benz Stadium, Atlanta", "27 jun 2026"],
  ["wc2026-73", "Round of 32", "Group A runners-up", "Group B runners-up", "28 de junho de 2026", "12:00", "SoFi Stadium, Los Angeles", "28 jun 2026"],
  ["wc2026-74", "Round of 32", "Group E winners", "Group A/B/C/D/F third place", "29 de junho de 2026", "16:30", "Gillette Stadium, Boston", "29 jun 2026"],
  ["wc2026-75", "Round of 32", "Group F winners", "Group C runners-up", "29 de junho de 2026", "19:00", "Estadio BBVA, Monterrey", "29 jun 2026"],
  ["wc2026-76", "Round of 32", "Group C winners", "Group F runners-up", "29 de junho de 2026", "12:00", "NRG Stadium, Houston", "29 jun 2026"],
  ["wc2026-77", "Round of 32", "Group I winners", "Group C/D/F/G/H third place", "30 de junho de 2026", "17:00", "MetLife Stadium, New York / New Jersey", "30 jun 2026"],
  ["wc2026-78", "Round of 32", "Group E runners-up", "Group I runners-up", "30 de junho de 2026", "12:00", "AT&T Stadium, Dallas", "30 jun 2026"],
  ["wc2026-79", "Round of 32", "Group A winners", "Group C/E/F/H/I third place", "30 de junho de 2026", "19:00", "Estadio Azteca, Mexico City", "30 jun 2026"],
  ["wc2026-80", "Round of 32", "Group L winners", "Group E/H/I/J/K third place", "1 de julho de 2026", "12:00", "Mercedes-Benz Stadium, Atlanta", "1 jul 2026"],
  ["wc2026-81", "Round of 32", "Group D winners", "Group B/E/F/I/J third place", "1 de julho de 2026", "17:00", "Levi's Stadium, San Francisco Bay Area", "1 jul 2026"],
  ["wc2026-82", "Round of 32", "Group G winners", "Group A/E/H/I/J third place", "1 de julho de 2026", "13:00", "Lumen Field, Seattle", "1 jul 2026"],
  ["wc2026-83", "Round of 32", "Group K runners-up", "Group L runners-up", "2 de julho de 2026", "19:00", "BMO Field, Toronto", "2 jul 2026"],
  ["wc2026-84", "Round of 32", "Group H winners", "Group J runners-up", "2 de julho de 2026", "12:00", "SoFi Stadium, Los Angeles", "2 jul 2026"],
  ["wc2026-85", "Round of 32", "Group B winners", "Group E/F/G/I/J third place", "2 de julho de 2026", "20:00", "BC Place, Vancouver", "2 jul 2026"],
  ["wc2026-86", "Round of 32", "Group J winners", "Group H runners-up", "3 de julho de 2026", "18:00", "Hard Rock Stadium, Miami", "3 jul 2026"],
  ["wc2026-87", "Round of 32", "Group K winners", "Group D/E/I/J/L third place", "3 de julho de 2026", "20:30", "Arrowhead Stadium, Kansas City", "3 jul 2026"],
  ["wc2026-88", "Round of 32", "Group D runners-up", "Group G runners-up", "3 de julho de 2026", "13:00", "AT&T Stadium, Dallas", "3 jul 2026"],
  ["wc2026-89", "Round of 16", "Winner Match 74", "Winner Match 77", "4 de julho de 2026", "17:00", "Lincoln Financial Field, Philadelphia", "4 jul 2026"],
  ["wc2026-90", "Round of 16", "Winner Match 73", "Winner Match 75", "4 de julho de 2026", "12:00", "NRG Stadium, Houston", "4 jul 2026"],
  ["wc2026-91", "Round of 16", "Winner Match 76", "Winner Match 78", "5 de julho de 2026", "16:00", "MetLife Stadium, New York / New Jersey", "5 jul 2026"],
  ["wc2026-92", "Round of 16", "Winner Match 79", "Winner Match 80", "5 de julho de 2026", "18:00", "Estadio Azteca, Mexico City", "5 jul 2026"],
  ["wc2026-93", "Round of 16", "Winner Match 83", "Winner Match 84", "6 de julho de 2026", "14:00", "AT&T Stadium, Dallas", "6 jul 2026"],
  ["wc2026-94", "Round of 16", "Winner Match 81", "Winner Match 82", "6 de julho de 2026", "17:00", "Lumen Field, Seattle", "6 jul 2026"],
  ["wc2026-95", "Round of 16", "Winner Match 86", "Winner Match 88", "7 de julho de 2026", "12:00", "Mercedes-Benz Stadium, Atlanta", "7 jul 2026"],
  ["wc2026-96", "Round of 16", "Winner Match 85", "Winner Match 87", "7 de julho de 2026", "13:00", "BC Place, Vancouver", "7 jul 2026"],
  ["wc2026-97", "Quarter-final", "Winner Match 89", "Winner Match 90", "9 de julho de 2026", "16:00", "Gillette Stadium, Boston", "9 jul 2026"],
  ["wc2026-98", "Quarter-final", "Winner Match 93", "Winner Match 94", "10 de julho de 2026", "12:00", "SoFi Stadium, Los Angeles", "10 jul 2026"],
  ["wc2026-99", "Quarter-final", "Winner Match 91", "Winner Match 92", "11 de julho de 2026", "17:00", "Hard Rock Stadium, Miami", "11 jul 2026"],
  ["wc2026-100", "Quarter-final", "Winner Match 95", "Winner Match 96", "11 de julho de 2026", "20:00", "Arrowhead Stadium, Kansas City", "11 jul 2026"],
  ["wc2026-101", "Semi-final", "Winner Match 97", "Winner Match 98", "14 de julho de 2026", "14:00", "AT&T Stadium, Dallas", "14 jul 2026"],
  ["wc2026-102", "Semi-final", "Winner Match 99", "Winner Match 100", "15 de julho de 2026", "15:00", "Mercedes-Benz Stadium, Atlanta", "15 jul 2026"],
  ["wc2026-103", "Third place", "Loser Match 101", "Loser Match 102", "18 de julho de 2026", "17:00", "Hard Rock Stadium, Miami", "18 jul 2026"],
  ["wc2026-104", "Final", "Winner Match 101", "Winner Match 102", "19 de julho de 2026", "15:00", "MetLife Stadium, New York / New Jersey", "19 jul 2026"],
];

const testMatch: WorldCupMatch = {
  id: "wc2026-test-01",
  homeTeam: "Brazil",
  awayTeam: "Argentina",
  league: "Copa do Mundo FIFA 2026™",
  stage: "Partida teste",
  status: "live",
  statusLabel: "Sala ao vivo",
  date: "1 de junho de 2026",
  startTime: "20:00",
  venue: "Bancada, Sala principal",
  homeTeamLogo: teamLogo("Brazil"),
  awayTeamLogo: teamLogo("Argentina"),
  homeScore: 2,
  awayScore: 1,
  liveDetail: "67'",
};

const officialWorldCupMatches: WorldCupMatch[] = rawMatches.map(
  ([id, stage, homeTeam, awayTeam, date, startTime, venue, statusLabel], index) => ({
    id,
    homeTeam,
    awayTeam,
    league: "Copa do Mundo FIFA 2026™",
    stage,
    status: index === 0 ? "live" : "scheduled",
    statusLabel,
    date,
    startTime,
    venue,
    homeTeamLogo: teamLogo(homeTeam),
    awayTeamLogo: teamLogo(awayTeam),
  }),
);

export const worldCup2026Matches: WorldCupMatch[] = [
  testMatch,
  ...officialWorldCupMatches,
];

export const featuredWorldCupMatches = worldCup2026Matches.slice(0, 12);
export const moreWorldCupMatches = worldCup2026Matches.slice(12);

export const worldCupMatchMap = Object.fromEntries(
  worldCup2026Matches.map((match) => [match.id, match]),
);

const summarySentiments: WorldCupSummary["sentiment"][] = [
  "euforia",
  "tensao",
  "neutro",
  "frustracao",
];

export const worldCupSummaries: WorldCupSummary[] = worldCup2026Matches.map((match, index) => ({
  id: match.id,
  homeTeam: match.homeTeam,
  awayTeam: match.awayTeam,
  score: "vs",
  league: `${match.stage} • ${match.league}`,
  date: `${match.date} • ${match.venue}`,
  sentiment: summarySentiments[index % summarySentiments.length],
  messagesCount: 0,
  topPhrase: `"${match.homeTeam} x ${match.awayTeam} em ${match.venue}"`,
}));

export const parseWorldCupMatchDate = (match: Pick<WorldCupMatch, "date" | "startTime">) => {
  const normalizedDate = match.date.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const result = normalizedDate.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

  if (!result) return null;

  const [, day, monthName, year] = result;
  const monthIndex = monthMap[monthName];

  if (monthIndex === undefined) return null;

  const [hours = "0", minutes = "0"] = match.startTime.split(":");
  return new Date(
    Number(year),
    monthIndex,
    Number(day),
    Number(hours),
    Number(minutes),
  );
};

export const formatBrasiliaTime = (startTime?: string) =>
  startTime ? `${startTime} BRT` : "";

const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

export const getCurrentMatchStatus = (match: Pick<WorldCupMatch, "id" | "date" | "startTime" | "status">): MatchStatus => {
  if (match.id === testMatch.id) {
    return "live";
  }

  if (match.id.startsWith("api-")) {
    return match.status;
  }

  const kickoff = parseWorldCupMatchDate(match);
  if (!kickoff) return match.status;

  const now = Date.now();
  if (now < kickoff.getTime()) return "scheduled";
  if (now <= kickoff.getTime() + LIVE_WINDOW_MS) return "live";
  return "ended";
};

export const getMatchAvailableSpots = (
  match: Pick<WorldCupMatch, "id" | "stage" | "status" | "date" | "startTime">,
) => {
  const currentStatus = getCurrentMatchStatus(match);

  if (currentStatus === "ended") return 0;
  if (match.id === testMatch.id) return 18;

  const hash = Array.from(match.id).reduce((total, char) => total + char.charCodeAt(0), 0);
  const baseCapacity =
    match.stage.includes("Final") || match.stage.includes("Semi")
      ? 48
      : match.stage.includes("Quarter")
        ? 64
        : match.stage.includes("Round")
          ? 80
          : 120;

  const liveAdjustment = currentStatus === "live" ? 36 : 0;
  return Math.max(6, baseCapacity - (hash % 42) - liveAdjustment);
};

export const getMatchStatusLabel = (match: Pick<WorldCupMatch, "id" | "date" | "startTime" | "status">) => {
  const status = getCurrentMatchStatus(match);
  if (status === "live") return "Sala ao vivo";
  if (status === "scheduled") return "Reserva disponível";
  return "Jogo encerrado";
};

export const isMatchRoomOpen = (match: Pick<WorldCupMatch, "id" | "date" | "startTime" | "status">) =>
  getCurrentMatchStatus(match) === "live";

export const isSummaryAvailableForMatch = (match: Pick<WorldCupMatch, "date" | "startTime">) => {
  const kickoff = parseWorldCupMatchDate(match);
  if (!kickoff) return false;

  return kickoff.getTime() < Date.now();
};
