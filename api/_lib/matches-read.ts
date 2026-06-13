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
import { getWorldCupPoolMatches } from "./world-cup-matches.js";
import { ensureStaticMatchesSeeded } from "./sports-sync.js";
import { syncScheduledMatches } from "./sports-sync.js";
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
const isTodayOrFutureBrasiliaDay = (value: string) =>
  formatBrasiliaDay(value) >= formatBrasiliaDay(new Date().toISOString());
const getBrasiliaDayStartIso = () => {
  const day = formatBrasiliaDay(new Date().toISOString());
  return `${day}T00:00:00-03:00`;
};
const getBrasiliaNextDayStartIso = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  const day = formatBrasiliaDay(next.toISOString());
  return `${day}T00:00:00-03:00`;
};

const SCHEDULED_SYNC_LOCK_TTL_MS = 10 * 60 * 1000;
const SCHEDULED_SYNC_LOCK_KEY = `scheduled-sync-lock:${formatBrasiliaDay(new Date().toISOString())}`;

const syncStatusPriority: Record<SyncStatus, number> = {
  ok: 6,
  partial: 5,
  offline: 1,
  plan: 2,
  limit: 3,
  suspended: 4,
};

const isWorldCupPoolId = (id: string) => /^wc2026-/.test(id);

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

const ensureScheduledMatchesFresh = async () => {
  const admin = getSupabaseAdmin();
  const today = formatBrasiliaDay(new Date().toISOString());

  const { data: statuses } = await admin
    .from("sports_sync_status")
    .select("sport, mode, last_synced_at")
    .eq("mode", "scheduled");

  const scheduledBySport = new Map(
    (statuses || []).map((item) => [String(item.sport), String(item.last_synced_at || "")]),
  );
  const sportsToCheck = ["futebol", "basquete", "volei"];
  const isFresh = sportsToCheck.every((sport) => {
    const lastSyncedAt = scheduledBySport.get(sport);
    return lastSyncedAt ? formatBrasiliaDay(lastSyncedAt) === today : false;
  });

  if (isFresh) {
    return;
  }

  const { data: lockEntry } = await admin
    .from("api_feed_cache")
    .select("expires_at")
    .eq("cache_key", SCHEDULED_SYNC_LOCK_KEY)
    .maybeSingle();

  if (lockEntry?.expires_at && new Date(lockEntry.expires_at).getTime() > Date.now()) {
    return;
  }

  await admin.from("api_feed_cache").upsert({
    cache_key: SCHEDULED_SYNC_LOCK_KEY,
    payload: { kind: "scheduled-sync-lock", day: today },
    source: "matches-read",
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + SCHEDULED_SYNC_LOCK_TTL_MS).toISOString(),
  });

  try {
    await syncScheduledMatches();
  } catch {
    // If the scheduled sync fails, we still want to serve the last persisted snapshot.
  }
};

export const getMatchesFeed = async (input: {
  sport: "all" | SportType;
  quick: QuickFilterType;
  search: string;
  league?: string;
  includePast?: boolean;
}): Promise<MatchesFeedPayload> => {
  await ensureStaticMatchesSeeded();
  await ensureScheduledMatchesFresh();

  const admin = getSupabaseAdmin();
  const brasliaDayStartIso = getBrasiliaDayStartIso();
  const nextBrasiliaDayStartIso = getBrasiliaNextDayStartIso();
  let query = admin
    .from("sports_matches")
    .select("*")
    .order("starts_at", { ascending: true });

  if (!input.includePast) {
    query = query.or(`status.eq.live,starts_at.gte.${brasliaDayStartIso}`);
  }

  if (input.sport !== "all") {
    query = query.eq("sport", input.sport);
  }

  if (input.league?.trim()) {
    query = query.ilike("league_name", `%${input.league.trim()}%`);
  }

  if (input.quick === "live") {
    query = query.eq("status", "live");
  }

  if (input.quick === "soon") {
    query = query
      .eq("status", "scheduled")
      .gte("starts_at", brasliaDayStartIso)
      .lt("starts_at", nextBrasiliaDayStartIso);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const rows = ((data || []) as SportsMatchRow[]).filter((row) =>
    input.includePast ? true : row.status === "live" || isTodayOrFutureBrasiliaDay(row.starts_at),
  );
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

    return matchesSearchText(match, row).includes(normalizedSearch);
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

  const worldCupIds = ids.filter(isWorldCupPoolId);
  const otherIds = ids.filter((id) => !isWorldCupPoolId(id));
  const worldCupMatches =
    worldCupIds.length > 0
      ? (await getWorldCupPoolMatches()).filter((match) => worldCupIds.includes(match.id))
      : [];

  if (otherIds.length === 0) {
    return ids
      .map((id) => worldCupMatches.find((match) => match.id === id))
      .filter(Boolean);
  }

  await ensureStaticMatchesSeeded();
  const admin = getSupabaseAdmin();
  let { data, error } = await admin.from("sports_matches").select("*").in("id", otherIds);
  if (error) {
    throw error;
  }

  const existingIds = new Set(((data || []) as SportsMatchRow[]).map((row) => row.id));
  const missingIds = otherIds.filter((id) => !existingIds.has(id) && id.startsWith("api-"));

  if (missingIds.length > 0) {
    await syncMatchesByIds(missingIds);
    const refreshed = await admin.from("sports_matches").select("*").in("id", otherIds);
    data = refreshed.data;
    error = refreshed.error;
    if (error) {
      throw error;
    }
  }

  const rows = ((data || []) as SportsMatchRow[]).sort((a, b) => otherIds.indexOf(a.id) - otherIds.indexOf(b.id));
  const otherMatches = rows.map(mapSportsMatchRowToDisplayMatch);

  return ids
    .map((id) => worldCupMatches.find((match) => match.id === id) || otherMatches.find((match) => match.id === id))
    .filter(Boolean);
};

export const getMatchByIdFromDb = async (id: string) => {
  if (isWorldCupPoolId(id)) {
    const matches = await getWorldCupPoolMatches();
    return matches.find((match) => match.id === id) || null;
  }

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
