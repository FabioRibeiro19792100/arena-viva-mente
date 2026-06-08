import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { MockUser } from "@/contexts/MockAuthContext";

export type TeamSide = "home" | "away" | "neutral";

export interface MatchMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string;
  teamSide: TeamSide;
  likes: number;
  dislikes: number;
  createdAt: string;
}

interface GetMatchMessagesOptions {
  limit?: number;
  after?: string | null;
  before?: string | null;
}

const LOCAL_TEAM_PREFIX = "arena-viva-mente.match-team";
const LOCAL_MESSAGES_PREFIX = "arena-viva-mente.match-messages";
const LOCAL_MUTED_USERS_PREFIX = "arena-viva-mente.match-muted-users";
const LOCAL_FAVORITE_MESSAGES_PREFIX = "arena-viva-mente.match-favorite-messages";
const isLocalDevHost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const teamKey = (userId: string, matchId: string) => `${LOCAL_TEAM_PREFIX}.${userId}.${matchId}`;
const messagesKey = (matchId: string) => `${LOCAL_MESSAGES_PREFIX}.${matchId}`;
const mutedUsersKey = (userId: string, matchId: string) => `${LOCAL_MUTED_USERS_PREFIX}.${userId}.${matchId}`;
const favoriteMessagesKey = (userId: string, matchId: string) =>
  `${LOCAL_FAVORITE_MESSAGES_PREFIX}.${userId}.${matchId}`;

const readLocalMessages = (matchId: string): MatchMessage[] => {
  try {
    const stored = localStorage.getItem(messagesKey(matchId));
    return stored ? (JSON.parse(stored) as MatchMessage[]) : [];
  } catch {
    return [];
  }
};

const filterMessagesWindow = (messages: MatchMessage[], options?: GetMatchMessagesOptions) => {
  const after = options?.after ? new Date(options.after).getTime() : null;
  const before = options?.before ? new Date(options.before).getTime() : null;

  let nextMessages = messages.filter((message) => {
    const createdAt = new Date(message.createdAt).getTime();
    if (after !== null && createdAt <= after) return false;
    if (before !== null && createdAt >= before) return false;
    return true;
  });

  if (typeof options?.limit === "number" && options.limit > 0) {
    nextMessages = nextMessages.slice(-options.limit);
  }

  return nextMessages;
};

const saveLocalMessages = (matchId: string, messages: MatchMessage[]) => {
  localStorage.setItem(messagesKey(matchId), JSON.stringify(messages));
};

const readLocalMutedUsers = (userId: string, matchId: string): string[] => {
  try {
    const stored = localStorage.getItem(mutedUsersKey(userId, matchId));
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

const saveLocalMutedUsers = (userId: string, matchId: string, mutedUserIds: string[]) => {
  localStorage.setItem(mutedUsersKey(userId, matchId), JSON.stringify(mutedUserIds));
};

const readLocalFavoriteMessages = (userId: string, matchId: string): string[] => {
  try {
    const stored = localStorage.getItem(favoriteMessagesKey(userId, matchId));
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

const saveLocalFavoriteMessages = (userId: string, matchId: string, messageIds: string[]) => {
  localStorage.setItem(favoriteMessagesKey(userId, matchId), JSON.stringify(messageIds));
};

export const getMatchPreference = async (userId: string, matchId: string): Promise<TeamSide | null> => {
  if (!isSupabaseConfigured || !supabase || isLocalDevHost()) {
    const stored = localStorage.getItem(teamKey(userId, matchId));
    return stored ? (stored as TeamSide) : null;
  }

  const { data, error } = await supabase
    .from("match_preferences")
    .select("team_side")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar preferencia da partida no Supabase:", error);
    return null;
  }

  return data?.team_side || null;
};

export const saveMatchPreference = async (userId: string, matchId: string, teamSide: TeamSide) => {
  if (!isSupabaseConfigured || !supabase || isLocalDevHost()) {
    localStorage.setItem(teamKey(userId, matchId), teamSide);
    return;
  }

  const { error } = await supabase.from("match_preferences").upsert({
    user_id: userId,
    match_id: matchId,
    team_side: teamSide,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Erro ao salvar preferencia da partida no Supabase:", error);
  }
};

export const getMutedUsers = async (userId: string, matchId: string): Promise<string[]> => {
  return readLocalMutedUsers(userId, matchId);
};

export const toggleMutedUser = async (
  userId: string,
  matchId: string,
  mutedUserId: string,
): Promise<string[]> => {
  const currentMutedUsers = readLocalMutedUsers(userId, matchId);
  const nextMutedUsers = currentMutedUsers.includes(mutedUserId)
    ? currentMutedUsers.filter((id) => id !== mutedUserId)
    : [...currentMutedUsers, mutedUserId];

  saveLocalMutedUsers(userId, matchId, nextMutedUsers);
  return nextMutedUsers;
};

export const getFavoriteMessages = async (userId: string, matchId: string): Promise<string[]> => {
  return readLocalFavoriteMessages(userId, matchId);
};

export const toggleFavoriteMessage = async (
  userId: string,
  matchId: string,
  messageId: string,
): Promise<string[]> => {
  const currentFavoriteMessages = readLocalFavoriteMessages(userId, matchId);
  const nextFavoriteMessages = currentFavoriteMessages.includes(messageId)
    ? currentFavoriteMessages.filter((id) => id !== messageId)
    : [...currentFavoriteMessages, messageId];

  saveLocalFavoriteMessages(userId, matchId, nextFavoriteMessages);
  return nextFavoriteMessages;
};

const mapMessageRow = (row: {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  text: string;
  team_side: TeamSide;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}): MatchMessage => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  userAvatarUrl: row.user_avatar_url,
  text: row.text,
  teamSide: row.team_side,
  likes: row.likes_count,
  dislikes: row.dislikes_count,
  createdAt: row.created_at,
});

export const getMatchMessages = async (
  matchId: string,
  options?: GetMatchMessagesOptions,
): Promise<MatchMessage[]> => {
  if (!isSupabaseConfigured || !supabase || isLocalDevHost()) {
    return filterMessagesWindow(readLocalMessages(matchId), options);
  }

  let query = supabase
    .from("messages")
    .select(
      "id, user_id, user_name, user_avatar_url, text, team_side, likes_count, dislikes_count, created_at",
    )
    .eq("match_id", matchId);

  if (options?.after) {
    query = query.gt("created_at", options.after);
  }

  if (options?.before) {
    query = query.lt("created_at", options.before);
  }

  if (typeof options?.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar mensagens no Supabase:", error);
    return [];
  }

  return data.map(mapMessageRow);
};

export const sendMatchMessage = async (input: {
  matchId: string;
  user: MockUser;
  text: string;
  teamSide: TeamSide;
}) => {
  if (!isSupabaseConfigured || !supabase || isLocalDevHost()) {
    const nextMessage: MatchMessage = {
      id: `local-${Date.now()}`,
      userId: input.user.id,
      userName: input.user.name,
      userAvatarUrl: input.user.avatar,
      text: input.text,
      teamSide: input.teamSide,
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString(),
    };
    const messages = [...readLocalMessages(input.matchId), nextMessage];
    saveLocalMessages(input.matchId, messages);
    return nextMessage;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: input.matchId,
      user_id: input.user.id,
      user_name: input.user.name,
      user_avatar_url: input.user.avatar,
      text: input.text,
      team_side: input.teamSide,
    })
    .select(
      "id, user_id, user_name, user_avatar_url, text, team_side, likes_count, dislikes_count, created_at",
    )
    .single();

  if (error) {
    console.error("Erro ao enviar mensagem no Supabase:", error);
    throw error;
  }

  return mapMessageRow(data);
};
