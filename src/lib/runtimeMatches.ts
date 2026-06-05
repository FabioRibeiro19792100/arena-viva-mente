import { worldCupMatchMap, type WorldCupMatch } from "@/data/worldCup2026";
import {
  mapApiFixtureToWorldCupMatch,
  mapApiNbaGameToMatch,
  mapApiVolleyballGameToMatch,
  type ApiFootballFixture,
  type ApiNbaGame,
  type ApiVolleyballGame,
} from "@/lib/apiFootball";

const RUNTIME_MATCHES_KEY = "arena-tikitaka.runtime-matches";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getRuntimeMatches = (): WorldCupMatch[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(RUNTIME_MATCHES_KEY);
    return raw ? (JSON.parse(raw) as WorldCupMatch[]) : [];
  } catch {
    return [];
  }
};

export const upsertRuntimeMatches = (matches: WorldCupMatch[]) => {
  if (!canUseStorage() || matches.length === 0) return;

  const current = getRuntimeMatches();
  const map = new Map<string, WorldCupMatch>(current.map((match) => [match.id, match]));

  matches.forEach((match) => {
    map.set(match.id, match);
  });

  window.localStorage.setItem(RUNTIME_MATCHES_KEY, JSON.stringify(Array.from(map.values())));
};

export const getMatchById = (id?: string | null) => {
  if (!id) return null;

  const staticMatch = worldCupMatchMap[id];
  const runtimeMatch = getRuntimeMatches().find((match) => match.id === id) || null;

  if (staticMatch && runtimeMatch) {
    return {
      ...staticMatch,
      ...runtimeMatch,
    };
  }

  if (runtimeMatch) return runtimeMatch;
  if (staticMatch) return staticMatch;
  return null;
};

const fetchJson = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
};

export const hydrateRuntimeMatchesByIds = async (ids: string[]) => {
  const missingApiIds = Array.from(new Set(ids)).filter((id) => id?.startsWith("api-") && !getMatchById(id));

  if (missingApiIds.length === 0) {
    return getRuntimeMatches();
  }

  const hydratedMatches = await Promise.all(
    missingApiIds.map(async (id) => {
      if (id.startsWith("api-football-")) {
        const fixtureId = id.replace("api-football-", "");
        const payload = await fetchJson(`/api/football/fixtures?id=${fixtureId}&timezone=America/Sao_Paulo`);
        const fixture = Array.isArray(payload?.response) ? (payload.response[0] as ApiFootballFixture | undefined) : undefined;
        return fixture ? mapApiFixtureToWorldCupMatch(fixture) : null;
      }

      if (id.startsWith("api-nba-")) {
        const gameId = id.replace("api-nba-", "");
        const payload = await fetchJson(`/api/nba/games?id=${gameId}`);
        const game = Array.isArray(payload?.response) ? (payload.response[0] as ApiNbaGame | undefined) : undefined;
        return game ? mapApiNbaGameToMatch(game) : null;
      }

      if (id.startsWith("api-volleyball-")) {
        const gameId = id.replace("api-volleyball-", "");
        const payload = await fetchJson(`/api/volleyball/games?id=${gameId}`);
        const game = Array.isArray(payload?.response) ? (payload.response[0] as ApiVolleyballGame | undefined) : undefined;
        return game ? mapApiVolleyballGameToMatch(game) : null;
      }

      return null;
    }),
  );

  const resolved = hydratedMatches.filter(Boolean) as WorldCupMatch[];
  if (resolved.length > 0) {
    upsertRuntimeMatches(resolved);
  }

  return getRuntimeMatches();
};
