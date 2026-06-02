import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Filter,
  MapPin,
  Pin,
  RefreshCw,
  Send,
  Shield,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import { getCurrentMatchStatus, getMatchStatusLabel, isSummaryAvailableForMatch, worldCupMatchMap } from "@/data/worldCup2026";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addHistoryEntry } from "@/lib/productState";
import {
  getMatchMessages,
  getMatchPreference,
  saveMatchPreference,
  sendMatchMessage,
  type MatchMessage,
  type TeamSide,
} from "@/lib/arquibancada";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

const fallbackGame = worldCupMatchMap["wc2026-07"];

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, mode } = useMockAuth();
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUserTeam, setCurrentUserTeam] = useState<"home" | "away" | "neutral">("neutral");
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [pinnedUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingMessageCount, setPendingMessageCount] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedWrapperRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const messagesRef = useRef<MatchMessage[]>([]);
  const game = (id && worldCupMatchMap[id]) || fallbackGame;
  const currentStatus = getCurrentMatchStatus(game);
  const statusLabel = getMatchStatusLabel(game);
  const hasPostGameSummary = isSummaryAvailableForMatch(game);

  const refreshMessages = async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
    if (currentStatus !== "live") return;

    if (showLoader) {
      setIsMessagesLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const nextMessages = await getMatchMessages(game.id);
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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    void addHistoryEntry(user.id, game.id, "arquibancada");
  }, [game.id, user]);

  useEffect(() => {
    if (!user) return;
    if (currentStatus !== "live") {
      setShowOnboarding(false);
      return;
    }

    let isActive = true;

    void (async () => {
      const savedTeam = await getMatchPreference(user.id, game.id);
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
  }, [currentStatus, game.id, user]);

  useEffect(() => {
    if (currentStatus !== "live") {
      setMessages([]);
      setIsMessagesLoading(false);
      setPendingMessageCount(0);
      return;
    }

    void refreshMessages({ showLoader: true });
  }, [currentStatus, game.id]);

  useEffect(() => {
    if (currentStatus !== "live" || !isSupabaseConfigured || !supabase) {
      return;
    }

    const channel = supabase
      .channel(`match-messages-indicator-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${game.id}`,
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
  }, [currentStatus, game.id, user?.id]);

  useEffect(() => {
    if (currentStatus !== "live") {
      return;
    }

    const interval = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      if (isRefreshing || isMessagesLoading) return;

      try {
        const remoteMessages = await getMatchMessages(game.id);
        const currentMessages = messagesRef.current;
        const currentIds = new Set(currentMessages.map((item) => item.id));

        const unseenMessages = remoteMessages.filter(
          (item) => !currentIds.has(item.id) && item.userId !== user?.id,
        );

        if (unseenMessages.length > 0) {
          setPendingMessageCount(unseenMessages.length);
        }
      } catch {
        // Silent fallback: this polling only exists to light up the new-message indicator.
      }
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentStatus, game.id, isMessagesLoading, isRefreshing, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const sentMessage = await sendMatchMessage({
        matchId: game.id,
        user,
        text: trimmedMessage,
        teamSide: currentUserTeam,
      });
      setMessages((current) => mergeMessages(current, [sentMessage]));
      setMessage("");
      setCooldown(3);
      if (!isSupabaseConfigured) {
        const refreshedMessages = await getMatchMessages(game.id);
        setMessages((current) => mergeMessages(current, refreshedMessages));
      }
    } catch (error) {
      toast({
        title: "Nao foi possivel enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const wrapperTop = feedWrapperRef.current?.getBoundingClientRect().top ?? 0;
    if (wrapperTop < -8) return;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const wrapperTop = feedWrapperRef.current?.getBoundingClientRect().top ?? 0;
    if (touchStartYRef.current === null || wrapperTop < -8) return;

    const currentY = event.touches[0]?.clientY ?? 0;
    const distance = Math.max(0, currentY - touchStartYRef.current);
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
    if (!user) return;

    void (async () => {
      await saveMatchPreference(user.id, game.id, team);
      setCurrentUserTeam(team);
      setShowOnboarding(false);
      toast({
        title: "🎉 Bem-vindo!",
        description: "Você entrou na arquibancada. Aproveite o jogo!",
      });
    })();
  };

  const togglePinUser = () => {
    toast({
      title: "Comentário fixado",
      description: "Esse destaque fica salvo na sua experiência atual da sala.",
      variant: "default",
    });
  };

  const getTeamIdentity = (team: string) => {
    if (team === "homeTeam" || team === "home") {
      return { label: game.homeTeam, logo: game.homeTeamLogo, tone: "home" as const };
    }
    if (team === "awayTeam" || team === "away") {
      return { label: game.awayTeam, logo: game.awayTeamLogo, tone: "away" as const };
    }
    return { label: "Neutro", logo: null, tone: "neutral" as const };
  };

  const filteredMessages = messages.filter((msg) => {
    if (filterTeam === "all") return true;
    if (filterTeam === "homeTeam") return msg.teamSide === "home";
    if (filterTeam === "awayTeam") return msg.teamSide === "away";
    if (filterTeam === "neutral") return msg.teamSide === "neutral";
    return true;
  });

  const sidePanel = (
    <div className="space-y-4">
      <Card className="border-border/80 bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-base font-semibold text-foreground">
              {game.homeTeam} x {game.awayTeam}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{game.stage}</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{game.date} • {game.startTime}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{game.venue}</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Moderação ativa da sala</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {currentStatus === "live" && (
        <TeamOnboarding
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
        />
      )}

      {currentStatus !== "live" ? (
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
                <Button onClick={() => navigate(`/booking/${game.id}`)}>
                  {currentStatus === "scheduled" ? "Reservar sala" : "Ver partida"}
                </Button>
                {currentStatus === "ended" && hasPostGameSummary && (
                  <Button variant="outline" onClick={() => navigate(`/resumo/${game.id}`)}>
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
        <div className="mb-4 rounded-2xl border border-border/80 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left lg:hidden"
            onClick={() => setShowMobilePanel((current) => !current)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Detalhes da partida</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${showMobilePanel ? "rotate-180" : ""}`}
            />
          </button>

          {showMobilePanel && <div className="px-4 pb-4 lg:hidden">{sidePanel}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="h-10 w-[180px] border-border bg-card">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar torcida" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as torcidas</SelectItem>
                  <SelectItem value="homeTeam">{game.homeTeam}</SelectItem>
                  <SelectItem value="awayTeam">{game.awayTeam}</SelectItem>
                  <SelectItem value="neutral">Neutros</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                {pendingMessageCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void refreshMessages()}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    {pendingMessageCount === 1 ? "1 nova mensagem" : `${pendingMessageCount} novas mensagens`}
                  </button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="relative h-10"
                  onClick={() => void refreshMessages()}
                  disabled={isMessagesLoading || isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Atualizar
                  {pendingMessageCount > 0 && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            <div
              ref={feedWrapperRef}
              className="overflow-hidden rounded-[24px] border border-border/70 bg-card/80 shadow-[var(--shadow-card)]"
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
                  Ainda nao ha mensagens nesta partida. Puxe a primeira leitura da sala.
                </div>
              ) : filteredMessages.map((msg, index) => {
                const teamIdentity = getTeamIdentity(msg.teamSide);
                const isPinned = pinnedUsers.includes(msg.userName);

                return (
                  <div
                    key={msg.id}
                    className={`animate-fade-in px-4 py-4 md:px-5 transition-colors ${
                      index !== filteredMessages.length - 1 ? "border-b border-border/60" : ""
                    } ${isPinned ? "bg-primary/[0.045]" : "bg-transparent"}`}
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
                                <span className="text-[13px] font-medium text-foreground/80">
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
                              <span className="text-[11px] text-muted-foreground">{formatMessageTime(msg.createdAt)}</span>
                            </div>

                            <p className="text-[15px] leading-7 text-foreground/90 md:text-base">{msg.text}</p>
                          </div>

                          <div className="flex shrink-0 items-center self-start gap-1">
                            <button className="flex h-8 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {msg.likes}
                            </button>
                            <button className="flex h-8 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                              <ThumbsDown className="h-3.5 w-3.5" />
                              {msg.dislikes}
                            </button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={togglePinUser}>
                              <Pin className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
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
