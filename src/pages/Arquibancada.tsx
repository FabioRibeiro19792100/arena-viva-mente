import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { InviteFriends } from "@/components/InviteFriends";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, ThumbsUp, ThumbsDown, Send, Shield, AlertTriangle, Pin, Filter, Crown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import matchLive from "@/assets/match-live.jpg";

const Arquibancada = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [pinnedUsers, setPinnedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Onboarding e seleção de torcida
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUserTeam, setCurrentUserTeam] = useState<"home" | "away" | "neutral">("neutral");
  
  // Verifica se usuário já escolheu torcida
  useEffect(() => {
    const savedTeam = localStorage.getItem(`game-${id}-team`);
    if (savedTeam) {
      setCurrentUserTeam(savedTeam as "home" | "away" | "neutral");
    } else {
      setShowOnboarding(true);
    }
  }, [id]);

  // Mock data
  const game = {
    homeTeam: "Palmeiras",
    awayTeam: "Grêmio",
    homeScore: 2,
    awayScore: 1,
    league: "Brasileirão Série A",
    status: "Ao vivo • 78'",
    viewers: 2984,
    maxSeats: 3000,
    image: matchLive,
  };

  const [messages, setMessages] = useState([
    { id: 1, user: "Verdão123", text: "GOOOL DO VERDÃO! NUNCA CRITIQUEI!", time: "76'", likes: 23, dislikes: 2, team: "homeTeam" },
    { id: 2, user: "TorcidaFiel", text: "Esse time tem raça demais!", time: "76'", likes: 15, dislikes: 0, team: "homeTeam" },
    { id: 3, user: "PalmeirasSempre", text: "ABEL FERREIRA GENIAL", time: "77'", likes: 31, dislikes: 1, team: "homeTeam" },
    { id: 4, user: "Gremista1903", text: "juiz ladrão, pênalti claro não marcado", time: "77'", likes: 8, dislikes: 12, team: "awayTeam" },
    { id: 5, user: "NeutralViewer", text: "Que jogaço! Vale cada segundo", time: "78'", likes: 19, dislikes: 0, team: "neutral" },
  ]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Simula moderação por IA
  const moderateMessage = (text: string) => {
    const bannedWords = ["idiota", "lixo", "merda", "burro"];
    const hasBannedWord = bannedWords.some(word => text.toLowerCase().includes(word));
    
    if (hasBannedWord) {
      return { blocked: true, severity: "high" };
    }
    
    // Simula detecção de flood (muitas maiúsculas)
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperCaseRatio > 0.7 && text.length > 20) {
      return { blocked: true, severity: "low" };
    }
    
    return { blocked: false, severity: "none" };
  };

  const handleSendMessage = () => {
    if (cooldown > 0) {
      toast({
        title: "⏱️ Calma, torcida!",
        description: `Aguarde ${cooldown}s antes de enviar outra mensagem.`,
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) return;
    
    if (message.length > 180) {
      toast({
        title: "✂️ Mensagem muito longa",
        description: "Máximo de 180 caracteres permitido.",
        variant: "destructive",
      });
      return;
    }

    // Moderação por IA
    const moderation = moderateMessage(message);
    
    if (moderation.blocked) {
      if (moderation.severity === "high") {
        setIsBlocked(true);
        toast({
          title: "🚫 Mensagem bloqueada",
          description: "Linguagem ofensiva detectada. Você foi temporariamente bloqueado por 10 minutos.",
          variant: "destructive",
        });
        setTimeout(() => setIsBlocked(false), 600000); // 10 minutos
      } else {
        toast({
          title: "⚠️ Ei, pegue leve!",
          description: "Sua mensagem foi moderada. Mantenha um clima respeitoso.",
          variant: "destructive",
        });
      }
      return;
    }

    // Envia mensagem
    const newMessage = {
      id: messages.length + 1,
      user: "VocêAgora",
      text: message,
      time: "Agora",
      likes: 0,
      dislikes: 0,
      team: currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral",
    };
    setMessages([...messages, newMessage]);
    setMessage("");
    setCooldown(3); // 3 segundos de cooldown
  };

  const handleOnboardingComplete = (team: "home" | "away" | "neutral") => {
    setCurrentUserTeam(team);
    localStorage.setItem(`game-${id}-team`, team);
    setShowOnboarding(false);
    toast({
      title: "🎉 Bem-vindo!",
      description: "Você entrou na arquibancada. Aproveite o jogo!",
    });
  };

  const togglePinUser = (username: string) => {
    toast({
      title: "🔒 Recurso PRO",
      description: "Fixar comentários de usuários é exclusivo para assinantes PRO.",
      variant: "default",
    });
  };

  const getTeamBadge = (team: string) => {
    if (team === "homeTeam" || team === "home") return { text: game.homeTeam, color: "bg-primary/20 text-primary border-primary/30" };
    if (team === "awayTeam" || team === "away") return { text: game.awayTeam, color: "bg-secondary/20 text-secondary border-secondary/30" };
    return { text: "Neutro", color: "bg-muted text-muted-foreground border-border" };
  };

  const filteredMessages = messages.filter(msg => {
    if (filterTeam === "all") return true;
    if (filterTeam === "homeTeam") return msg.team === "homeTeam";
    if (filterTeam === "awayTeam") return msg.team === "awayTeam";
    if (filterTeam === "neutral") return msg.team === "neutral";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <TeamOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
      />
      
      <div className="container max-w-4xl py-6 px-4 flex flex-col h-[calc(100vh-4rem)]">
        {/* Cabeçalho da partida */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Badge variant="live" className="mb-2">{game.status}</Badge>
                <h1 className="text-2xl font-bold">
                  {game.homeTeam} {game.homeScore} <span className="text-muted-foreground">x</span> {game.awayScore} {game.awayTeam}
                </h1>
                <p className="text-sm text-muted-foreground">{game.league}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{game.viewers.toLocaleString()} / {game.maxSeats.toLocaleString()} torcedores</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Shield className="h-4 w-4 text-accent animate-pulse" />
              <span className="text-accent font-medium">🧠 IA moderando</span>
            </div>
            <InviteFriends 
              gameId={id || "1"}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
            />
          </div>

            {/* Patrocínio */}
            <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-accent/20 to-primary/10 text-center">
              <p className="text-xs font-semibold">🍺 Arena Brahma — 20% off até o apito final</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de mensagens */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full flex flex-col">
            {/* Filtros PRO */}
            <div className="flex gap-2 mb-3 items-center">
              <div className="flex-1 flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="h-8 text-xs">
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
              <Badge variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                PRO
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 scroll-smooth">
              {filteredMessages.map((msg, index) => {
                const teamBadge = getTeamBadge(msg.team);
                const isPinned = pinnedUsers.includes(msg.user);
                
                return (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg bg-card-hover border animate-fade-in hover:border-primary/30 transition-all ${
                      isPinned ? "border-accent/50 shadow-[0_0_12px_hsl(var(--accent)/0.3)]" : "border-border"
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-primary">{msg.user}</span>
                        <Badge variant="scheduled" className="text-xs">{msg.time}</Badge>
                        <Badge className={`text-xs ${teamBadge.color}`}>{teamBadge.text}</Badge>
                        {isPinned && (
                          <Badge className="text-xs bg-accent/20 text-accent border-accent/30">
                            <Pin className="h-3 w-3 mr-1" />
                            Fixado
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => togglePinUser(msg.user)}
                      >
                        <Pin className={`h-3 w-3 ${isPinned ? "text-accent" : "text-muted-foreground"}`} />
                      </Button>
                    </div>
                    <p className="text-sm mb-2">{msg.text}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ThumbsUp className="h-3 w-3" />
                        {msg.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-destructive transition-colors">
                        <ThumbsDown className="h-3 w-3" />
                        {msg.dislikes}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Aviso de bloqueio */}
            {isBlocked && (
              <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-xs font-medium">
                  Você foi removido desta arquibancada por 10 minutos. Volte com espírito esportivo.
                </p>
              </div>
            )}

            {/* Input de mensagem */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={isBlocked ? "Você está bloqueado temporariamente..." : "Escreva seu grito de arquibancada..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isBlocked && cooldown === 0 && handleSendMessage()}
                  maxLength={180}
                  className="flex-1"
                  disabled={isBlocked || cooldown > 0}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  disabled={isBlocked || cooldown > 0}
                  variant={cooldown > 0 ? "secondary" : "default"}
                >
                  {cooldown > 0 ? (
                    <span className="text-xs font-bold">{cooldown}</span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{message.length}/180 caracteres</span>
                {cooldown > 0 && (
                  <span className="text-accent font-medium">
                    ⏱️ Aguarde {cooldown}s para enviar outra mensagem
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Arquibancada;
