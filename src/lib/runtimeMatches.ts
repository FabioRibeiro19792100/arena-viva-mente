import { worldCupMatchMap, type WorldCupMatch } from "@/data/worldCup2026";
import { fetchMatchById, fetchMatchesByIds } from "@/lib/matchesApi";

const runtimeMatches = new Map<string, WorldCupMatch>();

export const getRuntimeMatches = () => Array.from(runtimeMatches.values());

export const upsertRuntimeMatches = (matches: WorldCupMatch[]) => {
  matches.forEach((match) => {
    runtimeMatches.set(match.id, match);
  });
};

export const getMatchById = (id?: string | null) => {
  if (!id) return null;
  const runtimeMatch = runtimeMatches.get(id) || null;
  const staticMatch = worldCupMatchMap[id] || null;

  if (staticMatch && runtimeMatch) {
    return {
      ...staticMatch,
      ...runtimeMatch,
    };
  }

  return runtimeMatch || staticMatch;
};

export const hydrateRuntimeMatchesByIds = async (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  const missingIds = uniqueIds.filter((id) => !runtimeMatches.has(id));

  if (missingIds.length > 0) {
    const matches = await fetchMatchesByIds(missingIds);
    upsertRuntimeMatches(matches);
  }

  return getRuntimeMatches();
};

export const loadMatchById = async (id?: string | null) => {
  if (!id) return null;

  const existing = getMatchById(id);
  if (existing && !id.startsWith("api-")) {
    return existing;
  }

  try {
    const match = await fetchMatchById(id);
    if (match) {
      upsertRuntimeMatches([match]);
    }
    return match || existing;
  } catch {
    return existing;
  }
};
