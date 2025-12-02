import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { InviteFriends } from "@/components/InviteFriends";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, ThumbsUp, ThumbsDown, Send, Shield, AlertTriangle, Pin, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamOnboarding } from "@/components/TeamOnboarding";

// Mock games data
const gamesData: Record<string, {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  status: string;
  viewers: number;
  maxSeats: number;
  homeTeamLogo: string;
  awayTeamLogo: string;
}> = {
  "1": {
    homeTeam: "Palmeiras",
    awayTeam: "Grêmio",
    homeScore: 2,
    awayScore: 1,
    league: "Brasileirão Série A",
    status: "Ao vivo • 78'",
    viewers: 2984,
    maxSeats: 3000,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Gremio_logo.svg",
  },
  "2": {
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    homeScore: 89,
    awayScore: 85,
    league: "NBA",
    status: "Ao vivo • Q3 8:42",
    viewers: 1523,
    maxSeats: 2500,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg",
  },
  "3": {
    homeTeam: "Flamengo",
    awayTeam: "Botafogo",
    homeScore: 0,
    awayScore: 0,
    league: "Brasileirão Série A",
    status: "Em breve • 19:30",
    viewers: 847,
    maxSeats: 3000,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Botafogo_de_Futebol_e_Regatas_logo.svg",
  },
  "4": {
    homeTeam: "Corinthians",
    awayTeam: "São Paulo",
    homeScore: 0,
    awayScore: 0,
    league: "Brasileirão Série A",
    status: "Em breve • 21:00",
    viewers: 2156,
    maxSeats: 3000,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg",
  },
};

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
  
  // Get game data based on ID
  const game = gamesData[id || "1"] || gamesData["1"];

  // Verifica se usuário já escolheu torcida
  useEffect(() => {
    const savedTeam = localStorage.getItem(`game-${id}-team`);
    if (savedTeam) {
      setCurrentUserTeam(savedTeam as "home" | "away" | "neutral");
    } else {
      setShowOnboarding(true);
    }
  }, [id]);

  const [messages, setMessages] = useState([
    { id: 1, user: "Torcedor123", text: "VAMOS TIME! BORA VIRAR!", time: "76'", likes: 23, dislikes: 2, team: "homeTeam" },
    { id: 2, user: "TorcidaFiel", text: "Esse time tem raça demais!", time: "76'", likes: 15, dislikes: 0, team: "homeTeam" },
    { id: 3, user: "FanáticoTotal", text: "TÉCNICO GENIAL!", time: "77'", likes: 31, dislikes: 1, team: "homeTeam" },
    { id: 4, user: "Visitante1903", text: "juiz ladrão, pênalti claro não marcado", time: "77'", likes: 8, dislikes: 12, team: "awayTeam" },
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
    if (team === "awayTeam" || team === "away") return { text: game.awayTeam, color: "bg-accent/20 text-accent border-accent/30" };
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
      
      <div className="container py-8 px-4">
        {/* Match Header - Full Width */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-background to-accent/10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Teams */}
              <div className="flex items-center gap-6 md:gap-12 flex-1 justify-center">
                <div className="flex flex-col items-center gap-3">
                  <img 
                    src={game.homeTeamLogo} 
                    alt={game.homeTeam}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                  <span className="font-bold text-lg">{game.homeTeam}</span>
                </div>
                
                <div className="text-center">
                  <Badge variant="live" className="mb-3">{game.status}</Badge>
                  <div className="text-4xl md:text-5xl font-bold">
                    <span className="text-primary">{game.homeScore}</span>
                    <span className="text-muted-foreground mx-3">:</span>
                    <span className="text-accent">{game.awayScore}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{game.league}</p>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <img 
                    src={game.awayTeamLogo} 
                    alt={game.awayTeam}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                  <span className="font-bold text-lg">{game.awayTeam}</span>
                </div>
              </div>
            </div>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">{game.viewers.toLocaleString()} / {game.maxSeats.toLocaleString()} torcedores</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent animate-pulse" />
                <span className="text-sm text-accent font-medium">IA moderando</span>
              </div>
              <InviteFriends 
                gameId={id || "1"}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
              />
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Messages - Main Area */}
          <div className="lg:col-span-3">
            <Card className="h-[60vh] flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Filtros */}
                <div className="flex gap-3 p-4 border-b border-border items-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Filtrar torcida" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as torcidas</SelectItem>
                      <SelectItem value="homeTeam">{game.homeTeam}</SelectItem>
                      <SelectItem value="awayTeam">{game.awayTeam}</SelectItem>
                      <SelectItem value="neutral">Neutros</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {filteredMessages.length} mensagens
                  </span>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {filteredMessages.map((msg, index) => {
                    const teamBadge = getTeamBadge(msg.team);
                    const isPinned = pinnedUsers.includes(msg.user);
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`p-4 rounded-xl bg-card border animate-fade-in hover:border-primary/30 transition-all ${
                          isPinned ? "border-accent/50 shadow-[0_0_12px_hsl(var(--accent)/0.3)]" : "border-border"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-primary">{msg.user}</span>
                            <Badge variant="outline" className="text-xs">{msg.time}</Badge>
                            <Badge className={`text-xs border ${teamBadge.color}`}>{teamBadge.text}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => togglePinUser(msg.user)}
                          >
                            <Pin className={`h-4 w-4 ${isPinned ? "text-accent" : "text-muted-foreground"}`} />
                          </Button>
                        </div>
                        <p className="text-base mb-3">{msg.text}</p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <button className="flex items-center gap-2 hover:text-primary transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            {msg.likes}
                          </button>
                          <button className="flex items-center gap-2 hover:text-destructive transition-colors">
                            <ThumbsDown className="h-4 w-4" />
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
                  <div className="flex items-center gap-3 p-4 mx-4 mb-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                      Você foi removido desta arquibancada por 10 minutos. Volte com espírito esportivo.
                    </p>
                  </div>
                )}

                {/* Input de mensagem */}
                <div className="p-4 border-t border-border space-y-2">
                  <div className="flex gap-3">
                    <Input
                      placeholder={isBlocked ? "Você está bloqueado temporariamente..." : "Escreva seu grito de arquibancada..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isBlocked && cooldown === 0 && handleSendMessage()}
                      maxLength={180}
                      className="flex-1 h-12"
                      disabled={isBlocked || cooldown > 0}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="lg"
                      className="h-12 px-6"
                      disabled={isBlocked || cooldown > 0}
                      variant={cooldown > 0 ? "secondary" : "default"}
                    >
                      {cooldown > 0 ? (
                        <span className="font-bold">{cooldown}s</span>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>{message.length}/180</span>
                    {cooldown > 0 && (
                      <span className="text-accent font-medium">
                        Aguarde {cooldown}s
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Patrocínio */}
            <Card className="bg-gradient-to-br from-accent/20 to-primary/10 border-accent/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-semibold">🍺 Arena Brahma</p>
                <p className="text-lg font-bold text-accent">20% OFF</p>
                <p className="text-xs text-muted-foreground">até o apito final</p>
              </CardContent>
            </Card>

            {/* Sua torcida */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Sua torcida</p>
                <Badge className={`${getTeamBadge(currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral").color} border`}>
                  {getTeamBadge(currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral").text}
                </Badge>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-semibold">Estatísticas da sala</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensagens</span>
                    <span className="font-semibold">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Torcedores</span>
                    <span className="font-semibold">{game.viewers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacidade</span>
                    <span className="font-semibold">{Math.round((game.viewers / game.maxSeats) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arquibancada;