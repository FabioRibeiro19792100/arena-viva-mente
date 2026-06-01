import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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
  Send,
  Shield,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import { worldCupMatchMap } from "@/data/worldCup2026";
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
  const [debugSessionUserId, setDebugSessionUserId] = useState<string | null>(null);
  const [debugLastError, setDebugLastError] = useState<string | null>(null);
  const [debugLastWriteAt, setDebugLastWriteAt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const game = (id && worldCupMatchMap[id]) || fallbackGame;

  useEffect(() => {
    if (!user) return;
    void addHistoryEntry(user.id, game.id, "arquibancada");
  }, [game.id, user]);

  useEffect(() => {
    if (!user) return;

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
  }, [game.id, user]);

  useEffect(() => {
    let isActive = true;

    setIsMessagesLoading(true);

    const refreshMessages = async (showLoader = false) => {
      if (showLoader && isActive) {
        setIsMessagesLoading(true);
      }
      const nextMessages = await getMatchMessages(game.id);
      if (!isActive) return;
      setMessages((current) => mergeMessages(current, nextMessages));
      setIsMessagesLoading(false);
      setDebugLastError(null);
    };

    void refreshMessages(true);

    if (!isSupabaseConfigured || !supabase) {
      const fallbackInterval = window.setInterval(() => {
        void refreshMessages();
      }, 4000);

      return () => {
        isActive = false;
        window.clearInterval(fallbackInterval);
      };
    }

    const channel = supabase
      .channel(`match-messages-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${game.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            user_name: string;
            user_avatar_url: string | null;
            text: string;
            team_side: TeamSide;
            likes_count: number;
            dislikes_count: number;
            created_at: string;
          };

          setMessages((current) => {
            if (current.some((message) => message.id === row.id)) {
              return current;
            }

            return [
              ...current,
              {
                id: row.id,
                userId: row.user_id,
                userName: row.user_name,
                userAvatarUrl: row.user_avatar_url,
                text: row.text,
                teamSide: row.team_side,
                likes: row.likes_count,
                dislikes: row.dislikes_count,
                createdAt: row.created_at,
              },
            ].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
          });
        },
      )
      .subscribe();

    const fallbackInterval = window.setInterval(() => {
      void refreshMessages();
    }, 4000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      isActive = false;
      window.clearInterval(fallbackInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      void supabase.removeChannel(channel);
    };
  }, [game.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setDebugSessionUserId(null);
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setDebugLastError(error.message);
        return;
      }

      setDebugSessionUserId(data.session?.user?.id || null);
    });
  }, [user?.id]);

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
      setDebugLastError(null);
      setDebugLastWriteAt(new Date().toISOString());
      setMessages((current) => mergeMessages(current, [sentMessage]));
      setMessage("");
      setCooldown(3);
      if (!isSupabaseConfigured) {
        const refreshedMessages = await getMatchMessages(game.id);
        setMessages((current) => mergeMessages(current, refreshedMessages));
      }
    } catch (error) {
      setDebugLastError(error instanceof Error ? error.message : "Erro desconhecido ao enviar mensagem");
      toast({
        title: "Nao foi possivel enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
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

      <Card className="border-border/80 bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Debug</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Modo: <span className="text-foreground">{mode}</span></p>
            <p>Supabase configurado: <span className="text-foreground">{isSupabaseConfigured ? "sim" : "nao"}</span></p>
            <p>match_id: <span className="text-foreground">{game.id}</span></p>
            <p>user.id: <span className="break-all text-foreground">{user?.id || "sem usuario"}</span></p>
            <p>session.user.id: <span className="break-all text-foreground">{debugSessionUserId || "sem sessao"}</span></p>
            <p>mensagens carregadas: <span className="text-foreground">{messages.length}</span></p>
            <p>ultimo envio: <span className="text-foreground">{debugLastWriteAt || "nenhum"}</span></p>
            {debugLastError && (
              <p className="break-words text-destructive">erro: {debugLastError}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <TeamOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
      />

      <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-4 pb-52">
        <div className="mb-4 rounded-2xl border border-border/80 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left lg:hidden"
            onClick={() => setShowMobilePanel((current) => !current)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {game.homeTeam} x {game.awayTeam} • {game.stage}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${showMobilePanel ? "rotate-180" : ""}`}
            />
          </button>

          {showMobilePanel && <div className="px-4 pb-4 lg:hidden">{sidePanel}</div>}

          <div className="hidden lg:block px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-border bg-background/70 text-muted-foreground">
                {game.statusLabel}
              </Badge>
              <span>{game.homeTeam} x {game.awayTeam}</span>
            </div>
          </div>
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
            </div>

            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card/80 shadow-[var(--shadow-card)]">
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
                                <span className="text-sm font-semibold text-foreground">{msg.userName}</span>
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

                            <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
                              <button className="flex items-center gap-2 transition-colors hover:text-foreground">
                                <ThumbsUp className="h-4 w-4" />
                                {msg.likes}
                              </button>
                              <button className="flex items-center gap-2 transition-colors hover:text-foreground">
                                <ThumbsDown className="h-4 w-4" />
                                {msg.dislikes}
                              </button>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={togglePinUser}>
                            <Pin className="h-4 w-4 text-muted-foreground" />
                          </Button>
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border bg-muted/45 text-foreground">
                  {getTeamIdentity(
                    currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral",
                  ).label}
                </Badge>
                <span className="text-xs text-muted-foreground">{message.length}/180</span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Input
                placeholder={isBlocked ? "Você está temporariamente bloqueado..." : "Mande sua leitura do jogo, reação do momento ou puxe a torcida..."}
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

            <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>Mensagens respeitosas aparecem para toda a sala.</span>
              {cooldown > 0 && <span>Aguarde {cooldown}s</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arquibancada;
