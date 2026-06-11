import type { WorldCupMatch } from "@/data/worldCup2026";

export type WorldCupPoolMatch = WorldCupMatch & {
  linkedSportsMatchId?: string | null;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return response.json();
};

export const fetchWorldCupPoolMatches = async () => {
  const payload = await fetchJson<{ matches: WorldCupPoolMatch[] }>("/api/world-cup-matches");
  return payload.matches || [];
};
