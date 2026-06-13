import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CalendarDays,
  Filter,
  Heart,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Send,
  Shield,
  Volume2,
  VolumeX,
} from "lucide-react";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import {
  formatBrasiliaTime,
  getCurrentMatchStatus,
  getMatchStatusLabel,
  isMatchRoomOpen,
  isSummaryAvailableForMatch,
} from "@/data/worldCup2026";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addHistoryEntry } from "@/lib/productState";
import { fetchFootballMatchInsights, type MatchInsightsPayload } from "@/lib/matchInsights";
import {
  getFavoriteMessages,
  getMatchMessages,
  getMutedUsers,
  getMatchPreference,
  saveMatchPreference,
  sendMatchMessage,
  toggleFavoriteMessage,
  toggleMutedUser,
  type MatchMessage,
  type TeamSide,
} from "@/lib/arquibancada";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { getMatchById, loadMatchById } from "@/lib/runtimeMatches";

const INITIAL_MESSAGES_LIMIT = 40;

const formatMessageTime = (createdAt: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));

const mergeMessages = (current: MatchMessage[], incoming: MatchMessage[]) => {
  const map = new Map(current.map((message) => [message.id, message]));

  incoming.forEach((message) => {
    map.set(message.id, message);
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

const Arquibancada = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeTeamFilters, setActiveTeamFilters] = useState<Array<"home" | "neutral" | "away">>([
    "home",
    "neutral",
    "away",
  ]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUserTeam, setCurrentUserTeam] = useState<"home" | "away" | "neutral">("neutral");
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [insights, setInsights] = useState<MatchInsightsPayload | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingMessageCount, setPendingMessageCount] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [favoriteMessageIds, setFavoriteMessageIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedWrapperRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const messagesRef = useRef<MatchMessage[]>([]);
  const shouldAutoScrollRef = useRef(true);
  const [game, setGame] = useState(() => getMatchById(id));
  const [hasResolvedGame, setHasResolvedGame] = useState(false);
  const activeGame = game;
  const isLoadingGame = !hasResolvedGame && !activeGame;
  const currentStatus = activeGame ? getCurrentMatchStatus(activeGame) : "scheduled";
  const roomOpen = activeGame ? isMatchRoomOpen(activeGame) : false;
  const effectiveRoomOpen =
    roomOpen || Boolean((location.state as { forceRoomOpen?: boolean } | null)?.forceRoomOpen);
  const statusLabel = activeGame ? getMatchStatusLabel(activeGame) : "Reserva disponível";
  const hasPostGameSummary = activeGame ? isSummaryAvailableForMatch(activeGame) : false;

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const nextMatch = await loadMatchById(id);
      if (isActive && nextMatch) {
        setGame(nextMatch);
      } else if (isActive) {
        setGame(null);
      }
      if (isActive) setHasResolvedGame(true);
    })();

    return () => {
      isActive = false;
    };
  }, [id]);

  const refreshMessages = async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
    if (!effectiveRoomOpen) return;

    if (showLoader) {
      setIsMessagesLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const latestKnownMessage = messagesRef.current[messagesRef.current.length - 1];
      const nextMessages = await getMatchMessages(
        activeGame.id,
        showLoader
          ? { limit: INITIAL_MESSAGES_LIMIT }
          : latestKnownMessage
            ? { after: latestKnownMessage.createdAt }
            : { limit: INITIAL_MESSAGES_LIMIT },
      );
      shouldAutoScrollRef.current = showLoader;
      setMessages((current) => mergeMessages(current, nextMessages));
    } catch (error) {
      toast({
        title: "Nao foi possivel atualizar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsMessagesLoading(false);
      setIsRefreshing(false);
      setPendingMessageCount(0);
      setPullDistance(0);
    }
  };

  const syncNewMessageIndicators = async () => {
    if (!effectiveRoomOpen || isRefreshing || isMessagesLoading) return;

    try {
      const currentMessages = messagesRef.current;
      const latestKnownMessage = currentMessages[currentMessages.length - 1];
      const remoteMessages = await getMatchMessages(
        activeGame.id,
        latestKnownMessage ? { after: latestKnownMessage.createdAt } : { limit: INITIAL_MESSAGES_LIMIT },
      );

      const unseenMessages = remoteMessages.filter(
        (item) =>
          item.userId !== user?.id &&
          !mutedUserIds.includes(item.userId),
      );

      if (unseenMessages.length > 0) {
        setPendingMessageCount((current) => Math.max(current, unseenMessages.length));
      }
    } catch {
      // Silent fallback: this sync only exists to light up the new-message indicator.
    }
  };

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isLoadingGame || !activeGame || !user) return;
    void addHistoryEntry(user.id, activeGame.id, "arquibancada");
  }, [activeGame?.id, isLoadingGame, user]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    if (!user) {
      setMutedUserIds([]);
      setFavoriteMessageIds([]);
      return;
    }

    let isActive = true;

    void (async () => {
      const [nextMutedUsers, nextFavoriteMessages] = await Promise.all([
        getMutedUsers(user.id, activeGame.id),
        getFavoriteMessages(user.id, activeGame.id),
      ]);
      if (isActive) {
        setMutedUserIds(nextMutedUsers);
        setFavoriteMessageIds(nextFavoriteMessages);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [activeGame?.id, isLoadingGame, user]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    let isActive = true;

    if (activeGame.apiSource && activeGame.apiSource !== "football") {
      setInsights(null);
      setIsInsightsLoading(false);
      return;
    }

    setIsInsightsLoading(true);

    void (async () => {
      try {
        const nextInsights = await fetchFootballMatchInsights(activeGame.id);
        if (!isActive) return;
        setInsights(nextInsights);
      } catch {
        if (!isActive) return;
        setInsights(null);
      } finally {
        if (isActive) {
          setIsInsightsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [activeGame?.id, activeGame?.apiSource, isLoadingGame]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    if (!user) return;
    if (!effectiveRoomOpen) {
      setShowOnboarding(false);
      return;
    }

    let isActive = true;

    void (async () => {
      const savedTeam = await getMatchPreference(user.id, activeGame.id);
      if (!isActive) return;

      if (savedTeam) {
        setCurrentUserTeam(savedTeam);
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [activeGame?.id, currentStatus, effectiveRoomOpen, isLoadingGame, user]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    if (!effectiveRoomOpen) {
      setMessages([]);
      setIsMessagesLoading(false);
      setPendingMessageCount(0);
      return;
    }

    void refreshMessages({ showLoader: true });
  }, [activeGame?.id, currentStatus, effectiveRoomOpen, isLoadingGame]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    if (!effectiveRoomOpen || !isSupabaseConfigured || !supabase) {
      return;
    }

    const channel = supabase
      .channel(`match-messages-indicator-${activeGame.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${activeGame.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; user_id: string };

          if (row.user_id === user?.id) {
            return;
          }

          setPendingMessageCount((current) => current + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeGame?.id, currentStatus, effectiveRoomOpen, isLoadingGame, user?.id]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    if (!effectiveRoomOpen) {
      return;
    }

    const interval = window.setInterval(() => {
      void syncNewMessageIndicators();
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeGame?.id, currentStatus, effectiveRoomOpen, isLoadingGame, isMessagesLoading, isRefreshing, user?.id]);

  useEffect(() => {
    if (isLoadingGame || !activeGame) return;
    if (!effectiveRoomOpen) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNewMessageIndicators();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeGame?.id, currentStatus, effectiveRoomOpen, isLoadingGame, isMessagesLoading, isRefreshing, user?.id]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    shouldAutoScrollRef.current = false;
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  const moderateMessage = (text: string) => {
    const bannedWords = ["idiota", "lixo", "merda", "burro"];
    const hasBannedWord = bannedWords.some((word) => text.toLowerCase().includes(word));

    if (hasBannedWord) return { blocked: true, severity: "high" };

    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperCaseRatio > 0.7 && text.length > 20) {
      return { blocked: true, severity: "low" };
    }

    return { blocked: false, severity: "none" };
  };

  const handleSendMessage = async () => {
    if (cooldown > 0) {
      toast({
        title: "⏱️ Calma, torcida!",
        description: `Aguarde ${cooldown}s antes de enviar outra mensagem.`,
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) return;
    if (!user) return;

    if (message.length > 180) {
      toast({
        title: "✂️ Mensagem muito longa",
        description: "Máximo de 180 caracteres permitido.",
        variant: "destructive",
      });
      return;
    }

    const moderation = moderateMessage(message);
    if (moderation.blocked) {
      if (moderation.severity === "high") {
        setIsBlocked(true);
        toast({
          title: "🚫 Mensagem bloqueada",
          description: "Linguagem ofensiva detectada. Você foi temporariamente bloqueado por 10 minutos.",
          variant: "destructive",
        });
        setTimeout(() => setIsBlocked(false), 600000);
      } else {
        toast({
          title: "⚠️ Ei, pegue leve!",
          description: "Sua mensagem foi moderada. Mantenha um clima respeitoso.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const trimmedMessage = message.trim();
      const optimisticMessage: MatchMessage = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatarUrl: user.avatar,
        text: trimmedMessage,
        teamSide: currentUserTeam,
        likes: 0,
        dislikes: 0,
        createdAt: new Date().toISOString(),
      };

      shouldAutoScrollRef.current = true;
      setMessages((current) => mergeMessages(current, [optimisticMessage]));
      setMessage("");
      setCooldown(3);

      const sentMessage = await sendMatchMessage({
        matchId: activeGame.id,
        user,
        text: trimmedMessage,
        teamSide: currentUserTeam,
      });

      setMessages((current) =>
        mergeMessages(
          current.filter((item) => item.id !== optimisticMessage.id),
          [sentMessage],
        ),
      );

      if (!isSupabaseConfigured) {
        const refreshedMessages = await getMatchMessages(activeGame.id, { limit: INITIAL_MESSAGES_LIMIT });
        setMessages((current) => mergeMessages(current, refreshedMessages));
      }
    } catch (error) {
      setMessages((current) => current.filter((item) => !item.id.startsWith("temp-")));
      toast({
        title: "Nao foi possivel enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const isFeedAtTop = () => {
    const rect = feedWrapperRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return rect.top >= 0;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isFeedAtTop()) return;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || !isFeedAtTop()) return;

    const currentY = event.touches[0]?.clientY ?? 0;
    const distance = Math.max(0, currentY - touchStartYRef.current);
    if (distance > 0 && event.cancelable) {
      event.preventDefault();
    }
    setPullDistance(Math.min(distance, 84));
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;

    const shouldRefresh = pullDistance >= 72;
    touchStartYRef.current = null;

    if (shouldRefresh) {
      void refreshMessages();
      return;
    }

    setPullDistance(0);
  };

  const handleOnboardingComplete = (team: "home" | "away" | "neutral") => {
    if (!user || !activeGame) return;

    void (async () => {
      await saveMatchPreference(user.id, activeGame.id, team);
      setCurrentUserTeam(team);
      setShowOnboarding(false);
    })();
  };

  const getTeamIdentity = (team: string) => {
    if (!activeGame) {
      return { label: "Neutro", logo: null, tone: "neutral" as const };
    }
    if (team === "homeTeam" || team === "home") {
      return { label: activeGame.homeTeam, logo: activeGame.homeTeamLogo, tone: "home" as const };
    }
    if (team === "awayTeam" || team === "away") {
      return { label: activeGame.awayTeam, logo: activeGame.awayTeamLogo, tone: "away" as const };
    }
    return { label: "Neutro", logo: null, tone: "neutral" as const };
  };

  const toggleTeamFilter = (team: "home" | "neutral" | "away") => {
    setActiveTeamFilters((current) =>
      current.includes(team) ? current.filter((item) => item !== team) : [...current, team],
    );
  };

  const filteredMessages = messages.filter(
    (msg) => activeTeamFilters.includes(msg.teamSide) && !mutedUserIds.includes(msg.userId),
  );

  if (isLoadingGame) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (!activeGame) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
          <p className="text-sm text-muted-foreground">Essa sala não está disponível agora.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Voltar para jogos</Button>
        </div>
      </div>
    );
  }

  const handleToggleMutedUser = (mutedUserId: string, userName: string) => {
    if (!user || mutedUserId === user.id) return;

    void (async () => {
      const nextMutedUsers = await toggleMutedUser(user.id, activeGame.id, mutedUserId);
      const didMute = nextMutedUsers.includes(mutedUserId);
      setMutedUserIds(nextMutedUsers);
      setPendingMessageCount(0);
      toast({
        title: didMute ? "Comentários silenciados" : "Comentários reativados",
        description: didMute
          ? `Você não verá mais as mensagens de ${userName} nesta sala.`
          : `As mensagens de ${userName} voltaram a aparecer nesta sala.`,
      });
    })();
  };

  const handleToggleFavoriteMessage = (messageId: string) => {
    if (!user) return;

    void (async () => {
      const nextFavoriteMessages = await toggleFavoriteMessage(user.id, activeGame.id, messageId);
      const isNowFavorite = nextFavoriteMessages.includes(messageId);
      setFavoriteMessageIds(nextFavoriteMessages);
      toast({
        title: isNowFavorite ? "Comentário favoritado" : "Favorito removido",
        description: isNowFavorite
          ? "Esse comentário foi salvo para você nesta sala."
          : "Esse comentário deixou de estar nos seus favoritos desta sala.",
      });
    })();
  };

  const sidePanel = (
    <div className="space-y-4">
      {(isInsightsLoading || insights) && (
        <Card className="border-border/80 bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <CardContent className="space-y-3 p-4">
            {isInsightsLoading ? (
              <div className="text-sm text-muted-foreground">Carregando dados da partida...</div>
            ) : insights ? (
              <>
                {insights.events.length > 0 && (
                  <details open className="border-b border-border/60 pb-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      Eventos da partida
                    </summary>
                    <div className="mt-3 space-y-2">
                      {insights.events.map((event, index) => (
                        <div key={`${event.minute}-${event.type}-${index}`} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 text-sm">
                          <span className="text-muted-foreground">{event.minute || "—"}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {event.type}{event.player ? ` · ${event.player}` : ""}
                            </p>
                            <p className="text-muted-foreground">
                              {event.team ? `${event.team} · ` : ""}{event.detail}
                              {event.assist ? ` · Assistência: ${event.assist}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {insights.lineups.length > 0 && (
                  <details className="border-b border-border/60 pb-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      Lineups
                    </summary>
                    <div className="mt-3 space-y-3">
                      {insights.lineups.map((lineup) => (
                        <div key={lineup.team} className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lineup.team} · {lineup.formation}
                            </p>
                            <p className="text-xs text-muted-foreground">Técnico: {lineup.coach}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground/80">Titulares:</span> {lineup.starters.join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground/80">Banco:</span> {lineup.substitutes.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {insights.teamStats.length > 0 && (
                  <details className="border-b border-border/60 pb-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      Estatísticas por time
                    </summary>
                    <div className="mt-3 space-y-3">
                      {insights.teamStats.map((teamStats) => (
                        <div key={teamStats.team}>
                          <p className="mb-2 text-sm font-medium text-foreground">{teamStats.team}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {teamStats.stats.map((stat) => (
                              <div key={`${teamStats.team}-${stat.label}`} className="border border-border/60 px-2 py-2">
                                <p className="text-muted-foreground">{stat.label}</p>
                                <p className="mt-1 font-medium text-foreground">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {insights.playerStats.length > 0 && (
                  <details className="border-b border-border/60 pb-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      Destaques individuais
                    </summary>
                    <div className="mt-3 space-y-2">
                      {insights.playerStats.map((player) => (
                        <div key={`${player.team}-${player.player}`} className="border border-border/60 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{player.player}</p>
                            {player.rating && <span className="text-xs text-muted-foreground">Nota {player.rating}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{player.team} · {player.summary}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {(insights.prediction || insights.odds.length > 0) && (
                  <details className="border-b border-border/60 pb-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      Odds e prediction
                    </summary>
                    <div className="mt-3 space-y-3">
                      {insights.prediction && (
                        <div className="border border-border/60 px-3 py-3">
                          <p className="text-sm font-medium text-foreground">{insights.prediction.advice || "Leitura da API"}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {insights.prediction.homePercent && <span>Casa {insights.prediction.homePercent}</span>}
                            {insights.prediction.drawPercent && <span>Empate {insights.prediction.drawPercent}</span>}
                            {insights.prediction.awayPercent && <span>Fora {insights.prediction.awayPercent}</span>}
                          </div>
                        </div>
                      )}
                      {insights.odds.map((odd) => (
                        <div key={odd.bookmaker} className="border border-border/60 px-3 py-2 text-xs">
                          <p className="font-medium text-foreground">{odd.bookmaker}</p>
                          <p className="mt-1 text-muted-foreground">
                            Casa {odd.home || "—"} · Empate {odd.draw || "—"} · Fora {odd.away || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {insights.headToHead.length > 0 && (
                  <details className="pb-1">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      Histórico head-to-head
                    </summary>
                    <div className="mt-3 space-y-2">
                      {insights.headToHead.map((fixture, index) => (
                        <div key={`${fixture.date}-${fixture.homeTeam}-${index}`} className="border border-border/60 px-3 py-2 text-xs">
                          <p className="font-medium text-foreground">
                            {fixture.homeTeam} {fixture.score} {fixture.awayTeam}
                          </p>
                          <p className="text-muted-foreground">{fixture.league} · {fixture.date}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Dados avançados disponíveis nas partidas oficiais de futebol com cobertura detalhada.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const mobileMenuPanel = (
    <div className="space-y-2">
      {isInsightsLoading ? (
        <div className="border border-border/80 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
          Carregando dados da partida...
        </div>
      ) : insights ? (
        <>
          {insights.events.length > 0 && (
            <details className="border border-border/80 bg-card/70 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                Eventos da partida
              </summary>
              <div className="mt-3 space-y-2">
                {insights.events.map((event, index) => (
                  <div key={`${event.minute}-${event.type}-${index}`} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 text-sm">
                    <span className="text-muted-foreground">{event.minute || "—"}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {event.type}{event.player ? ` · ${event.player}` : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {event.team ? `${event.team} · ` : ""}{event.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {insights.lineups.length > 0 && (
            <details className="border border-border/80 bg-card/70 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                Lineups
              </summary>
              <div className="mt-3 space-y-3">
                {insights.lineups.map((lineup) => (
                  <div key={lineup.team} className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {lineup.team} · {lineup.formation}
                      </p>
                      <p className="text-xs text-muted-foreground">Técnico: {lineup.coach}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground/80">Titulares:</span> {lineup.starters.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground/80">Banco:</span> {lineup.substitutes.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {insights.teamStats.length > 0 && (
            <details className="border border-border/80 bg-card/70 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                Estatísticas por time
              </summary>
              <div className="mt-3 space-y-3">
                {insights.teamStats.map((teamStats) => (
                  <div key={teamStats.team}>
                    <p className="mb-2 text-sm font-medium text-foreground">{teamStats.team}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {teamStats.stats.map((stat) => (
                        <div key={`${teamStats.team}-${stat.label}`} className="border border-border/60 px-2 py-2">
                          <p className="text-muted-foreground">{stat.label}</p>
                          <p className="mt-1 font-medium text-foreground">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {insights.playerStats.length > 0 && (
            <details className="border border-border/80 bg-card/70 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                Destaques individuais
              </summary>
              <div className="mt-3 space-y-2">
                {insights.playerStats.map((player) => (
                  <div key={`${player.team}-${player.player}`} className="border border-border/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{player.player}</p>
                      {player.rating && <span className="text-xs text-muted-foreground">Nota {player.rating}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{player.team} · {player.summary}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {(insights.prediction || insights.odds.length > 0) && (
            <details className="border border-border/80 bg-card/70 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                Odds e prediction
              </summary>
              <div className="mt-3 space-y-3">
                {insights.prediction && (
                  <div className="border border-border/60 px-3 py-3">
                    <p className="text-sm font-medium text-foreground">{insights.prediction.advice || "Leitura da API"}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {insights.prediction.homePercent && <span>Casa {insights.prediction.homePercent}</span>}
                      {insights.prediction.drawPercent && <span>Empate {insights.prediction.drawPercent}</span>}
                      {insights.prediction.awayPercent && <span>Fora {insights.prediction.awayPercent}</span>}
                    </div>
                  </div>
                )}
                {insights.odds.map((odd) => (
                  <div key={odd.bookmaker} className="border border-border/60 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{odd.bookmaker}</p>
                    <p className="mt-1 text-muted-foreground">
                      Casa {odd.home || "—"} · Empate {odd.draw || "—"} · Fora {odd.away || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {insights.headToHead.length > 0 && (
            <details className="border border-border/80 bg-card/70 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                Histórico head-to-head
              </summary>
              <div className="mt-3 space-y-2">
                {insights.headToHead.map((fixture, index) => (
                  <div key={`${fixture.date}-${fixture.homeTeam}-${index}`} className="border border-border/60 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">
                      {fixture.homeTeam} {fixture.score} {fixture.awayTeam}
                    </p>
                    <p className="text-muted-foreground">{fixture.league} · {fixture.date}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header roomMode onRoomMenuClick={() => setShowMobilePanel((current) => !current)} />

      {effectiveRoomOpen && (
        <TeamOnboarding
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
          homeTeam={activeGame.homeTeam}
          awayTeam={activeGame.awayTeam}
          homeTeamLogo={activeGame.homeTeamLogo}
          awayTeamLogo={activeGame.awayTeamLogo}
        />
      )}

      {!effectiveRoomOpen && currentStatus !== "live" ? (
        <div className="container mx-auto max-w-4xl px-6 py-24">
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardContent className="space-y-6 p-8 md:p-10">
              <div className="space-y-2">
                <Badge variant="outline" className="border-border bg-muted/45 text-muted-foreground">
                  {statusLabel}
                </Badge>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                  {currentStatus === "scheduled"
                    ? "A sala abre no horário da partida."
                    : "A sala ao vivo já foi encerrada."}
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                  {currentStatus === "scheduled"
                    ? "Antes do jogo, a ação principal é reservar sua sala. Quando a partida começar, a entrada é liberada."
                    : "Você ainda pode revisar a reserva e abrir os highlights da partida."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/booking/${activeGame.id}`)}>
                  {currentStatus === "scheduled" ? "Reservar sala" : "Ver partida"}
                </Button>
                {currentStatus === "ended" && hasPostGameSummary && (
                  <Button variant="outline" onClick={() => navigate(`/resumo/${activeGame.id}`)}>
                    Ver highlights
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
      <>
      <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-4 pb-52">
        {showMobilePanel && (
          <div className="mb-4 lg:hidden">
            <div className="rounded-2xl border border-border/80 bg-card/70 p-3 shadow-[var(--shadow-card)] backdrop-blur-sm">
              {mobileMenuPanel}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground" aria-hidden="true">
                  <Filter className="h-4 w-4" />
                </span>
                {[
                  {
                    value: "home" as const,
                    label: activeGame.homeTeam,
                    logo: activeGame.homeTeamLogo,
                  },
                  {
                    value: "neutral" as const,
                    label: "Neutro",
                    logo: null,
                  },
                  {
                    value: "away" as const,
                    label: activeGame.awayTeam,
                    logo: activeGame.awayTeamLogo,
                  },
                ].map((option) => {
                  const isActive = activeTeamFilters.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleTeamFilter(option.value)}
                      className="inline-flex h-9 w-9 items-center justify-center"
                      aria-pressed={isActive}
                      aria-label={`Filtrar por ${option.label}`}
                      title={option.label}
                    >
                      {option.logo ? (
                        <img
                          src={option.logo}
                          alt={option.label}
                          className={`h-6 w-6 rounded-full object-cover transition-all ${
                            isActive ? "opacity-100" : "opacity-30 grayscale"
                          }`}
                        />
                      ) : (
                        <span
                          className={`inline-block h-6 w-6 rounded-full transition-all ${
                            isActive ? "bg-slate-500" : "bg-slate-400/35"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={feedWrapperRef}
              className="overflow-hidden rounded-[24px] border border-border/70 bg-card/80 shadow-[var(--shadow-card)]"
              style={{ WebkitOverflowScrolling: "touch" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex items-center justify-center overflow-hidden text-xs font-medium text-muted-foreground transition-[max-height,opacity,padding] duration-200"
                style={{
                  maxHeight: pullDistance > 0 || isRefreshing ? 64 : 0,
                  opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
                  paddingTop: pullDistance > 0 || isRefreshing ? 12 : 0,
                  paddingBottom: pullDistance > 0 || isRefreshing ? 12 : 0,
                }}
              >
                {isRefreshing
                  ? "Atualizando conversa..."
                  : pullDistance >= 72
                    ? "Solte para atualizar"
                    : "Puxe para atualizar"}
              </div>
              {isMessagesLoading ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Carregando conversa...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {messages.length > 0
                    ? "Nenhum comentário visível com os filtros atuais."
                    : "Ainda nao ha mensagens nesta partida. Puxe a primeira leitura da sala."}
                </div>
              ) : filteredMessages.map((msg, index) => {
                const teamIdentity = getTeamIdentity(msg.teamSide);
                const isMuted = mutedUserIds.includes(msg.userId);
                const isFavoriteMessage = favoriteMessageIds.includes(msg.id);

                return (
                  <div
                    key={msg.id}
                    className={`animate-fade-in px-4 py-4 md:px-5 transition-colors ${
                      index !== filteredMessages.length - 1 ? "border-b border-border/60" : ""
                    } bg-transparent`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={msg.userAvatarUrl || undefined} alt={msg.userName} />
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(msg.userName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="text-xs font-medium text-foreground/75">
                                  {msg.userName}
                                </span>
                                {teamIdentity.logo ? (
                                  <img
                                    src={teamIdentity.logo}
                                    alt={teamIdentity.label}
                                    className="h-4 w-4 rounded-full object-contain ring-1 ring-border/80"
                                  />
                                ) : (
                                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                                )}
                              </div>
                              <span className="text-[11px] text-foreground/45">{formatMessageTime(msg.createdAt)}</span>
                            </div>

                            <p className="text-[15px] leading-7 text-foreground/90 md:text-base">{msg.text}</p>
                          </div>

                          <div className="flex shrink-0 items-center self-start">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => handleToggleFavoriteMessage(msg.id)}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  isFavoriteMessage ? "fill-primary text-primary" : "text-muted-foreground"
                                }`}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {msg.userId !== user?.id && (
                                  <DropdownMenuItem onClick={() => handleToggleMutedUser(msg.userId, msg.userName)}>
                                    {isMuted ? (
                                      <>
                                        <Volume2 className="mr-2 h-4 w-4" />
                                        Reativar {msg.userName}
                                      </>
                                    ) : (
                                      <>
                                        <VolumeX className="mr-2 h-4 w-4" />
                                        Silenciar {msg.userName}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void refreshMessages()}
                disabled={isMessagesLoading || isRefreshing}
                className={`inline-flex items-center gap-2 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                  pendingMessageCount > 0
                    ? "rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-foreground shadow-[0_0_0_1px_rgba(34,197,94,0.08)] hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                {pendingMessageCount > 0 ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/55 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                    </span>
                    <span>
                      {pendingMessageCount === 1
                        ? "1 nova mensagem"
                        : `${pendingMessageCount} novas mensagens`}
                    </span>
                  </>
                ) : (
                  <span>Atualizar</span>
                )}
              </button>
            </div>
          </div>

          <aside className="hidden lg:block sticky top-28">{sidePanel}</aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 backdrop-blur-2xl">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4">
          {isBlocked && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-foreground">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm">Você foi pausado por 10 minutos. Volte com espírito esportivo.</p>
            </div>
          )}

          <div className="rounded-[26px] border border-border bg-card px-3 py-3 shadow-[var(--shadow-card)]">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              {(() => {
                const currentIdentity = getTeamIdentity(
                  currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral",
                );

                return (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-border bg-muted/45 text-foreground">
                      {currentIdentity.logo ? (
                        <img
                          src={currentIdentity.logo}
                          alt={currentIdentity.label}
                          className="mr-2 h-3.5 w-3.5 rounded-full object-contain"
                        />
                      ) : (
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                      )}
                      {currentIdentity.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{message.length}/180</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-end gap-2">
              <Input
                placeholder={isBlocked ? "Você está temporariamente bloqueado..." : "Escreva sua mensagem"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isBlocked && cooldown === 0) {
                    void handleSendMessage();
                  }
                }}
                maxLength={180}
                className="h-14 border-0 bg-transparent text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0"
                disabled={isBlocked || cooldown > 0}
              />

              <Button
                onClick={() => void handleSendMessage()}
                size="lg"
                className="h-11 min-w-11 rounded-2xl"
                disabled={isBlocked || cooldown > 0}
              >
                {cooldown > 0 ? <span className="font-bold">{cooldown}s</span> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {cooldown > 0 && (
              <div className="mt-2 flex justify-end px-1 text-xs text-muted-foreground">
                <span>Aguarde {cooldown}s</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Arquibancada;
