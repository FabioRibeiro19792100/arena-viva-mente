import { fetchMatchInsightsById } from "@/lib/matchesApi";

export interface MatchInsightEvent {
  minute: string;
  team: string;
  type: string;
  detail: string;
  player?: string;
  assist?: string;
}

export interface MatchInsightLineupTeam {
  team: string;
  coach: string;
  formation: string;
  starters: string[];
  substitutes: string[];
}

export interface MatchInsightTeamStat {
  team: string;
  stats: Array<{ label: string; value: string }>;
}

export interface MatchInsightPlayerStat {
  player: string;
  team: string;
  rating?: string;
  summary: string;
}

export interface MatchInsightOdds {
  bookmaker: string;
  home?: string;
  draw?: string;
  away?: string;
}

export interface MatchInsightPrediction {
  advice?: string;
  homePercent?: string;
  drawPercent?: string;
  awayPercent?: string;
}

export interface MatchInsightHeadToHead {
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
}

export interface MatchInsightsPayload {
  events: MatchInsightEvent[];
  lineups: MatchInsightLineupTeam[];
  teamStats: MatchInsightTeamStat[];
  playerStats: MatchInsightPlayerStat[];
  odds: MatchInsightOdds[];
  prediction?: MatchInsightPrediction;
  headToHead: MatchInsightHeadToHead[];
}

export const fetchFootballMatchInsights = async (matchId: string): Promise<MatchInsightsPayload | null> =>
  fetchMatchInsightsById(matchId);
