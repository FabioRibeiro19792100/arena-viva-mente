export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string;
          match_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          match_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          match_id?: string;
          user_id?: string;
        };
      };
      history_entries: {
        Row: {
          context: "booking" | "arquibancada" | "resumo";
          match_id: string;
          updated_at: string;
          user_id: string;
          visited_at: string;
        };
        Insert: {
          context: "booking" | "arquibancada" | "resumo";
          match_id: string;
          updated_at?: string;
          user_id: string;
          visited_at?: string;
        };
        Update: {
          context?: "booking" | "arquibancada" | "resumo";
          match_id?: string;
          updated_at?: string;
          user_id?: string;
          visited_at?: string;
        };
      };
      match_preferences: {
        Row: {
          created_at: string;
          match_id: string;
          team_side: "home" | "away" | "neutral";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          match_id: string;
          team_side: "home" | "away" | "neutral";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          match_id?: string;
          team_side?: "home" | "away" | "neutral";
          updated_at?: string;
          user_id?: string;
        };
      };
      messages: {
        Row: {
          created_at: string;
          dislikes_count: number;
          id: string;
          likes_count: number;
          match_id: string;
          team_side: "home" | "away" | "neutral";
          text: string;
          user_avatar_url: string | null;
          user_id: string;
          user_name: string;
        };
        Insert: {
          created_at?: string;
          dislikes_count?: number;
          id?: string;
          likes_count?: number;
          match_id: string;
          team_side: "home" | "away" | "neutral";
          text: string;
          user_avatar_url?: string | null;
          user_id: string;
          user_name: string;
        };
        Update: {
          created_at?: string;
          dislikes_count?: number;
          id?: string;
          likes_count?: number;
          match_id?: string;
          team_side?: "home" | "away" | "neutral";
          text?: string;
          user_avatar_url?: string | null;
          user_id?: string;
          user_name?: string;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          favorite_team: string | null;
          id: string;
          join_date: string | null;
          name: string;
          plan: "free" | "premium";
          provider: "google" | "github" | "x";
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          favorite_team?: string | null;
          id: string;
          join_date?: string | null;
          name: string;
          plan?: "free" | "premium";
          provider: "google" | "github" | "x";
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          favorite_team?: string | null;
          id?: string;
          join_date?: string | null;
          name?: string;
          plan?: "free" | "premium";
          provider?: "google" | "github" | "x";
          updated_at?: string;
          username?: string;
        };
      };
      reservations: {
        Row: {
          access_type: "digital";
          match_id: string;
          reserved_at: string;
          user_id: string;
        };
        Insert: {
          access_type?: "digital";
          match_id: string;
          reserved_at?: string;
          user_id: string;
        };
        Update: {
          access_type?: "digital";
          match_id?: string;
          reserved_at?: string;
          user_id?: string;
        };
      };
      world_cup_predictions: {
        Row: {
          created_at: string;
          match_id: string;
          predicted_away_score: number;
          predicted_home_score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          match_id: string;
          predicted_away_score: number;
          predicted_home_score: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          match_id?: string;
          predicted_away_score?: number;
          predicted_home_score?: number;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
