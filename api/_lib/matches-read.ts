import { getSupabaseAdmin } from "./supabase-admin.js";
import {
  dedupeDisplayMatches,
  mapSportsMatchRowToDisplayMatch,
  matchesSearchText,
  type MatchesFeedPayload,
  type SportType,
  type SyncStatus,
  type SportsMatchRow,
} from "./sports-matches.js";
import { ensureStaticMatchesSeeded } from "./sports-sync.js";
import { syncMatchesByIds } from "./sports-sync.js";
import { normalizeSearchText } from "../../src/lib/matchLabels.js";

type QuickFilterType = "all" | "live" | "soon";

const formatBrasiliaDay = (value: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const isSameBrasiliaDay = (value: string) => formatBrasiliaDay(value) === formatBrasiliaDay(new Date().toISOString());

const syncStatusPriority: Record<SyncStatus, number> = {
  ok: 6,
  partial: 5,
  offline: 1,
  plan: 2,
  limit: 3,
  suspended: 4,
};

const readSyncStatuses = async () => {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("sports_sync_status").select("sport, mode, status, last_synced_at");
  const map = new Map<string, SyncStatus>();

  for (const item of data || []) {
    const sport = item.sport as string;
    const status = item.status as SyncStatus;
    const current = map.get(sport);
    if (!current || syncStatusPriority[status] > syncStatusPriority[current]) {
      map.set(sport, status);
    }
  }

  return {
    football: map.get("futebol") || "offline",
    nba: map.get("basquete") || "offline",
    volleyball: map.get("volei") || "offline",
  } as MatchesFeedPayload["apiFeedStatus"];
};

export const getMatchesFeed = async (input: {
  sport: "all" | SportType;
  quick: QuickFilterType;
  search: string;
}): Promise<MatchesFeedPayload> => {
  await ensureStaticMatchesSeeded();

  const admin = getSupabaseAdmin();
  let query = admin.from("sports_matches").select("*").order("starts_at", { ascending: true });

  if (input.sport !== "all") {
    query = query.eq("sport", input.sport);
  }

  if (input.quick === "live") {
    query = query.eq("status", "live");
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const rows = (data || []) as SportsMatchRow[];
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  const normalizedSearch = normalizeSearchText(input.search);
  const filteredMatches = dedupeDisplayMatches(rows.map(mapSportsMatchRowToDisplayMatch)).filter((match) => {
    const row = rowsById.get(match.id);
    if (!row) return false;

    if (input.quick === "soon" && (row.status !== "scheduled" || !isSameBrasiliaDay(row.starts_at))) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return matchesSearchText(match).includes(normalizedSearch);
  });

  const todayMatches = filteredMatches.filter((match) => {
    const row = rowsById.get(match.id);
    return row ? row.status === "live" || isSameBrasiliaDay(row.starts_at) : false;
  });
  const todayIds = new Set(todayMatches.map((match) => match.id));

  return {
    matches: filteredMatches.filter((match) => !todayIds.has(match.id)),
    todayMatches,
    apiFeedStatus: await readSyncStatuses(),
  };
};

export const getMatchesByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];

  await ensureStaticMatchesSeeded();
  const admin = getSupabaseAdmin();
  let { data, error } = await admin.from("sports_matches").select("*").in("id", ids);
  if (error) {
    throw error;
  }

  const existingIds = new Set(((data || []) as SportsMatchRow[]).map((row) => row.id));
  const missingIds = ids.filter((id) => !existingIds.has(id) && id.startsWith("api-"));

  if (missingIds.length > 0) {
    await syncMatchesByIds(missingIds);
    const refreshed = await admin.from("sports_matches").select("*").in("id", ids);
    data = refreshed.data;
    error = refreshed.error;
    if (error) {
      throw error;
    }
  }

  const rows = ((data || []) as SportsMatchRow[]).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return rows.map(mapSportsMatchRowToDisplayMatch);
};

export const getMatchByIdFromDb = async (id: string) => {
  await ensureStaticMatchesSeeded();
  const admin = getSupabaseAdmin();
  let { data, error } = await admin.from("sports_matches").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw error;
  }

  if (!data && id.startsWith("api-")) {
    await syncMatchesByIds([id]);
    const refreshed = await admin.from("sports_matches").select("*").eq("id", id).maybeSingle();
    data = refreshed.data;
    error = refreshed.error;
    if (error) {
      throw error;
    }
  }

  if (!data) {
    return null;
  }

  return mapSportsMatchRowToDisplayMatch(data as SportsMatchRow);
};
