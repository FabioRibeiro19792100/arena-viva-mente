import { createClient } from "@supabase/supabase-js";
import { worldCup2026Matches, type WorldCupMatch } from "../../src/data/worldCup2026";
import {
  mapApiFixtureToWorldCupMatch,
  mapApiNbaGameToMatch,
  mapApiVolleyballGameToMatch,
  mergeStaticMatchesWithApiFixtures,
  type ApiFootballFixture,
  type ApiNbaGame,
  type ApiVolleyballGame,
} from "../../src/lib/apiFootball";

type SportType = "futebol" | "basquete" | "volei";
type QuickFilterType = "all" | "live" | "soon";
type DisplayMatch = WorldCupMatch & { sport: SportType };
type ApiFeedStatus = {
  football: "ok" | "partial" | "offline" | "plan";
  nba: "ok" | "partial" | "offline" | "limit";
  volleyball: "ok" | "partial" | "offline" | "limit";
};

const FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const NBA_BASE_URL = "https://v2.nba.api-sports.io";
const VOLLEYBALL_BASE_URL = "https://v1.volleyball.api-sports.io";

const getApiKey = () => process.env.API_SPORTS_KEY || process.env.API_FOOTBALL_KEY;
const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const formatApiDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const withSport = <T extends WorldCupMatch>(match: T, sport: SportType): T & { sport: SportType } => ({
  ...match,
  sport,
});

const dedupeMatchesById = (items: DisplayMatch[]) =>
  Array.from(new Map(items.map((match) => [match.id, match])).values());

const fetchJson = async (baseUrl: string, path: string, apiKey: string) => {
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

const loadFeed = async (sport: string, quick: QuickFilterType) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_SPORTS_KEY or API_FOOTBALL_KEY is not configured");
  }

  const today = formatApiDate(new Date());
  const shouldIncludeFootball = sport === "all" || sport === "futebol";
  const shouldIncludeNba = sport === "all" || sport === "basquete";
  const shouldIncludeVolleyball = sport === "all" || sport === "volei";

  const matches: DisplayMatch[] = shouldIncludeFootball
    ? worldCup2026Matches.map((match) => withSport(match, "futebol"))
    : [];
  const todayMatches: DisplayMatch[] = [];
  const apiFeedStatus: ApiFeedStatus = {
    football: shouldIncludeFootball ? "offline" : "ok",
    nba: shouldIncludeNba ? "offline" : "ok",
    volleyball: shouldIncludeVolleyball ? "offline" : "ok",
  };

  if (shouldIncludeFootball) {
    const requests: Array<Promise<any>> = [
      fetchJson(FOOTBALL_BASE_URL, "/fixtures?league=1&season=2026", apiKey),
    ];

    if (quick !== "live") {
      requests.push(fetchJson(FOOTBALL_BASE_URL, `/fixtures?date=${today}&timezone=America/Sao_Paulo`, apiKey));
    }
    if (quick !== "soon") {
      requests.push(fetchJson(FOOTBALL_BASE_URL, "/fixtures?live=all&timezone=America/Sao_Paulo", apiKey));
    }

    const results = await Promise.allSettled(requests);
    const worldCupPayload = results[0].status === "fulfilled" ? results[0].value : null;
    const todayPayload = quick !== "live" && results[1]?.status === "fulfilled" ? results[1].value : null;
    const livePayload =
      quick === "live"
        ? results[1]?.status === "fulfilled"
          ? results[1].value
          : null
        : results[2]?.status === "fulfilled"
          ? results[2].value
          : null;

    if (worldCupPayload?.errors?.plan) {
      apiFeedStatus.football = "plan";
    } else if (Array.isArray(worldCupPayload?.response) && worldCupPayload.response.length > 0) {
      const merged = mergeStaticMatchesWithApiFixtures(
        worldCup2026Matches,
        worldCupPayload.response as ApiFootballFixture[],
      ).map((match) => withSport(match, "futebol"));
      matches.splice(0, matches.length, ...merged);
      apiFeedStatus.football = "ok";
    }

    const todayFixtures = Array.isArray(todayPayload?.response)
      ? (todayPayload.response as ApiFootballFixture[])
      : [];
    const liveFixtures = Array.isArray(livePayload?.response)
      ? (livePayload.response as ApiFootballFixture[])
      : [];

    todayMatches.push(
      ...todayFixtures.map((fixture) => withSport(mapApiFixtureToWorldCupMatch(fixture), "futebol")),
      ...liveFixtures.map((fixture) => withSport(mapApiFixtureToWorldCupMatch(fixture), "futebol")),
    );

    if (apiFeedStatus.football !== "plan") {
      apiFeedStatus.football =
        todayFixtures.length > 0 || liveFixtures.length > 0
          ? todayPayload && livePayload
            ? "ok"
            : "partial"
          : apiFeedStatus.football === "ok"
            ? "ok"
            : "offline";
    }
  }

  if (shouldIncludeNba) {
    const requests: Array<Promise<any>> = [];
    if (quick !== "live") {
      requests.push(fetchJson(NBA_BASE_URL, `/games?date=2026-06-04`, apiKey));
    }
    if (quick !== "soon") {
      requests.push(fetchJson(NBA_BASE_URL, "/games?live=all", apiKey));
    }

    const results = await Promise.allSettled(requests);
    const payloads = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value);

    if (payloads.some((payload) => payload?.errors?.requests)) {
      apiFeedStatus.nba = "limit";
    }

    const games = payloads.flatMap((payload) =>
      Array.isArray(payload?.response) ? (payload.response as ApiNbaGame[]) : [],
    );

    todayMatches.push(...games.map((game) => withSport(mapApiNbaGameToMatch(game), "basquete")));

    if (apiFeedStatus.nba !== "limit") {
      apiFeedStatus.nba =
        games.length > 0
          ? results.every((result) => result.status === "fulfilled")
            ? "ok"
            : "partial"
          : "offline";
    }
  }

  if (shouldIncludeVolleyball) {
    const requests: Array<Promise<any>> = [];
    if (quick !== "live") {
      requests.push(fetchJson(VOLLEYBALL_BASE_URL, `/games?date=${today}`, apiKey));
    }
    if (quick !== "soon") {
      requests.push(fetchJson(VOLLEYBALL_BASE_URL, "/games?live=all", apiKey));
    }

    const results = await Promise.allSettled(requests);
    const payloads = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value);

    if (payloads.some((payload) => payload?.errors?.requests)) {
      apiFeedStatus.volleyball = "limit";
    }

    var volleyballGames = payloads.flatMap((payload) =>
      Array.isArray(payload?.response) ? (payload.response as ApiVolleyballGame[]) : [],
    );

    if (volleyballGames.length === 0 && quick !== "live") {
      const upcomingDates = [1, 2, 3].map((offset) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        return formatApiDate(date);
      });

      const upcomingResults = await Promise.allSettled(
        upcomingDates.map((date) => fetchJson(VOLLEYBALL_BASE_URL, `/games?date=${date}`, apiKey)),
      );

      for (const result of upcomingResults) {
        if (result.status !== "fulfilled") continue;
        const nextGames = Array.isArray(result.value?.response)
          ? (result.value.response as ApiVolleyballGame[])
          : [];
        if (nextGames.length > 0) {
          volleyballGames = nextGames;
          break;
        }
      }
    }

    todayMatches.push(
      ...volleyballGames.map((game) => withSport(mapApiVolleyballGameToMatch(game), "volei")),
    );

    if (apiFeedStatus.volleyball !== "limit") {
      apiFeedStatus.volleyball =
        volleyballGames.length > 0
          ? results.every((result) => result.status === "fulfilled")
            ? "ok"
            : "partial"
          : "offline";
    }
  }

  return {
    matches,
    todayMatches: dedupeMatchesById(todayMatches),
    apiFeedStatus,
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sport = ["all", "futebol", "basquete", "volei"].includes(req.query?.sport)
    ? req.query.sport
    : "all";
  const quick: QuickFilterType = ["all", "live", "soon"].includes(req.query?.quick)
    ? req.query.quick
    : "all";
  const ttlSeconds = quick === "live" ? 60 : 20 * 60;
  const cacheKey = `home-feed:${sport}:${quick}`;
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (supabaseUrl && serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: cached } = await admin
      .from("api_feed_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.payload && cached?.expires_at && new Date(cached.expires_at).getTime() > Date.now()) {
      return res.status(200).json({
        ...(cached.payload as object),
        meta: {
          cached: true,
          cacheKey,
        },
      });
    }

    const payload = await loadFeed(sport, quick);

    await admin.from("api_feed_cache").upsert({
      cache_key: cacheKey,
      payload,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      source: "home",
    });

    return res.status(200).json({
      ...payload,
      meta: {
        cached: false,
        cacheKey,
      },
    });
  }

  const payload = await loadFeed(sport, quick);
  return res.status(200).json({
    ...payload,
    meta: {
      cached: false,
      cacheKey,
      cacheDisabled: true,
    },
  });
}
