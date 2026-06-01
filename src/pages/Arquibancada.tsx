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
      description: "Esse destaque ainda é local nesta fase de teste do produto.",
      variant: "default",
    });
  };

  const getTeamBadge = (team: string) => {
    if (team === "homeTeam" || team === "home") return { text: game.homeTeam };
    if (team === "awayTeam" || team === "away") return { text: game.awayTeam };
    return { text: "Neutro" };
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
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-base font-semibold text-white">
              {game.homeTeam} x {game.awayTeam}
            </p>
            <p className="text-sm text-white/55 mt-1">{game.stage}</p>
          </div>
          <div className="space-y-2 text-sm text-white/65">
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

      <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Debug</p>
          <div className="space-y-1 text-xs text-white/65">
            <p>Modo: <span className="text-white">{mode}</span></p>
            <p>Supabase configurado: <span className="text-white">{isSupabaseConfigured ? "sim" : "nao"}</span></p>
            <p>match_id: <span className="text-white">{game.id}</span></p>
            <p>user.id: <span className="text-white break-all">{user?.id || "sem usuario"}</span></p>
            <p>session.user.id: <span className="text-white break-all">{debugSessionUserId || "sem sessao"}</span></p>
            <p>mensagens carregadas: <span className="text-white">{messages.length}</span></p>
            <p>ultimo envio: <span className="text-white">{debugLastWriteAt || "nenhum"}</span></p>
            {debugLastError && (
              <p className="text-red-300 break-words">erro: {debugLastError}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <TeamOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
      />

      <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-4 pb-52">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left lg:hidden"
            onClick={() => setShowMobilePanel((current) => !current)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {game.homeTeam} x {game.awayTeam} • {game.stage}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-white/55 transition-transform ${showMobilePanel ? "rotate-180" : ""}`}
            />
          </button>

          {showMobilePanel && <div className="px-4 pb-4 lg:hidden">{sidePanel}</div>}

          <div className="hidden lg:block px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/45">
              <Badge variant="outline" className="border-white/15 bg-transparent text-white/60">
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
                <SelectTrigger className="h-10 w-[180px] border-white/10 bg-white/[0.04] text-white">
                  <Filter className="h-4 w-4 mr-2 text-white/45" />
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

            <div className="space-y-0 rounded-[24px] border border-white/8 bg-white/[0.025] overflow-hidden">
              {isMessagesLoading ? (
                <div className="px-4 py-10 text-center text-sm text-white/55">
                  Carregando conversa...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-white/55">
                  Ainda nao ha mensagens nesta partida. Puxe a primeira leitura da sala.
                </div>
              ) : filteredMessages.map((msg, index) => {
                const teamBadge = getTeamBadge(msg.teamSide);
                const isPinned = pinnedUsers.includes(msg.userName);

                return (
                  <div
                    key={msg.id}
                    className={`animate-fade-in px-4 py-4 md:px-5 transition-colors ${
                      index !== filteredMessages.length - 1 ? "border-b border-white/6" : ""
                    } ${isPinned ? "bg-white/[0.045]" : "bg-transparent"}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={msg.userAvatarUrl || undefined} alt={msg.userName} />
                        <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
                          {getInitials(msg.userName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-white">{msg.userName}</span>
                              <span className="text-[11px] text-white/35">{formatMessageTime(msg.createdAt)}</span>
                              <Badge className="h-5 border-white/10 bg-white/[0.06] px-2 text-[10px] font-normal text-white/65">
                                {teamBadge.text}
                              </Badge>
                            </div>

                            <p className="text-[15px] md:text-base leading-7 text-white/92">{msg.text}</p>

                            <div className="mt-3 flex items-center gap-5 text-sm text-white/38">
                              <button className="flex items-center gap-2 hover:text-white transition-colors">
                                <ThumbsUp className="h-4 w-4" />
                                {msg.likes}
                              </button>
                              <button className="flex items-center gap-2 hover:text-white transition-colors">
                                <ThumbsDown className="h-4 w-4" />
                                {msg.dislikes}
                              </button>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={togglePinUser}>
                            <Pin className="h-4 w-4 text-white/28" />
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-2xl">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4">
          {isBlocked && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-white">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">Você foi pausado por 10 minutos. Volte com espírito esportivo.</p>
            </div>
          )}

          <div className="rounded-[26px] border border-white/12 bg-white/[0.05] px-3 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <Badge className="border-white/10 bg-white/[0.08] text-white/68">
                  {getTeamBadge(
                    currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral",
                  ).text}
                </Badge>
                <span className="text-xs text-white/35">{message.length}/180</span>
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
                className="h-14 border-0 bg-transparent text-white placeholder:text-white/30 shadow-none focus-visible:ring-0"
                disabled={isBlocked || cooldown > 0}
              />

              <Button
                onClick={() => void handleSendMessage()}
                size="lg"
                className="h-11 min-w-11 rounded-2xl bg-white text-black hover:bg-white/90"
                disabled={isBlocked || cooldown > 0}
              >
                {cooldown > 0 ? <span className="font-bold">{cooldown}s</span> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-xs text-white/32">
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
