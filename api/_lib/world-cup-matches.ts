import {
  parseWorldCupMatchDate,
  type MatchStatus,
  type WorldCupMatch,
  worldCupSeedMatches,
} from "../../src/data/worldCup2026.js";
import { teamNamePtBr, translateTeamLabel } from "../../src/lib/matchLabels.js";
import { getSupabaseAdmin } from "./supabase-admin.js";

const WORLD_CUP_SOURCE_URL = "https://ge.globo.com/futebol/copa-do-mundo/";
const WORLD_CUP_LEAGUE_NAME = "World Cup";

export interface WorldCupMatchRow {
  id: string;
  stage: string;
  group_name: string | null;
  match_number: number;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  kickoff_at: string;
  timezone: string;
  venue: string | null;
  city: string | null;
  status: MatchStatus;
  status_detail: string | null;
  home_score: number | null;
  away_score: number | null;
  live_clock: string | null;
  linked_sports_match_id: string | null;
  source: string;
  source_url: string | null;
  source_payload: unknown;
  last_score_sync_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export type WorldCupPoolMatch = WorldCupMatch & {
  linkedSportsMatchId?: string | null;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const teamNameCanonical = new Map(
  Object.entries(teamNamePtBr).flatMap(([canonicalName, ptBrName]) => [
    [canonicalName, canonicalName],
    [ptBrName, canonicalName],
  ]),
);

const toCanonicalTeamName = (name: string) => teamNameCanonical.get(name) || name;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const inferCityFromVenue = (venue?: string) => {
  if (!venue) return null;
  const parts = venue.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
};

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

const normalizeVenue = (venue: string | null, city: string | null) =>
  venue && city && !venue.includes(city) ? `${venue}, ${city}` : venue || city || "";

const buildStatusLabel = (status: MatchStatus, statusDetail: string | null) => {
  if (statusDetail?.trim()) return statusDetail.trim();
  if (status === "live") return "Ao vivo";
  if (status === "ended") return "Encerrado";
  return "Agendado";
};

const additionalTeamVariants: Record<string, string[]> = {
  "Bosnia and Herzegovina": ["Bósnia", "Bosnia", "Bósnia e Herzegovina"],
  "Bósnia e Herzegovina": ["Bósnia", "Bosnia", "Bosnia and Herzegovina"],
};

const buildTeamVariants = (teamName: string) => {
  const translated = translateTeamLabel(teamName);
  return Array.from(
    new Set([
      teamName,
      translated,
      ...(additionalTeamVariants[teamName] || []),
      ...(translated ? additionalTeamVariants[translated] || [] : []),
    ].filter(Boolean)),
  );
};

const geTeamSlugByName: Record<string, string> = {
  Algeria: "argelia",
  Argentina: "argentina",
  Australia: "australia",
  Austria: "austria",
  Belgium: "belgica",
  "Bosnia and Herzegovina": "bosnia-herzegovina",
  Brazil: "brasil",
  Canada: "canada",
  Colombia: "colombia",
  Croatia: "croacia",
  Curacao: "curacao",
  "Czech Republic": "republica-tcheca",
  Ecuador: "equador",
  Egypt: "egito",
  England: "inglaterra",
  France: "franca",
  Germany: "alemanha",
  Ghana: "gana",
  Haiti: "haiti",
  Iran: "ira",
  Iraq: "iraque",
  "Ivory Coast": "costa-do-marfim",
  Japan: "japao",
  Jordan: "jordania",
  Mexico: "mexico",
  Morocco: "marrocos",
  Netherlands: "holanda",
  "New Zealand": "nova-zelandia",
  Norway: "noruega",
  Panama: "panama",
  Paraguay: "paraguai",
  Portugal: "portugal",
  Qatar: "catar",
  "Saudi Arabia": "arabia-saudita",
  Scotland: "escocia",
  Senegal: "senegal",
  "South Africa": "africa-do-sul",
  "South Korea": "coreia-do-sul",
  Spain: "espanha",
  Sweden: "suecia",
  Switzerland: "suica",
  Tunisia: "tunisia",
  Turkey: "turquia",
  Uruguay: "uruguai",
  "United States": "estados-unidos",
  Uzbekistan: "uzbequistao",
  "DR Congo": "rd-congo",
  "Cape Verde": "cabo-verde",
};

const slugifyGePathPart = (value: string) => {
  const canonical = geTeamSlugByName[value];
  if (canonical) return canonical;

  return translateTeamLabel(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\be\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const hasResolvedTeams = (match: Pick<WorldCupMatchRow, "home_team" | "away_team">) =>
  !/(group\s+[a-z]|winner match|loser match|runners-up|winners|third place)/i.test(
    `${match.home_team} ${match.away_team}`,
  );

const buildMatchKey = (homeTeam: string, awayTeam: string, kickoffAt: string) => {
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(kickoffAt));

  return `${normalizeText(homeTeam)}__${normalizeText(awayTeam)}__${localDate}`;
};

const buildMatchKeys = (homeTeam: string, awayTeam: string, kickoffAt: string) => {
  const homeVariants = buildTeamVariants(homeTeam);
  const awayVariants = buildTeamVariants(awayTeam);
  const keys = new Set<string>();

  for (const homeVariant of homeVariants) {
    for (const awayVariant of awayVariants) {
      keys.add(buildMatchKey(homeVariant, awayVariant, kickoffAt));
    }
  }

  return Array.from(keys);
};

const matchesTeamPair = (
  homeTeam: string,
  awayTeam: string,
  candidateHomeTeam: string,
  candidateAwayTeam: string,
) => {
  const homeVariants = buildTeamVariants(homeTeam).map(normalizeText);
  const awayVariants = buildTeamVariants(awayTeam).map(normalizeText);
  const candidateHomeVariants = buildTeamVariants(candidateHomeTeam).map(normalizeText);
  const candidateAwayVariants = buildTeamVariants(candidateAwayTeam).map(normalizeText);

  return (
    homeVariants.some((value) => candidateHomeVariants.includes(value)) &&
    awayVariants.some((value) => candidateAwayVariants.includes(value))
  );
};

const buildCanonicalMatchKey = (stage: string, homeTeam: string, awayTeam: string) =>
  `${normalizeText(stage)}__${normalizeText(toCanonicalTeamName(homeTeam))}__${normalizeText(toCanonicalTeamName(awayTeam))}`;

const canonicalMatchesByKey = new Map(
  worldCupSeedMatches.map((match, index) => [
    buildCanonicalMatchKey(match.stage, match.homeTeam, match.awayTeam),
    { id: match.id, matchNumber: index + 1 },
  ]),
);

const getCanonicalMatchMeta = (stage: string, homeTeam: string, awayTeam: string) =>
  canonicalMatchesByKey.get(buildCanonicalMatchKey(stage, homeTeam, awayTeam)) || null;

const getWorldCupRowFreshness = (row: WorldCupMatchRow) => {
  const hasScore = typeof row.home_score === "number" && typeof row.away_score === "number";
  const statusWeight = row.status === "ended" ? 3 : row.status === "live" ? 2 : 1;
  const sourceWeight =
    row.source === "ge_match_page" ? 4 : row.source === "ge" ? 3 : row.source === "fallback" ? 2 : 1;
  const timeWeight = Date.parse(row.last_score_sync_at || row.updated_at || row.created_at || "") || 0;

  return [hasScore ? 1 : 0, statusWeight, sourceWeight, timeWeight] as const;
};

const sanitizeFutureWorldCupRow = (row: WorldCupMatchRow) => {
  const kickoffMs = Date.parse(row.kickoff_at);
  if (!Number.isFinite(kickoffMs)) return row;

  if (kickoffMs > Date.now() + 15 * 60 * 1000) {
    return {
      ...row,
      status: "scheduled" as const,
      status_detail:
        row.status_detail && /fique por dentro|agendado/i.test(row.status_detail)
          ? row.status_detail
          : "Agendado",
      home_score: null,
      away_score: null,
      live_clock: null,
    };
  }

  return row;
};

const preferWorldCupRow = (left: WorldCupMatchRow, right: WorldCupMatchRow) => {
  const leftFreshness = getWorldCupRowFreshness(left);
  const rightFreshness = getWorldCupRowFreshness(right);

  for (let index = 0; index < leftFreshness.length; index += 1) {
    if (leftFreshness[index] > rightFreshness[index]) return left;
    if (leftFreshness[index] < rightFreshness[index]) return right;
  }

  return left;
};

const canonicalizeWorldCupRows = (rows: WorldCupMatchRow[]) => {
  const byCanonicalId = new Map<string, WorldCupMatchRow>();

  for (const row of rows) {
    const canonicalMeta = getCanonicalMatchMeta(row.stage, row.home_team, row.away_team);
    const canonicalRow = sanitizeFutureWorldCupRow(
      canonicalMeta
      ? {
          ...row,
          id: canonicalMeta.id,
          match_number: canonicalMeta.matchNumber,
        }
      : row,
    );

    const existing = byCanonicalId.get(canonicalRow.id);
    byCanonicalId.set(canonicalRow.id, existing ? preferWorldCupRow(existing, canonicalRow) : canonicalRow);
  }

  return Array.from(byCanonicalId.values()).sort((left, right) => left.match_number - right.match_number);
};

const mapWorldCupRowToMatch = (row: WorldCupMatchRow): WorldCupPoolMatch => ({
  id: row.id,
  homeTeam: translateTeamLabel(row.home_team),
  awayTeam: translateTeamLabel(row.away_team),
  league: WORLD_CUP_LEAGUE_NAME,
  stage: row.stage,
  status: row.status,
  statusLabel: buildStatusLabel(row.status, row.status_detail),
  date: formatPtBrDate(row.kickoff_at),
  startTime: formatPtBrTime(row.kickoff_at),
  venue: normalizeVenue(row.venue, row.city),
  homeTeamLogo: row.home_flag,
  awayTeamLogo: row.away_flag,
  homeScore: row.home_score ?? undefined,
  awayScore: row.away_score ?? undefined,
  liveDetail: row.live_clock ?? undefined,
  linkedSportsMatchId: row.linked_sports_match_id ?? undefined,
});

const buildSeedBackedWorldCupRow = (match: WorldCupMatch, matchNumber: number): WorldCupMatchRow => {
  const kickoff = parseWorldCupMatchDate(match);

  if (!kickoff) {
    throw new Error(`world_cup_seed_kickoff_parse_failed:${match.id}`);
  }

  const [venueName, ...cityParts] = match.venue.split(",").map((part) => part.trim());
  const city = cityParts.length > 0 ? cityParts.join(", ") : null;

  return {
    id: match.id,
    stage: match.stage,
    group_name: match.stage,
    match_number: matchNumber,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    home_flag: match.homeTeamLogo,
    away_flag: match.awayTeamLogo,
    kickoff_at: kickoff.toISOString(),
    timezone: "America/Sao_Paulo",
    venue: venueName || match.venue || null,
    city,
    status: "scheduled",
    status_detail: "Agendado",
    home_score: null,
    away_score: null,
    live_clock: null,
    linked_sports_match_id: null,
    source: "canonical_registry",
    source_url: null,
    source_payload: {
      source: "canonical_registry",
    },
    last_score_sync_at: null,
  };
};

const upsertWorldCupRows = async (rows: WorldCupMatchRow[]) => {
  if (rows.length === 0) return;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("world_cup_matches").upsert(
    rows.map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );

  if (error) throw error;
};

const isMissingWorldCupTableError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : "";

  return (
    /world_cup_matches/i.test(message) &&
    /(does not exist|relation|schema cache)/i.test(message)
  );
};

export const ensureWorldCupGroupStageSeeded = async () => {
  try {
    const existingRows = await loadExistingWorldCupRowsSafe();
    const geRows = await loadGeSeedRowsSafe();
    const canonicalRows = buildCanonicalWorldCupRows(existingRows, geRows);
    await upsertWorldCupRows(canonicalRows);
  } catch (error) {
    if (isMissingWorldCupTableError(error)) {
      return 0;
    }
    throw error;
  }
  const admin = getSupabaseAdmin();
  const { count } = await admin.from("world_cup_matches").select("id", { count: "exact", head: true });
  return count || 0;
};

const loadWorldCupRows = async () => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("world_cup_matches")
    .select("*")
    .order("match_number", { ascending: true });

  if (error) throw error;

  const rawRows = (data || []) as WorldCupMatchRow[];
  const canonicalRows = canonicalizeWorldCupRows(rawRows);
  const needsRepair =
    rawRows.length !== canonicalRows.length ||
    rawRows.some((row) => {
      const canonicalMeta = getCanonicalMatchMeta(row.stage, row.home_team, row.away_team);
      return Boolean(
        canonicalMeta && (row.id !== canonicalMeta.id || row.match_number !== canonicalMeta.matchNumber),
      );
    });

  if (needsRepair && canonicalRows.length > 0) {
    await upsertWorldCupRows(canonicalRows);
  }

  return canonicalRows;
};

const loadExistingWorldCupRowsSafe = async () => {
  try {
    return await loadWorldCupRows();
  } catch (error) {
    if (isMissingWorldCupTableError(error)) {
      return [] as WorldCupMatchRow[];
    }

    throw error;
  }
};

export const getWorldCupPoolMatches = async () => {
  await ensureWorldCupGroupStageSeeded();
  await syncWorldCupScoresFromGe().catch(() => ({ updated: 0, source: WORLD_CUP_SOURCE_URL }));
  let rows = await loadWorldCupRows();
  rows = await applyGeMatchPageOverrides(rows);
  rows = buildCanonicalWorldCupRows(rows, []);

  return applyEmergencyScoreOverrides(rows).map(mapWorldCupRowToMatch);
};

export const syncWorldCupScoresFromSportsSnapshot = async () => {
  await ensureWorldCupGroupStageSeeded();
  const admin = getSupabaseAdmin();
  const [worldCupRows, sportsRowsResult] = await Promise.all([
    loadWorldCupRows(),
    admin
      .from("sports_matches")
      .select("*")
      .eq("sport", "futebol")
      .or("league_name.ilike.%World Cup%,league_name.ilike.%Copa do Mundo%"),
  ]);

  if (sportsRowsResult.error) {
    throw sportsRowsResult.error;
  }

  const sportsRows = sportsRowsResult.data || [];
  const sportsByKey = new Map(
    sportsRows.map((row) => [buildMatchKey(row.home_team, row.away_team, row.starts_at), row]),
  );

  const updates = worldCupRows.flatMap((row) => {
    const sportsMatch = sportsByKey.get(buildMatchKey(row.home_team, row.away_team, row.kickoff_at));
    if (!sportsMatch) return [];

    return [
      {
        ...row,
        status: sportsMatch.status,
        status_detail: sportsMatch.status_detail,
        home_score: sportsMatch.home_score,
        away_score: sportsMatch.away_score,
        live_clock: sportsMatch.live_clock,
        linked_sports_match_id: sportsMatch.id,
        source: "sports_matches",
        source_url: WORLD_CUP_SOURCE_URL,
        source_payload: sportsMatch.raw_payload,
        last_score_sync_at: new Date().toISOString(),
      } satisfies WorldCupMatchRow,
    ];
  });

  await upsertWorldCupRows(updates);
  return { updated: updates.length };
};

interface ParsedScoreUpdate {
  id: string;
  home_score: number;
  away_score: number;
  status: MatchStatus;
  status_detail: string | null;
  live_clock: string | null;
  source_payload: unknown;
}

interface GeMatchedRowContext {
  row: WorldCupMatchRow;
  canonicalKey: string;
}

interface GeMatchPageOverride {
  kickoff_at: string | null;
  venue: string | null;
  city: string | null;
  status: MatchStatus | null;
  status_detail: string | null;
  home_score: number | null;
  away_score: number | null;
  source_payload: unknown;
}

interface GeGroupTeam {
  nome_popular: string;
  escudo?: string | null;
}

interface GeGroupMatch {
  id?: number;
  data_realizacao: string;
  hora_realizacao?: string | null;
  jogo_ja_comecou: boolean;
  placar_oficial_mandante: number | null;
  placar_oficial_visitante: number | null;
  equipes: {
    mandante: GeGroupTeam;
    visitante: GeGroupTeam;
  };
  transmissao?: {
    label?: string | null;
    broadcast?: {
      id?: string | null;
      label?: string | null;
    } | null;
  } | null;
  sede?: {
    nome_popular?: string | null;
  } | null;
}

interface GeGroup {
  nome_grupo?: string | null;
  lista_jogos?: GeGroupMatch[] | null;
}

const simplifyHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractJsonArray = (source: string, anchor: string) => {
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex < 0) return null;

  const startIndex = source.indexOf("[", anchorIndex + anchor.length);
  if (startIndex < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;

    if (depth === 0) {
      return source.slice(startIndex, index + 1);
    }
  }

  return null;
};

const parseGeGroupsData = (html: string) => {
  const rawGroups = extractJsonArray(html, "const grupos_fase =");
  if (!rawGroups) return [] as GeGroup[];

  try {
    return JSON.parse(rawGroups) as GeGroup[];
  } catch {
    return [] as GeGroup[];
  }
};

const fetchWorldCupSourceHtml = async () => {
  const response = await fetch(WORLD_CUP_SOURCE_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`world_cup_source_failed:${response.status}`);
  }

  return response.text();
};

const parseGeKickoffAt = (value: string, fallbackTime?: string | null) => {
  const [datePart, timePartFromValue = "00:00"] = value.split("T");
  const timePart = (fallbackTime?.slice(0, 5) || timePartFromValue || "00:00").slice(0, 5);
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours + 3, minutes || 0)).toISOString();
};

const buildGeMatchPageUrl = (match: Pick<WorldCupMatchRow, "kickoff_at" | "home_team" | "away_team">) => {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(match.kickoff_at));
  const [day, month, year] = date.split("/");
  return `${WORLD_CUP_SOURCE_URL}jogo/${day}-${month}-${year}/${slugifyGePathPart(match.home_team)}-${slugifyGePathPart(match.away_team)}.ghtml`;
};

const extractJsonLdBlocks = (html: string) =>
  Array.from(html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))
    .map((match) => match[1])
    .flatMap((raw) => {
      try {
        return [JSON.parse(raw)];
      } catch {
        return [];
      }
    });

const parseGeMatchPageOverride = (html: string): GeMatchPageOverride | null => {
  const jsonLdBlocks = extractJsonLdBlocks(html);
  const sportsEvent =
    jsonLdBlocks.find((item) =>
      item &&
      typeof item === "object" &&
      ("startDate" in item || "location" in item) &&
      ("competitor" in item || "name" in item),
    ) || null;

  const startDate =
    sportsEvent &&
    typeof sportsEvent === "object" &&
    "startDate" in sportsEvent &&
    typeof (sportsEvent as { startDate?: unknown }).startDate === "string"
      ? new Date((sportsEvent as { startDate: string }).startDate).toISOString()
      : null;

  const venue =
    sportsEvent &&
    typeof sportsEvent === "object" &&
    "location" in sportsEvent &&
    sportsEvent.location &&
    typeof sportsEvent.location === "object" &&
    "name" in sportsEvent.location &&
    typeof (sportsEvent.location as { name?: unknown }).name === "string"
      ? String((sportsEvent.location as { name: string }).name).trim()
      : null;

  const city =
    sportsEvent &&
    typeof sportsEvent === "object" &&
    "location" in sportsEvent &&
    sportsEvent.location &&
    typeof sportsEvent.location === "object" &&
    "address" in sportsEvent.location &&
    sportsEvent.location.address &&
    typeof sportsEvent.location.address === "object" &&
    "addressRegion" in sportsEvent.location.address &&
    typeof (sportsEvent.location.address as { addressRegion?: unknown }).addressRegion === "string"
      ? String((sportsEvent.location.address as { addressRegion: string }).addressRegion).trim()
      : null;

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || "";
  const scoreMatch = title.match(/(\d+)\s*x\s*(\d+)/i);
  const now = Date.now();
  const kickoffMs = startDate ? new Date(startDate).getTime() : null;
  const inferredStatus: MatchStatus | null = scoreMatch
    ? "ended"
    : kickoffMs && kickoffMs <= now
      ? now - kickoffMs < 3 * 60 * 60 * 1000
        ? "live"
        : "ended"
      : startDate
        ? "scheduled"
        : null;

  if (!startDate && !scoreMatch && !venue) {
    return null;
  }

  return {
    kickoff_at: startDate,
    venue,
    city,
    status: inferredStatus,
    status_detail:
      inferredStatus === "ended"
        ? "Encerrado"
        : inferredStatus === "live"
          ? "Ao vivo"
          : inferredStatus === "scheduled"
            ? "Agendado"
            : null,
    home_score: scoreMatch ? Number(scoreMatch[1]) : null,
    away_score: scoreMatch ? Number(scoreMatch[2]) : null,
    source_payload: {
      source: "ge_match_page",
      title,
    },
  };
};

const shouldRefreshFromGeMatchPage = (row: WorldCupMatchRow) => {
  if (!hasResolvedTeams(row)) {
    return false;
  }

  const now = Date.now();
  const kickoffMs = new Date(row.kickoff_at).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const isNearKickoffWindow = kickoffMs >= now - 2 * dayMs && kickoffMs <= now + dayMs;
  const isPastUnresolved =
    kickoffMs < now &&
    (row.status !== "ended" || typeof row.home_score !== "number" || typeof row.away_score !== "number");

  return isNearKickoffWindow || isPastUnresolved;
};

const applyGeMatchPageOverrides = async (rows: WorldCupMatchRow[]) => {
  const candidates = rows.filter(shouldRefreshFromGeMatchPage);
  if (candidates.length === 0) return rows;

  const overrides = await Promise.all(
    candidates.map(async (row) => {
      try {
        const response = await fetch(buildGeMatchPageUrl(row), {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (!response.ok) return [row.id, null] as const;

        const html = await response.text();
        return [row.id, parseGeMatchPageOverride(html)] as const;
      } catch {
        return [row.id, null] as const;
      }
    }),
  );

  const overrideById = new Map(overrides);

  return rows.map((row) => {
    const override = overrideById.get(row.id);
    if (!override) return row;

    return {
      ...row,
      kickoff_at: override.kickoff_at || row.kickoff_at,
      venue: override.venue || row.venue,
      city: override.city || row.city,
      status: override.status || row.status,
      status_detail: override.status_detail || row.status_detail,
      home_score: typeof override.home_score === "number" ? override.home_score : row.home_score,
      away_score: typeof override.away_score === "number" ? override.away_score : row.away_score,
      source: "ge_match_page",
      source_url: buildGeMatchPageUrl(row),
      source_payload: override.source_payload,
      last_score_sync_at:
        typeof override.home_score === "number" || typeof override.away_score === "number"
          ? new Date().toISOString()
          : row.last_score_sync_at,
    };
  });
};

const buildWorldCupRowsFromGeGroups = (groups: GeGroup[]) => {
  return groups.flatMap((group) =>
    (group.lista_jogos || []).flatMap<WorldCupMatchRow>((match) => {
      const kickoffAt = parseGeKickoffAt(match.data_realizacao, match.hora_realizacao);
      const status = inferMatchStatusFromGe(match);
      const canonicalMatch = getCanonicalMatchMeta(
        group.nome_grupo || "World Cup",
        match.equipes.mandante.nome_popular,
        match.equipes.visitante.nome_popular,
      );

      if (!canonicalMatch) {
        return [];
      }

      return [{
        id: canonicalMatch.id,
        stage: group.nome_grupo || "World Cup",
        group_name: group.nome_grupo || null,
        match_number: canonicalMatch.matchNumber,
        home_team: match.equipes.mandante.nome_popular,
        away_team: match.equipes.visitante.nome_popular,
        home_flag: match.equipes.mandante.escudo || null,
        away_flag: match.equipes.visitante.escudo || null,
        kickoff_at: kickoffAt,
        timezone: "America/Sao_Paulo",
        venue: match.sede?.nome_popular?.trim() || null,
        city: null,
        status,
        status_detail: buildStatusDetailFromGe(match, status),
        home_score:
          typeof match.placar_oficial_mandante === "number" ? match.placar_oficial_mandante : null,
        away_score:
          typeof match.placar_oficial_visitante === "number" ? match.placar_oficial_visitante : null,
        live_clock: null,
        linked_sports_match_id: null,
        source: "ge",
        source_url: WORLD_CUP_SOURCE_URL,
        source_payload: {
          source: "grupos_fase",
          group: group.nome_grupo || null,
          geMatch: match,
        },
        last_score_sync_at:
          typeof match.placar_oficial_mandante === "number" ||
          typeof match.placar_oficial_visitante === "number"
            ? new Date().toISOString()
            : null,
      }];
    }),
  );
};

const loadGeSeedRowsSafe = async () => {
  try {
    const html = await fetchWorldCupSourceHtml();
    const groups = parseGeGroupsData(html);
    return buildWorldCupRowsFromGeGroups(groups);
  } catch {
    return [] as WorldCupMatchRow[];
  }
};

const buildCanonicalWorldCupRows = (
  existingRows: WorldCupMatchRow[],
  geRows: WorldCupMatchRow[],
) => {
  return worldCupSeedMatches.map<WorldCupMatchRow>((seedMatch, index) => {
    const seedRow = buildSeedBackedWorldCupRow(seedMatch, index + 1);
    const geRow =
      geRows.find(
        (row) =>
          row.id === seedRow.id ||
          (row.stage === seedRow.stage &&
            matchesTeamPair(row.home_team, row.away_team, seedRow.home_team, seedRow.away_team)),
      ) || null;
    const existingRow =
      existingRows.find(
        (row) =>
          row.id === seedRow.id ||
          (row.stage === seedRow.stage &&
            matchesTeamPair(row.home_team, row.away_team, seedRow.home_team, seedRow.away_team)),
      ) || null;

    const freshestRow = [existingRow, geRow].filter(Boolean).reduce<WorldCupMatchRow | null>(
      (best, candidate) => (best ? preferWorldCupRow(best, candidate!) : candidate!),
      null,
    );

    return sanitizeFutureWorldCupRow({
      ...seedRow,
      ...freshestRow,
      id: seedRow.id,
      stage: seedRow.stage,
      group_name: seedRow.group_name,
      match_number: seedRow.match_number,
      linked_sports_match_id: freshestRow?.linked_sports_match_id || null,
      created_at: freshestRow?.created_at,
      updated_at: freshestRow?.updated_at,
    });
  });
};

const applyEmergencyScoreOverrides = (rows: WorldCupMatchRow[]) => {
  const overrides = new Map<
    string,
    Pick<
      WorldCupMatchRow,
      "status" | "status_detail" | "home_score" | "away_score" | "live_clock" | "source" | "source_url" | "last_score_sync_at"
    >
  >([
    [
      "wc2026-01",
      {
        status: "ended",
        status_detail: "Encerrado",
        home_score: 2,
        away_score: 0,
        live_clock: null,
        source: "fallback",
        source_url: WORLD_CUP_SOURCE_URL,
        last_score_sync_at: new Date().toISOString(),
      },
    ],
    [
      "wc2026-02",
      {
        status: "ended",
        status_detail: "Encerrado",
        home_score: 2,
        away_score: 1,
        live_clock: null,
        source: "fallback",
        source_url: WORLD_CUP_SOURCE_URL,
        last_score_sync_at: new Date().toISOString(),
      },
    ],
    [
      "wc2026-14",
      {
        status: "ended",
        status_detail: "Encerrado",
        home_score: 0,
        away_score: 0,
        live_clock: null,
        source: "fallback",
        source_url: WORLD_CUP_SOURCE_URL,
        last_score_sync_at: new Date().toISOString(),
      },
    ],
  ]);

  return rows.map((row) => {
    const override = overrides.get(row.id);
    if (!override) return row;
    if (row.status === "ended" && typeof row.home_score === "number" && typeof row.away_score === "number") {
      return row;
    }

    return {
      ...row,
      ...override,
    };
  });
};

const inferMatchStatusFromGe = (match: GeGroupMatch): MatchStatus => {
  const broadcastId = match.transmissao?.broadcast?.id || "";
  if (broadcastId === "ENCERRADA") return "ended";
  if (match.jogo_ja_comecou) return "live";
  return "scheduled";
};

const buildStatusDetailFromGe = (match: GeGroupMatch, status: MatchStatus) => {
  const label = match.transmissao?.label || match.transmissao?.broadcast?.label || null;
  if (label?.trim()) return label.trim();
  if (status === "live") return "Ao vivo";
  if (status === "ended") return "Encerrado";
  return "Agendado";
};

const extractSnippet = (text: string, anchor: string) => {
  const index = text.toLowerCase().indexOf(anchor.toLowerCase());
  if (index < 0) return "";
  return text.slice(Math.max(0, index - 120), Math.min(text.length, index + anchor.length + 160));
};

const parseGeScoreUpdates = (html: string, matches: WorldCupMatchRow[]): ParsedScoreUpdate[] => {
  const matchesByCanonicalKey = new Map<string, GeMatchedRowContext>(
    matches.map((row) => {
      const canonicalKey = buildCanonicalMatchKey(row.stage, row.home_team, row.away_team);
      return [canonicalKey, { row, canonicalKey }];
    }),
  );
  const groups = parseGeGroupsData(html);
  const updatesFromGroups = groups.flatMap((group) =>
    (group.lista_jogos || []).flatMap((match) => {
      const canonicalKey = buildCanonicalMatchKey(
        group.nome_grupo || "World Cup",
        match.equipes.mandante.nome_popular,
        match.equipes.visitante.nome_popular,
      );

      const matchedByCanonicalKey = matchesByCanonicalKey.get(canonicalKey)?.row || null;
      const row =
        matchedByCanonicalKey ||
        matches.find((item) =>
          item.stage === (group.nome_grupo || item.stage) &&
          matchesTeamPair(
            item.home_team,
            item.away_team,
            match.equipes.mandante.nome_popular,
            match.equipes.visitante.nome_popular,
          ),
        );

      if (!row) return [];

      const status = inferMatchStatusFromGe(match);
      const hasOfficialScore =
        typeof match.placar_oficial_mandante === "number" &&
        typeof match.placar_oficial_visitante === "number";

      if (!hasOfficialScore && status === "scheduled") {
        return [];
      }

      return [
        {
          id: row.id,
          home_score: match.placar_oficial_mandante ?? 0,
          away_score: match.placar_oficial_visitante ?? 0,
          status,
          status_detail: buildStatusDetailFromGe(match, status),
          live_clock: null,
          source_payload: {
            source: "grupos_fase",
            group: group.nome_grupo || null,
            geMatch: match,
          },
        } satisfies ParsedScoreUpdate,
      ];
    }),
  );

  if (updatesFromGroups.length > 0) {
    return updatesFromGroups;
  }

  const text = simplifyHtml(html);
  const updates: ParsedScoreUpdate[] = [];

  for (const match of matches) {
    const homeVariants = buildTeamVariants(match.home_team);
    const awayVariants = buildTeamVariants(match.away_team);

    let parsed: ParsedScoreUpdate | null = null;

    for (const homeName of homeVariants) {
      for (const awayName of awayVariants) {
        const directScorePattern = new RegExp(
          `${escapeRegex(homeName)}\\s*(\\d+)\\s*[xX-]\\s*(\\d+)\\s*${escapeRegex(awayName)}`,
          "i",
        );
        const reverseScorePattern = new RegExp(
          `${escapeRegex(awayName)}\\s*(\\d+)\\s*[xX-]\\s*(\\d+)\\s*${escapeRegex(homeName)}`,
          "i",
        );

        const directMatch = text.match(directScorePattern);
        const reverseMatch = text.match(reverseScorePattern);
        const snippet = extractSnippet(text, `${homeName} ${awayName}`) || extractSnippet(text, homeName);

        if (directMatch) {
          const liveClockMatch = snippet.match(/(\d{1,3})['’]/);
          const isLive = /ao vivo/i.test(snippet) || Boolean(liveClockMatch);
          parsed = {
            id: match.id,
            home_score: Number(directMatch[1]),
            away_score: Number(directMatch[2]),
            status: isLive ? "live" : "ended",
            status_detail: isLive ? "Ao vivo" : "Encerrado",
            live_clock: liveClockMatch ? `${liveClockMatch[1]}'` : null,
            source_payload: { snippet },
          };
          break;
        }

        if (reverseMatch) {
          const liveClockMatch = snippet.match(/(\d{1,3})['’]/);
          const isLive = /ao vivo/i.test(snippet) || Boolean(liveClockMatch);
          parsed = {
            id: match.id,
            home_score: Number(reverseMatch[2]),
            away_score: Number(reverseMatch[1]),
            status: isLive ? "live" : "ended",
            status_detail: isLive ? "Ao vivo" : "Encerrado",
            live_clock: liveClockMatch ? `${liveClockMatch[1]}'` : null,
            source_payload: { snippet },
          };
          break;
        }
      }

      if (parsed) break;
    }

    if (parsed) {
      updates.push(parsed);
    }
  }

  return updates;
};

export const syncWorldCupScoresFromGe = async () => {
  await ensureWorldCupGroupStageSeeded();
  const worldCupRows = await loadWorldCupRows();
  const html = await fetchWorldCupSourceHtml();
  const parsedUpdates = parseGeScoreUpdates(html, worldCupRows);

  if (parsedUpdates.length === 0) {
    return { updated: 0, source: WORLD_CUP_SOURCE_URL };
  }

  const updates = worldCupRows.flatMap((row) => {
    const parsed = parsedUpdates.find((item) => item.id === row.id);
    if (!parsed) return [];

    return [
      {
        ...row,
        status: parsed.status,
        status_detail: parsed.status_detail,
        home_score: parsed.home_score,
        away_score: parsed.away_score,
        live_clock: parsed.live_clock,
        source: "ge",
        source_url: WORLD_CUP_SOURCE_URL,
        source_payload: parsed.source_payload,
        last_score_sync_at: new Date().toISOString(),
      } satisfies WorldCupMatchRow,
    ];
  });

  await upsertWorldCupRows(updates);
  return { updated: updates.length, source: WORLD_CUP_SOURCE_URL };
};
