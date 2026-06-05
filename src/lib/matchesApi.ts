import type { WorldCupMatch } from "@/data/worldCup2026";
import type { MatchInsightsPayload } from "@/lib/matchInsights";

export type SportType = "futebol" | "basquete" | "volei";
export type QuickFilterType = "all" | "live" | "soon";
export type ApiFeedStatus = {
  football: "ok" | "partial" | "offline" | "plan" | "limit" | "suspended";
  nba: "ok" | "partial" | "offline" | "limit" | "suspended";
  volleyball: "ok" | "partial" | "offline" | "limit" | "suspended";
};

export type DisplayMatch = WorldCupMatch & { sport: SportType };

export interface MatchesFeedResponse {
  matches: DisplayMatch[];
  todayMatches: DisplayMatch[];
  apiFeedStatus: ApiFeedStatus | null;
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return response.json();
};

export const fetchMatchesFeed = async (params: {
  sport: "all" | SportType;
  quick: QuickFilterType;
  search: string;
}) => {
  const query = new URLSearchParams();
  if (params.sport !== "all") query.set("sport", params.sport);
  if (params.quick !== "all") query.set("quick", params.quick);
  if (params.search.trim()) query.set("search", params.search.trim());

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchJson<MatchesFeedResponse>(`/api/matches${suffix}`);
};

export const fetchMatchesByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  const query = new URLSearchParams({ ids: ids.join(",") });
  const payload = await fetchJson<MatchesFeedResponse>(`/api/matches?${query.toString()}`);
  return payload.matches || [];
};

export const fetchMatchById = async (id: string) => {
  const payload = await fetchJson<{ match: DisplayMatch }>(`/api/matches/${encodeURIComponent(id)}`);
  return payload.match;
};

export const fetchMatchInsightsById = async (id: string) => {
  const payload = await fetchJson<{ insights: MatchInsightsPayload | null }>(
    `/api/matches/${encodeURIComponent(id)}/insights`,
  );
  return payload.insights;
};
