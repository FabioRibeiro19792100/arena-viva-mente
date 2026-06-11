import { getSupabaseAdmin } from "./supabase-admin.js";
import {
  buildFootballMatchRow,
  buildNbaMatchRow,
  buildStaticMatchRows,
  buildVolleyballMatchRow,
  type SportType,
  type SportsMatchRow,
  type SyncStatus,
} from "./sports-matches.js";
import { worldCup2026Matches } from "../../src/data/worldCup2026.js";
import type { ApiFootballFixture, ApiNbaGame, ApiVolleyballGame } from "../../src/lib/apiFootball.js";

type SyncMode = "scheduled" | "live" | "manual";

const FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const NBA_BASE_URL = "https://v2.nba.api-sports.io";
const VOLLEYBALL_BASE_URL = "https://v1.volleyball.api-sports.io";

const getApiKey = () => process.env.API_SPORTS_KEY || process.env.API_FOOTBALL_KEY;

const formatApiDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const dateOffsetsFromToday = (offsets: number[]) =>
  offsets.map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return formatApiDate(date);
  });

const fetchApiJson = async (baseUrl: string, path: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_SPORTS_KEY or API_FOOTBALL_KEY is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (response.status === 204) {
    return { response: [], errors: {} };
  }

  return response.json();
};

const upsertMatches = async (rows: SportsMatchRow[]) => {
  if (rows.length === 0) return;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("sports_matches").upsert(
    rows.map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    })),
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
};

const dedupeMatchRows = (rows: SportsMatchRow[]) =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

const clearStaleLiveMatches = async (
  provider: "football" | "nba" | "volleyball",
  activeIds: string[],
) => {
  const admin = getSupabaseAdmin();

  let query = admin
    .from("sports_matches")
    .update({
      status: "ended",
      status_detail: "Finalizado",
      live_clock: null,
      updated_at: new Date().toISOString(),
    })
    .eq("provider", provider)
    .eq("status", "live");

  if (activeIds.length > 0) {
    query = query.not("id", "in", `(${activeIds.map((id) => `"${id}"`).join(",")})`);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }
};

const syncStatusPriority: Record<SyncStatus, number> = {
  ok: 6,
  partial: 5,
  suspended: 4,
  limit: 3,
  plan: 2,
  offline: 1,
};

const updateSyncStatus = async (
  sport: SportType,
  mode: SyncMode,
  status: SyncStatus,
  message?: string,
) => {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("sports_sync_status")
    .select("status, message, mode")
    .eq("sport", sport)
    .maybeSingle();

  const nextStatus =
    existing && syncStatusPriority[existing.status as SyncStatus] > syncStatusPriority[status]
      ? (existing.status as SyncStatus)
      : status;
  const nextMessage =
    nextStatus === status
      ? message || null
      : existing?.message || message || null;
  const nextMode = nextStatus === status ? mode : (existing?.mode as SyncMode | undefined) || mode;

  await admin.from("sports_sync_status").upsert({
    sport,
    mode: nextMode,
    status: nextStatus,
    message: nextMessage,
    last_synced_at: new Date().toISOString(),
  });
};

export const ensureStaticMatchesSeeded = async () => {
  const admin = getSupabaseAdmin();
  const allowedStaticIds = worldCup2026Matches.map((match) => match.id);

  let cleanupQuery = admin
    .from("sports_matches")
    .delete()
    .eq("provider", "internal");

  if (allowedStaticIds.length > 0) {
    cleanupQuery = cleanupQuery.not("id", "in", `(${allowedStaticIds.map((id) => `"${id}"`).join(",")})`);
  }

  await cleanupQuery;
  await upsertMatches(buildStaticMatchRows());
};

const syncFootballScheduled = async (mode: SyncMode) => {
  const today = formatApiDate(new Date());
  const [worldCupPayload, worldCupRoundOnePayload, todayPayload] = await Promise.allSettled([
    fetchApiJson(FOOTBALL_BASE_URL, "/fixtures?league=1&season=2026"),
    fetchApiJson(
      FOOTBALL_BASE_URL,
      "/fixtures?league=1&season=2026&round=Group%20Stage%20-%201&timezone=America/Sao_Paulo",
    ),
    fetchApiJson(FOOTBALL_BASE_URL, `/fixtures?date=${today}&timezone=America/Sao_Paulo`),
  ]);

  const rows: SportsMatchRow[] = [];

  if (worldCupPayload.status === "fulfilled" && Array.isArray(worldCupPayload.value?.response)) {
    rows.push(...(worldCupPayload.value.response as ApiFootballFixture[]).map(buildFootballMatchRow));
  }

  if (
    worldCupRoundOnePayload.status === "fulfilled" &&
    Array.isArray(worldCupRoundOnePayload.value?.response)
  ) {
    rows.push(
      ...(worldCupRoundOnePayload.value.response as ApiFootballFixture[]).map(buildFootballMatchRow),
    );
  }

  if (todayPayload.status === "fulfilled" && Array.isArray(todayPayload.value?.response)) {
    rows.push(...(todayPayload.value.response as ApiFootballFixture[]).map(buildFootballMatchRow));
  }

  const dedupedRows = dedupeMatchRows(rows);

  await upsertMatches(dedupedRows);

  const hasWorldCupPlanError =
    (worldCupPayload.status === "fulfilled" && worldCupPayload.value?.errors?.plan) ||
    (worldCupRoundOnePayload.status === "fulfilled" && worldCupRoundOnePayload.value?.errors?.plan);
  const worldCupPlanMessage =
    (worldCupPayload.status === "fulfilled" && worldCupPayload.value?.errors?.plan) ||
    (worldCupRoundOnePayload.status === "fulfilled" && worldCupRoundOnePayload.value?.errors?.plan) ||
    "World Cup indisponível no plano atual";

  if (hasWorldCupPlanError && dedupedRows.length === 0) {
    await updateSyncStatus("futebol", mode, "plan", String(worldCupPlanMessage));
    return { sport: "futebol" as const, status: "plan" as SyncStatus, upserted: dedupedRows.length };
  }

  const status: SyncStatus =
    dedupedRows.length > 0
      ? worldCupPayload.status === "fulfilled" &&
        worldCupRoundOnePayload.status === "fulfilled" &&
        todayPayload.status === "fulfilled"
        ? "ok"
        : "partial"
      : "offline";

  await updateSyncStatus("futebol", mode, status);
  return { sport: "futebol" as const, status, upserted: dedupedRows.length };
};

const syncFootballLive = async (mode: SyncMode) => {
  const payload = await fetchApiJson(FOOTBALL_BASE_URL, "/fixtures?live=all&timezone=America/Sao_Paulo");

  if (payload?.errors?.access) {
    await updateSyncStatus("futebol", mode, "suspended", String(payload.errors.access));
    return { sport: "futebol" as const, status: "suspended" as SyncStatus, upserted: 0 };
  }

  if (payload?.errors?.plan) {
    await updateSyncStatus("futebol", mode, "plan", String(payload.errors.plan));
    return { sport: "futebol" as const, status: "plan" as SyncStatus, upserted: 0 };
  }

  const rows = Array.isArray(payload?.response)
    ? (payload.response as ApiFootballFixture[]).map(buildFootballMatchRow)
    : [];

  await upsertMatches(rows);
  await clearStaleLiveMatches(
    "football",
    rows.map((row) => row.id),
  );

  const status: SyncStatus = rows.length > 0 ? "ok" : "offline";
  await updateSyncStatus("futebol", mode, status);
  return { sport: "futebol" as const, status, upserted: rows.length };
};

const syncNbaScheduled = async (mode: SyncMode) => {
  const payloads = await Promise.allSettled(
    dateOffsetsFromToday([-1, 0, 1]).map((date) => fetchApiJson(NBA_BASE_URL, `/games?date=${date}`)),
  );

  const rows = payloads
    .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
    .flatMap((result) =>
      Array.isArray(result.value?.response) ? (result.value.response as ApiNbaGame[]).map(buildNbaMatchRow) : [],
    );

  await upsertMatches(rows);

  const limitPayload = payloads.find(
    (result) => result.status === "fulfilled" && result.value?.errors?.requests,
  ) as PromiseFulfilledResult<any> | undefined;

  if (limitPayload?.value?.errors?.requests) {
    await updateSyncStatus("basquete", mode, "limit", String(limitPayload.value.errors.requests));
    return { sport: "basquete" as const, status: "limit" as SyncStatus, upserted: rows.length };
  }

  const status: SyncStatus =
    rows.length > 0
      ? payloads.every((result) => result.status === "fulfilled")
        ? "ok"
        : "partial"
      : "offline";
  await updateSyncStatus("basquete", mode, status);
  return { sport: "basquete" as const, status, upserted: rows.length };
};

const syncNbaLive = async (mode: SyncMode) => {
  const payload = await fetchApiJson(NBA_BASE_URL, "/games?live=all");

  if (payload?.errors?.requests) {
    await updateSyncStatus("basquete", mode, "limit", String(payload.errors.requests));
    return { sport: "basquete" as const, status: "limit" as SyncStatus, upserted: 0 };
  }

  const rows = Array.isArray(payload?.response) ? (payload.response as ApiNbaGame[]).map(buildNbaMatchRow) : [];

  await upsertMatches(rows);
  await clearStaleLiveMatches(
    "nba",
    rows.map((row) => row.id),
  );

  const status: SyncStatus = rows.length > 0 ? "ok" : "offline";
  await updateSyncStatus("basquete", mode, status);
  return { sport: "basquete" as const, status, upserted: rows.length };
};

const syncVolleyballScheduled = async (mode: SyncMode) => {
  const today = formatApiDate(new Date());
  let payload = await fetchApiJson(VOLLEYBALL_BASE_URL, `/games?date=${today}`);
  let rows = Array.isArray(payload?.response)
    ? (payload.response as ApiVolleyballGame[]).map(buildVolleyballMatchRow)
    : [];

  if (rows.length === 0) {
    for (const offset of [1, 2, 3]) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      payload = await fetchApiJson(VOLLEYBALL_BASE_URL, `/games?date=${formatApiDate(date)}`);
      rows = Array.isArray(payload?.response)
        ? (payload.response as ApiVolleyballGame[]).map(buildVolleyballMatchRow)
        : [];
      if (rows.length > 0) break;
    }
  }

  await upsertMatches(rows);

  if (payload?.errors?.access) {
    await updateSyncStatus("volei", mode, "suspended", String(payload.errors.access));
    return { sport: "volei" as const, status: "suspended" as SyncStatus, upserted: rows.length };
  }

  if (payload?.errors?.requests) {
    await updateSyncStatus("volei", mode, "limit", String(payload.errors.requests));
    return { sport: "volei" as const, status: "limit" as SyncStatus, upserted: rows.length };
  }

  const status: SyncStatus = rows.length > 0 ? "ok" : "offline";
  await updateSyncStatus("volei", mode, status);
  return { sport: "volei" as const, status, upserted: rows.length };
};

const syncVolleyballLive = async (mode: SyncMode) => {
  const payload = await fetchApiJson(VOLLEYBALL_BASE_URL, "/games?live=all");

  if (payload?.errors?.access) {
    await updateSyncStatus("volei", mode, "suspended", String(payload.errors.access));
    return { sport: "volei" as const, status: "suspended" as SyncStatus, upserted: 0 };
  }

  if (payload?.errors?.requests) {
    await updateSyncStatus("volei", mode, "limit", String(payload.errors.requests));
    return { sport: "volei" as const, status: "limit" as SyncStatus, upserted: 0 };
  }

  const rows = Array.isArray(payload?.response)
    ? (payload.response as ApiVolleyballGame[]).map(buildVolleyballMatchRow)
    : [];

  await upsertMatches(rows);
  await clearStaleLiveMatches(
    "volleyball",
    rows.map((row) => row.id),
  );

  const status: SyncStatus = rows.length > 0 ? "ok" : "offline";
  await updateSyncStatus("volei", mode, status);
  return { sport: "volei" as const, status, upserted: rows.length };
};

export const syncScheduledMatches = async () => {
  await ensureStaticMatchesSeeded();
  return Promise.allSettled([
    syncFootballScheduled("scheduled"),
    syncNbaScheduled("scheduled"),
    syncVolleyballScheduled("scheduled"),
  ]);
};

export const syncLiveMatches = async () => {
  await ensureStaticMatchesSeeded();
  return Promise.allSettled([
    syncFootballLive("live"),
    syncNbaLive("live"),
    syncVolleyballLive("live"),
  ]);
};

export const syncMatchesByIds = async (matchIds: string[]) => {
  const grouped = {
    football: matchIds.filter((id) => id.startsWith("api-football-")).map((id) => id.replace("api-football-", "")),
    nba: matchIds.filter((id) => id.startsWith("api-nba-")).map((id) => id.replace("api-nba-", "")),
    volleyball: matchIds.filter((id) => id.startsWith("api-volleyball-")).map((id) => id.replace("api-volleyball-", "")),
  };

  const jobs: Array<Promise<void>> = [];

  if (grouped.football.length > 0) {
    jobs.push(
      Promise.all(
        grouped.football.map(async (providerId) => {
          const payload = await fetchApiJson(
            FOOTBALL_BASE_URL,
            `/fixtures?id=${providerId}&timezone=America/Sao_Paulo`,
          );
          const rows = Array.isArray(payload?.response)
            ? (payload.response as ApiFootballFixture[]).map(buildFootballMatchRow)
            : [];
          await upsertMatches(rows);
        }),
      ).then(() => undefined),
    );
  }

  if (grouped.nba.length > 0) {
    jobs.push(
      Promise.all(
        grouped.nba.map(async (providerId) => {
          const payload = await fetchApiJson(NBA_BASE_URL, `/games?id=${providerId}`);
          const rows = Array.isArray(payload?.response)
            ? (payload.response as ApiNbaGame[]).map(buildNbaMatchRow)
            : [];
          await upsertMatches(rows);
        }),
      ).then(() => undefined),
    );
  }

  if (grouped.volleyball.length > 0) {
    jobs.push(
      Promise.all(
        grouped.volleyball.map(async (providerId) => {
          const payload = await fetchApiJson(VOLLEYBALL_BASE_URL, `/games?id=${providerId}`);
          const rows = Array.isArray(payload?.response)
            ? (payload.response as ApiVolleyballGame[]).map(buildVolleyballMatchRow)
            : [];
          await upsertMatches(rows);
        }),
      ).then(() => undefined),
    );
  }

  await Promise.all(jobs);
};
