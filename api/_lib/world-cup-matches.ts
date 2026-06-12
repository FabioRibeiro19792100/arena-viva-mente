import {
  parseWorldCupMatchDate,
  type MatchStatus,
  type WorldCupMatch,
  worldCupGroupStageSeedMatches,
} from "../../src/data/worldCup2026.js";
import { translateTeamLabel } from "../../src/lib/matchLabels.js";
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

const buildSeedRowsFromLocalMatches = () =>
  worldCupGroupStageSeedMatches
    .map<WorldCupMatchRow | null>((match, index) => {
      const kickoff = parseWorldCupMatchDate(match);
      if (!kickoff) return null;

      return {
        id: match.id,
        stage: match.stage,
        group_name: match.stage,
        match_number: index + 1,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_flag: match.homeTeamLogo,
        away_flag: match.awayTeamLogo,
        kickoff_at: kickoff.toISOString(),
        timezone: "America/Sao_Paulo",
        venue: match.venue || null,
        city: inferCityFromVenue(match.venue),
        status: "scheduled",
        status_detail: "Agendado",
        home_score: null,
        away_score: null,
        live_clock: null,
        linked_sports_match_id: null,
        source: "seed",
        source_url: WORLD_CUP_SOURCE_URL,
        source_payload: {
          source: "local_seed",
          matchId: match.id,
        },
        last_score_sync_at: null,
      };
    })
    .filter((row): row is WorldCupMatchRow => Boolean(row));

const buildTeamVariants = (teamName: string) => {
  const translated = translateTeamLabel(teamName);
  return Array.from(new Set([teamName, translated].filter(Boolean)));
};

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

const mapWorldCupRowToMatch = (row: WorldCupMatchRow): WorldCupPoolMatch => ({
  id: row.id,
  homeTeam: row.home_team,
  awayTeam: row.away_team,
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
  const seedRows = buildSeedRowsFromLocalMatches();

  try {
    let mergedRows = seedRows;

    try {
      const html = await fetchWorldCupSourceHtml();
      const groups = parseGeGroupsData(html);
      const rowsFromGe = buildWorldCupRowsFromGeGroups(groups);

      if (rowsFromGe.length > 0) {
        const geRowsByKey = new Map(
          rowsFromGe.flatMap((row) =>
            buildMatchKeys(row.home_team, row.away_team, row.kickoff_at).map((key) => [key, row] as const),
          ),
        );

        mergedRows = seedRows.map((row) => {
          const geMatch = buildMatchKeys(row.home_team, row.away_team, row.kickoff_at)
            .map((key) => geRowsByKey.get(key))
            .find(Boolean);

          if (!geMatch) {
            return row;
          }

          return {
            ...row,
            home_team: geMatch.home_team,
            away_team: geMatch.away_team,
            home_flag: geMatch.home_flag,
            away_flag: geMatch.away_flag,
            kickoff_at: geMatch.kickoff_at,
            venue: geMatch.venue,
            city: geMatch.city,
            status: geMatch.status,
            status_detail: geMatch.status_detail,
            home_score: geMatch.home_score,
            away_score: geMatch.away_score,
            live_clock: geMatch.live_clock,
            source: geMatch.source,
            source_url: geMatch.source_url,
            source_payload: geMatch.source_payload,
            last_score_sync_at: geMatch.last_score_sync_at,
          } satisfies WorldCupMatchRow;
        });
      }
    } catch {
      mergedRows = seedRows;
    }

    const admin = getSupabaseAdmin();
    await upsertWorldCupRows(mergedRows);
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
  return (data || []) as WorldCupMatchRow[];
};

const enrichRowsWithLegacyLinks = async (rows: WorldCupMatchRow[]) => {
  const rowsMissingLinks = rows.filter((row) => !row.linked_sports_match_id);
  if (rowsMissingLinks.length === 0) {
    return rows;
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("sports_matches")
    .select("id, home_team, away_team, starts_at")
    .eq("sport", "futebol")
    .or("league_name.ilike.%World Cup%,league_name.ilike.%Copa do Mundo%");

  if (error) {
    return rows;
  }

  const sportsByKey = new Map<string, string>();

  for (const row of data || []) {
    for (const key of buildMatchKeys(row.home_team, row.away_team, row.starts_at)) {
      sportsByKey.set(key, row.id);
    }
  }

  return rows.map((row) => ({
    ...row,
    linked_sports_match_id:
      row.linked_sports_match_id ||
      buildMatchKeys(row.home_team, row.away_team, row.kickoff_at)
        .map((key) => sportsByKey.get(key))
        .find(Boolean) ||
      null,
  }));
};

export const getWorldCupPoolMatches = async () => {
  let rows: WorldCupMatchRow[] = [];

  try {
    await ensureWorldCupGroupStageSeeded();
    try {
      await syncWorldCupScoresFromSportsSnapshot();
    } catch {
      // Keep serving matches even if sports snapshot sync fails.
    }
    try {
      await syncWorldCupScoresFromGe();
    } catch {
      // Keep serving seeded matches even if score sync fails.
    }
    rows = await loadWorldCupRows();
  } catch (error) {
    throw error;
  }

  return (await enrichRowsWithLegacyLinks(rows)).map(mapWorldCupRowToMatch);
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

const parseGeKickoffAt = (value: string) => {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours + 3, minutes || 0)).toISOString();
};

const buildWorldCupRowsFromGeGroups = (groups: GeGroup[]) => {
  let matchNumber = 1;

  return groups.flatMap((group) =>
    (group.lista_jogos || []).map<WorldCupMatchRow>((match) => {
      const kickoffAt = parseGeKickoffAt(match.data_realizacao);
      const status = inferMatchStatusFromGe(match);
      const currentMatchNumber = matchNumber++;

      return {
        id: `wc2026-${String(currentMatchNumber).padStart(2, "0")}`,
        stage: group.nome_grupo || "World Cup",
        group_name: group.nome_grupo || null,
        match_number: currentMatchNumber,
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
      };
    }),
  );
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
  const groups = parseGeGroupsData(html);
  const updatesFromGroups = groups.flatMap((group) =>
    (group.lista_jogos || []).flatMap((match) => {
      const geKeys = buildMatchKeys(
        match.equipes.mandante.nome_popular,
        match.equipes.visitante.nome_popular,
        match.data_realizacao,
      );
      const row = matches.find((item) =>
        buildMatchKeys(item.home_team, item.away_team, item.kickoff_at).some((key) => geKeys.includes(key)),
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
