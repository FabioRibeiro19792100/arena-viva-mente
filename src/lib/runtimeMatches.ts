import { worldCupMatchMap, type WorldCupMatch } from "@/data/worldCup2026";

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
  if (staticMatch) return staticMatch;

  return getRuntimeMatches().find((match) => match.id === id) || null;
};
