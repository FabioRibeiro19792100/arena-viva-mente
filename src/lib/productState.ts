import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export interface ProductReservation {
  matchId: string;
  reservedAt: string;
  accessType: "digital";
}

export interface ProductHistoryItem {
  matchId: string;
  visitedAt: string;
  context: "booking" | "arquibancada" | "resumo";
}

export interface ProductState {
  favorites: string[];
  reservations: ProductReservation[];
  history: ProductHistoryItem[];
}

const STORAGE_PREFIX = "arena-viva-mente.product-state";

const emptyState = (): ProductState => ({
  favorites: [],
  reservations: [],
  history: [],
});

const makeKey = (userId: string) => `${STORAGE_PREFIX}.${userId}`;

const fallbackCountFromMatchId = (matchId: string) => {
  let hash = 0;
  for (let index = 0; index < matchId.length; index += 1) {
    hash = (hash * 31 + matchId.charCodeAt(index)) % 9973;
  }
  return (hash % 64) + 12;
};

const getLocalProductState = (userId: string): ProductState => {
  try {
    const stored = localStorage.getItem(makeKey(userId));
    return stored ? JSON.parse(stored) : emptyState();
  } catch {
    return emptyState();
  }
};

const saveLocalProductState = (userId: string, state: ProductState) => {
  localStorage.setItem(makeKey(userId), JSON.stringify(state));
};

export const getProductState = async (userId: string): Promise<ProductState> => {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalProductState(userId);
  }

  const [favoritesResult, reservationsResult, historyResult] = await Promise.all([
    supabase.from("favorites").select("match_id, created_at").eq("user_id", userId).order("created_at", {
      ascending: false,
    }),
    supabase
      .from("reservations")
      .select("match_id, reserved_at, access_type")
      .eq("user_id", userId)
      .order("reserved_at", {
        ascending: false,
      }),
    supabase
      .from("history_entries")
      .select("match_id, context, visited_at")
      .eq("user_id", userId)
      .order("visited_at", {
        ascending: false,
      }),
  ]);

  if (favoritesResult.error || reservationsResult.error || historyResult.error) {
    console.error("Erro ao buscar estado do produto no Supabase:", {
      favorites: favoritesResult.error,
      reservations: reservationsResult.error,
      history: historyResult.error,
    });
    return emptyState();
  }

  return {
    favorites: favoritesResult.data.map((item) => item.match_id),
    reservations: reservationsResult.data.map((item) => ({
      matchId: item.match_id,
      reservedAt: item.reserved_at,
      accessType: item.access_type,
    })),
    history: historyResult.data.map((item) => ({
      matchId: item.match_id,
      visitedAt: item.visited_at,
      context: item.context,
    })),
  };
};

export const getMatchReservationCounts = async (matchIds: string[]) => {
  const uniqueIds = Array.from(new Set(matchIds)).filter(Boolean);
  if (uniqueIds.length === 0) return {} as Record<string, number>;

  if (!isSupabaseConfigured || !supabase) {
    return uniqueIds.reduce<Record<string, number>>((accumulator, matchId) => {
      accumulator[matchId] = fallbackCountFromMatchId(matchId);
      return accumulator;
    }, {});
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("match_id")
    .in("match_id", uniqueIds);

  if (error) {
    console.error("Erro ao buscar contagem de reservas no Supabase:", error);
    return uniqueIds.reduce<Record<string, number>>((accumulator, matchId) => {
      accumulator[matchId] = 0;
      return accumulator;
    }, {});
  }

  const counts = uniqueIds.reduce<Record<string, number>>((accumulator, matchId) => {
    accumulator[matchId] = 0;
    return accumulator;
  }, {});

  data.forEach((item) => {
    counts[item.match_id] = (counts[item.match_id] || 0) + 1;
  });

  return counts;
};

export const toggleFavoriteMatch = async (userId: string, matchId: string) => {
  if (!isSupabaseConfigured || !supabase) {
    const state = getLocalProductState(userId);
    const isFavorite = state.favorites.includes(matchId);
    const nextFavorites = isFavorite
      ? state.favorites.filter((id) => id !== matchId)
      : [matchId, ...state.favorites];

    saveLocalProductState(userId, {
      ...state,
      favorites: nextFavorites,
    });
    return;
  }

  const { data: existing, error } = await supabase
    .from("favorites")
    .select("match_id")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao consultar favorito no Supabase:", error);
    return;
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("match_id", matchId);

    if (deleteError) {
      console.error("Erro ao remover favorito no Supabase:", deleteError);
    }
    return;
  }

  const { error: insertError } = await supabase.from("favorites").insert({
    user_id: userId,
    match_id: matchId,
  });

  if (insertError) {
    console.error("Erro ao salvar favorito no Supabase:", insertError);
  }
};

export const addReservation = async (userId: string, matchId: string) => {
  if (!isSupabaseConfigured || !supabase) {
    const state = getLocalProductState(userId);
    const existing = state.reservations.find((reservation) => reservation.matchId === matchId);

    if (existing) return;

    saveLocalProductState(userId, {
      ...state,
      reservations: [
        {
          matchId,
          reservedAt: new Date().toISOString(),
          accessType: "digital",
        },
        ...state.reservations,
      ].slice(0, 20),
    });
    return;
  }

  const { error } = await supabase.from("reservations").upsert({
    user_id: userId,
    match_id: matchId,
    access_type: "digital",
    reserved_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Erro ao salvar reserva no Supabase:", error);
  }
};

export const removeReservation = async (userId: string, matchId: string) => {
  if (!isSupabaseConfigured || !supabase) {
    const state = getLocalProductState(userId);

    saveLocalProductState(userId, {
      ...state,
      reservations: state.reservations.filter((reservation) => reservation.matchId !== matchId),
    });
    return;
  }

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("user_id", userId)
    .eq("match_id", matchId);

  if (error) {
    console.error("Erro ao remover reserva no Supabase:", error);
  }
};

export const addHistoryEntry = async (
  userId: string,
  matchId: string,
  context: ProductHistoryItem["context"],
) => {
  if (!isSupabaseConfigured || !supabase) {
    const state = getLocalProductState(userId);
    const deduped = state.history.filter(
      (item) => !(item.matchId === matchId && item.context === context),
    );

    saveLocalProductState(userId, {
      ...state,
      history: [
        {
          matchId,
          visitedAt: new Date().toISOString(),
          context,
        },
        ...deduped,
      ]
        .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
        .slice(0, 30),
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("history_entries").upsert(
    {
      user_id: userId,
      match_id: matchId,
      context,
      visited_at: timestamp,
      updated_at: timestamp,
    },
    {
      onConflict: "user_id,match_id,context",
    },
  );

  if (error) {
    console.error("Erro ao salvar historico no Supabase:", error);
  }
};
