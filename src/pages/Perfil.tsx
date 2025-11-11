import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  Flame,
  Award,
  Star,
  Bell,
  Shield
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const Perfil = () => {
  const navigate = useNavigate();
  const [favoriteTeam, setFavoriteTeam] = useState("Palmeiras");

  // Mock data
  const user = {
    name: "Torcedor Apaixonado",
    username: "@verdao_fanatic",
    avatar: "/placeholder.svg",
    favoriteTeam: "Palmeiras",
    joinDate: "Novembro 2024",
    stats: {
      gamesWatched: 23,
      messagesSent: 487,
      likesReceived: 1243,
      topMood: "Eufórico 🔥",
    },
    badges: [
      { id: 1, name: "Cadeira Cativa", icon: Trophy, description: "Participou de 20+ jogos", color: "text-yellow-500" },
      { id: 2, name: "Voz da Torcida", icon: MessageSquare, description: "500+ mensagens enviadas", color: "text-blue-500" },
      { id: 3, name: "Moderação Limpa", icon: Award, description: "Nunca recebeu advertência", color: "text-green-500" },
      { id: 4, name: "Maratonista", icon: Flame, description: "Assistiu 5 jogos seguidos", color: "text-orange-500" },
    ],
    recentGames: [
      { id: "1", teams: "Palmeiras 2 x 1 Grêmio", date: "08 Jan", mood: "🔥 Euforia" },
      { id: "2", teams: "Flamengo 1 x 1 Botafogo", date: "05 Jan", mood: "😤 Tensão" },
      { id: "3", teams: "Lakers 92 x 89 Celtics", date: "03 Jan", mood: "🎯 Concentração" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar - Perfil */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.username}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Time do coração</span>
                </div>
                <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Palmeiras">🟢 Palmeiras</SelectItem>
                    <SelectItem value="Grêmio">🔵 Grêmio</SelectItem>
                    <SelectItem value="Flamengo">🔴 Flamengo</SelectItem>
                    <SelectItem value="Corinthians">⚫ Corinthians</SelectItem>
                    <SelectItem value="Neutral">⚪ Neutro (sem time)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sua escolha aparece como badge nos seus comentários
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Membro desde {user.joinDate}</span>
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Preferências de notificação
              </Button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Minhas Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{user.stats.gamesWatched}</p>
                    <p className="text-sm text-muted-foreground">Jogos assistidos</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-accent/10 border border-secondary/20">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-secondary" />
                    <p className="text-3xl font-bold">{user.stats.messagesSent}</p>
                    <p className="text-sm text-muted-foreground">Mensagens enviadas</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20">
                    <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-accent" />
                    <p className="text-3xl font-bold">{user.stats.likesReceived}</p>
                    <p className="text-sm text-muted-foreground">Curtidas recebidas</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <Flame className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{user.stats.topMood}</p>
                    <p className="text-sm text-muted-foreground">Humor predominante</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Minhas Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {user.badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex gap-3 p-4 rounded-lg bg-card-hover border border-border hover:border-primary/50 transition-all hover:scale-[1.02]"
                    >
                      <badge.icon className={`h-8 w-8 ${badge.color} shrink-0`} />
                      <div>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card>
              <CardHeader>
                <CardTitle>Jogos Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.recentGames.map((game) => (
                  <div 
                    key={game.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card-hover border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/resumo/${game.id}`)}
                  >
                    <div>
                      <p className="font-semibold">{game.teams}</p>
                      <p className="text-sm text-muted-foreground">{game.date}</p>
                    </div>
                    <Badge variant="secondary">{game.mood}</Badge>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/galeria")}
                >
                  Ver histórico completo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Perfil;
