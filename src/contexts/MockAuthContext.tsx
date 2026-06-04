import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type MockAuthProvider = "google" | "github" | "x";
export type MockPlan = "free" | "premium";
export type AuthMode = "mock" | "supabase";

export interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  favoriteTeam: string;
  provider: MockAuthProvider;
  plan: MockPlan;
  avatar: string;
  joinDate: string;
}

interface MockAuthContextValue {
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AuthMode;
  login: (input: {
    provider: MockAuthProvider;
    name?: string;
    favoriteTeam?: string;
    plan?: MockPlan;
  }) => void;
  loginDevBypass: (input: { name?: string; favoriteTeam?: string }) => void;
  logout: () => void;
  updateUser: (updates: Partial<Pick<MockUser, "name" | "username" | "favoriteTeam" | "plan">>) => void;
}

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const STORAGE_KEY = "arena-viva-mente.mock-auth";
const PENDING_AUTH_KEY = "arena-viva-mente.pending-auth-profile";
const PENDING_REDIRECT_KEY = "arena-viva-mente.pending-auth-redirect";
const DEV_BYPASS_KEY = "arena-viva-mente.dev-bypass-auth";

const MockAuthContext = createContext<MockAuthContextValue | undefined>(undefined);

const sanitizeUsername = (name: string) =>
  `@${name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "torcedor_2026"}`;

const normalizeNickname = (value: string) => {
  const cleaned = value.trim().replace(/^@+/, "");
  return cleaned ? sanitizeUsername(cleaned) : "@torcedor_2026";
};

const makeAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111111&color=ffffff`;

const formatJoinDate = (value?: string | null) =>
  new Date(value || Date.now()).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

const providerFromSupabase = (user: SupabaseUser): MockAuthProvider => {
  const provider = user.app_metadata?.provider;
  if (provider === "github") return "github";
  if (provider === "twitter") return "x";
  return "google";
};

const buildUserFromProfile = (profile: ProfileRow, email = ""): MockUser => ({
  id: profile.id,
  name: profile.name,
  username: profile.username,
  email,
  favoriteTeam: profile.favorite_team || "Neutro",
  provider: profile.provider,
  plan: profile.plan,
  avatar: profile.avatar_url || makeAvatar(profile.name),
  joinDate: formatJoinDate(profile.join_date || profile.created_at),
});

const readPendingProfile = () => {
  try {
    const stored = localStorage.getItem(PENDING_AUTH_KEY);
    return stored
      ? (JSON.parse(stored) as {
          name?: string;
          favoriteTeam?: string;
          plan?: MockPlan;
          provider?: MockAuthProvider;
        })
      : null;
  } catch {
    return null;
  }
};

const clearPendingProfile = () => localStorage.removeItem(PENDING_AUTH_KEY);
const isLocalDevHost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const buildOAuthRedirectUrl = () => {
  const { origin, pathname, search, hash } = window.location;
  const next = `${pathname}${search}${hash}`;
  localStorage.setItem(PENDING_REDIRECT_KEY, next);

  const redirect = new URL(`${origin}/login`);
  redirect.searchParams.set("next", next);
  return redirect.toString();
};

const resolveProfilePayload = (
  authUser: SupabaseUser,
  pending: { name?: string; favoriteTeam?: string; plan?: MockPlan; provider?: MockAuthProvider } | null,
) => {
  const provider = pending?.provider || providerFromSupabase(authUser);
  const metadata = authUser.user_metadata;
  const baseName =
    pending?.name?.trim() ||
    metadata?.full_name ||
    metadata?.name ||
    metadata?.preferred_username ||
    authUser.email?.split("@")[0] ||
    "Torcedor 2026";

  return {
    id: authUser.id,
    name: baseName,
    username: sanitizeUsername(baseName),
    favorite_team: pending?.favoriteTeam?.trim() || metadata?.favorite_team || "Neutro",
    provider,
    plan: pending?.plan || "free",
    avatar_url: metadata?.avatar_url || makeAvatar(baseName),
    join_date: new Date(authUser.created_at).toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  } satisfies Database["public"]["Tables"]["profiles"]["Insert"];
};

const getOrCreateSupabaseProfile = async (authUser: SupabaseUser) => {
  if (!supabase) return null;

  const pending = readPendingProfile();
  const { data: existingProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar perfil no Supabase:", error);
  }

  if (existingProfile && !pending) {
    return buildUserFromProfile(existingProfile, authUser.email || "");
  }

  const payload = existingProfile
    ? {
        ...existingProfile,
        name: pending?.name?.trim() || existingProfile.name,
        username: pending?.name?.trim()
          ? sanitizeUsername(pending.name)
          : existingProfile.username,
        favorite_team: pending?.favoriteTeam?.trim() || existingProfile.favorite_team,
        plan: pending?.plan || existingProfile.plan,
        provider: pending?.provider || existingProfile.provider,
        avatar_url: pending?.name?.trim() ? makeAvatar(pending.name) : existingProfile.avatar_url,
        updated_at: new Date().toISOString(),
      }
    : resolveProfilePayload(authUser, pending);

  const { data: profile, error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload)
    .select("*")
    .single();

  if (upsertError) {
    console.error("Erro ao salvar perfil no Supabase:", upsertError);
    return existingProfile ? buildUserFromProfile(existingProfile, authUser.email || "") : null;
  }

  clearPendingProfile();
  return buildUserFromProfile(profile, authUser.email || "");
};

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mode: AuthMode = isSupabaseConfigured ? "supabase" : "mock";

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let active = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user) {
        if (isLocalDevHost()) {
          const storedBypass = localStorage.getItem(DEV_BYPASS_KEY);
          if (storedBypass) {
            setUser(JSON.parse(storedBypass));
            setIsLoading(false);
            return;
          }
        }

        setUser(null);
        setIsLoading(false);
        return;
      }

      const nextUser = await getOrCreateSupabaseProfile(session.user);
      if (!active) return;

      setUser(nextUser);
      setIsLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!active) return;

        if (!session?.user) {
          if (isLocalDevHost()) {
            const storedBypass = localStorage.getItem(DEV_BYPASS_KEY);
            if (storedBypass) {
              setUser(JSON.parse(storedBypass));
              setIsLoading(false);
              return;
            }
          }

          setUser(null);
          setIsLoading(false);
          return;
        }

        const nextUser = await getOrCreateSupabaseProfile(session.user);
        if (!active) return;

        setUser(nextUser);
        setIsLoading(false);
      })();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const persistMockUser = (nextUser: MockUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo<MockAuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      mode,
      login: ({ provider, name, favoriteTeam, plan = "free" }) => {
        if (mode === "supabase" && supabase) {
          localStorage.setItem(
            PENDING_AUTH_KEY,
            JSON.stringify({
              provider,
              name,
              favoriteTeam,
              plan,
            }),
          );

          const mappedProvider = provider === "x" ? "twitter" : provider;
          void supabase.auth.signInWithOAuth({
            provider: mappedProvider,
            options: {
              redirectTo: buildOAuthRedirectUrl(),
            },
          });
          return;
        }

        const finalName = name?.trim() || "Torcedor 2026";
        const finalTeam = favoriteTeam?.trim() || "Neutro";
      const nextUser: MockUser = {
        id: `mock-${provider}-${Date.now()}`,
        name: finalName,
        username: sanitizeUsername(finalName),
        email: "",
        favoriteTeam: finalTeam,
        provider,
        plan,
          avatar: makeAvatar(finalName),
          joinDate: formatJoinDate(),
        };
        persistMockUser(nextUser);
      },
      loginDevBypass: ({ name, favoriteTeam }) => {
        const finalName = name?.trim() || "Torcedor local";
        const finalTeam = favoriteTeam?.trim() || "Neutro";
        const nextUser: MockUser = {
          id: `dev-local-${Date.now()}`,
          name: finalName,
          username: sanitizeUsername(finalName),
          email: "local@arenatikitaka.dev",
          favoriteTeam: finalTeam,
          provider: "google",
          plan: "free",
          avatar: makeAvatar(finalName),
          joinDate: formatJoinDate(),
        };

        setUser(nextUser);
        localStorage.setItem(DEV_BYPASS_KEY, JSON.stringify(nextUser));
      },
      logout: () => {
        localStorage.removeItem(DEV_BYPASS_KEY);
        if (mode === "supabase" && supabase) {
          void supabase.auth.signOut();
          return;
        }
        persistMockUser(null);
      },
      updateUser: (updates) => {
        if (mode === "supabase" && supabase && user) {
          void supabase
            .from("profiles")
            .update({
              name: updates.name?.trim() || user.name,
              username: updates.username?.trim()
                ? normalizeNickname(updates.username)
                : updates.name?.trim()
                  ? sanitizeUsername(updates.name)
                  : user.username,
              favorite_team: updates.favoriteTeam?.trim() || user.favoriteTeam,
              plan: updates.plan || user.plan,
              avatar_url: updates.name?.trim() ? makeAvatar(updates.name) : user.avatar,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
            .select("*")
            .single()
            .then(({ data, error }) => {
              if (error || !data) {
                console.error("Erro ao atualizar perfil no Supabase:", error);
                return;
              }
              setUser(buildUserFromProfile(data, user.email));
            });
          return;
        }

        if (!user) return;
        const nextUser = {
          ...user,
          ...updates,
          username: updates.username
            ? normalizeNickname(updates.username)
            : updates.name
              ? sanitizeUsername(updates.name)
              : user.username,
          avatar: updates.name ? makeAvatar(updates.name) : user.avatar,
        };
        persistMockUser(nextUser);
      },
    }),
    [isLoading, mode, user],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return context;
};
