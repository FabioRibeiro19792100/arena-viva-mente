import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
    if (team === "homeTeam" || team === "home") return { text: game.homeTeam, color: "bg-white/10 text-white border-white/20" };
    if (team === "awayTeam" || team === "away") return { text: game.awayTeam, color: "bg-white/10 text-white border-white/20" };
    return { text: "Neutral", color: "bg-white/10 text-white border-white/20" };
  };

  const filteredMessages = messages.filter(msg => {
    if (filterTeam === "all") return true;
    if (filterTeam === "homeTeam") return msg.team === "homeTeam";
    if (filterTeam === "awayTeam") return msg.team === "awayTeam";
    if (filterTeam === "neutral") return msg.team === "neutral";
    return true;
  });

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <TeamOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
      />
      
      <div className="container max-w-7xl mx-auto py-12 md:py-16 px-6">
        {/* Match Header - Full Width */}
        <Card className="mb-6 md:mb-8 overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-white/5 via-black/50 to-white/5 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Teams */}
              <div className="flex items-center gap-6 md:gap-12 flex-1 justify-center">
                <div className="flex flex-col items-center gap-3">
                  <img 
                    src={game.homeTeamLogo} 
                    alt={game.homeTeam}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                  <span className="font-bold text-lg text-white">{game.homeTeam}</span>
                </div>
                
                <div className="text-center">
                  <Badge variant="live" className="mb-3">{game.status}</Badge>
                  <div className="text-4xl md:text-5xl font-bold">
                    <span className="text-white">{game.homeScore}</span>
                    <span className="text-white/40 mx-3">:</span>
                    <span className="text-white">{game.awayScore}</span>
                  </div>
                  <p className="text-sm text-white/60 mt-2">{game.league}</p>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <img 
                    src={game.awayTeamLogo} 
                    alt={game.awayTeam}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                  <span className="font-bold text-lg text-white">{game.awayTeam}</span>
                </div>
              </div>
            </div>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/60">
                <Users className="h-4 w-4" />
                <span className="text-sm">{game.viewers.toLocaleString()} / {game.maxSeats.toLocaleString()} viewers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-white animate-pulse" />
                <span className="text-sm text-white font-medium">AI Moderating</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Messages - Main Area */}
          <div className="lg:col-span-3">
            <Card className="min-h-[500px] max-h-[70vh] flex flex-col bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {/* Filtros */}
                <div className="flex gap-3 p-4 border-b border-white/10 items-center bg-black/30">
                  <Filter className="h-4 w-4 text-white/60" />
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
                  <span className="text-xs text-white/60 ml-auto">
                    {filteredMessages.length} messages
                  </span>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 min-h-0">
                  {filteredMessages.map((msg, index) => {
                    const teamBadge = getTeamBadge(msg.team);
                    const isPinned = pinnedUsers.includes(msg.user);
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`p-4 bg-white/5 border animate-fade-in hover:border-white/30 transition-all ${
                          isPinned ? "border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.3)]" : "border-white/10"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{msg.user}</span>
                            <Badge variant="outline" className="text-xs text-white/60 border-white/20">{msg.time}</Badge>
                            <Badge className={`text-xs border border-white/20 bg-white/10 text-white`}>{teamBadge.text}</Badge>
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
                        <p className="text-base mb-3 text-white">{msg.text}</p>
                        <div className="flex gap-6 text-sm text-white/60">
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
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Aviso de bloqueio */}
                {isBlocked && (
                  <div className="flex items-center gap-3 p-4 mx-4 mb-4 bg-white/10 border border-white/20 text-white">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                      You've been removed from this stadium for 10 minutes. Come back with sportsmanship.
                    </p>
                  </div>
                )}

                {/* Input de mensagem */}
                <div className="p-4 border-t border-white/10 space-y-2 bg-black/30">
                  <div className="flex gap-3">
                    <Input
                      placeholder={isBlocked ? "You're temporarily blocked..." : "Write your stadium chant..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isBlocked && cooldown === 0 && handleSendMessage()}
                      maxLength={180}
                      className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      disabled={isBlocked || cooldown > 0}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="lg"
                      className="h-12 px-6 bg-white text-black hover:bg-white/90"
                      disabled={isBlocked || cooldown > 0}
                    >
                      {cooldown > 0 ? (
                        <span className="font-bold">{cooldown}s</span>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-white/60 px-1">
                    <span>{message.length}/180</span>
                    {cooldown > 0 && (
                      <span className="text-white font-medium">
                        Wait {cooldown}s
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
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-semibold text-white/80">🍺 Arena Brahma</p>
                <p className="text-lg font-bold text-white">20% OFF</p>
                <p className="text-xs text-white/60">until final whistle</p>
              </CardContent>
            </Card>

            {/* Sua torcida */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-xs text-white/60 mb-2">Your team</p>
                <Badge className="border border-white/20 bg-white/10 text-white">
                  {getTeamBadge(currentUserTeam === "home" ? "homeTeam" : currentUserTeam === "away" ? "awayTeam" : "neutral").text}
                </Badge>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-white/60 font-semibold">Room Statistics</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Messages</span>
                    <span className="font-semibold text-white">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Viewers</span>
                    <span className="font-semibold text-white">{game.viewers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Capacity</span>
                    <span className="font-semibold text-white">{Math.round((game.viewers / game.maxSeats) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Arquibancada;