import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { 
  CheckCheck,
  Heart,
  Trophy, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  Flame,
  Award,
  Star,
  Bell,
  X,
  Shield
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { worldCupMatchMap } from "@/data/worldCup2026";
import { getProductState, removeReservation, toggleFavoriteMatch, type ProductState } from "@/lib/productState";

const Perfil = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useMockAuth();
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || "Neutro");
  const [productState, setProductState] = useState<ProductState>({
    favorites: [],
    reservations: [],
    history: [],
  });

  useEffect(() => {
    setFavoriteTeam(user?.favoriteTeam || "Neutro");
  }, [user?.favoriteTeam]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setProductState(await getProductState(user.id));
    })();
  }, [user]);

  if (!user) return null;

  const getHistoryPath = (context: "booking" | "arquibancada" | "resumo", matchId: string) => {
    if (context === "booking") return `/booking/${matchId}`;
    if (context === "arquibancada") return `/arquibancada/${matchId}`;
    return `/resumo/${matchId}`;
  };

  const refreshProductState = () => {
    if (!user) return;
    void (async () => {
      setProductState(await getProductState(user.id));
    })();
  };

  const profile = {
    ...user,
    stats: {
      accessModel: "Sessão mock persistida",
      provider: user.provider,
      plan: user.plan === "premium" ? "Premium" : "Free",
      favoriteMode: user.favoriteTeam === "Neutro" ? "Observador" : "Torcida ativa",
    },
    badges: [
      { id: 1, name: "Cadeira Cativa", icon: Trophy, description: "Participou de 20+ jogos", color: "text-yellow-500" },
      { id: 2, name: "Voz da Torcida", icon: MessageSquare, description: "500+ mensagens enviadas", color: "text-blue-500" },
      { id: 3, name: "Sessão Mock Verificada", icon: Shield, description: `Login social simulado via ${user.provider}`, color: "text-green-500" },
      { id: 4, name: user.plan === "premium" ? "PRO 2026" : "Teste Produto", icon: Flame, description: user.plan === "premium" ? "Conta mock premium ativa" : "Conta mock gratuita ativa", color: "text-orange-500" },
    ],
    favoriteMatches: productState.favorites
      .map((matchId) => worldCupMatchMap[matchId])
      .filter(Boolean)
      .slice(0, 4),
    reservations: productState.reservations
      .map((reservation) => ({
        ...reservation,
        match: worldCupMatchMap[reservation.matchId],
      }))
      .filter((item) => item.match)
      .slice(0, 4),
    recentGames: productState.history
      .map((item) => ({
        ...item,
        match: worldCupMatchMap[item.matchId],
      }))
      .filter((item) => item.match)
      .slice(0, 5),
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar - Perfil */}
          <Card className="md:col-span-1 bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-white/20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-white/10 text-white">
                  {profile.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl text-white">{profile.name}</CardTitle>
              <p className="text-sm text-white/60">{profile.username}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Star className="h-4 w-4 text-white" />
                  <span>Favorite team</span>
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
                    <SelectItem value="Neutro">⚪ Neutro (sem time)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => updateUser({ favoriteTeam })}
                >
                  Salvar time favorito
                </Button>
                <p className="text-xs text-white/60">
                  Your choice appears as a badge in your comments
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-white/60" />
                <span className="text-white/60">Member since {profile.joinDate}</span>
              </div>
              
              <Separator className="bg-white/10" />
              
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Bell className="mr-2 h-4 w-4" />
                Notification preferences
              </Button>
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Sair da sessão mock
              </Button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Estatísticas */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">My Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/5 border border-white/10">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-white" />
                    <p className="text-xl font-bold text-white">{profile.stats.accessModel}</p>
                    <p className="text-sm text-white/60">Modelo de acesso</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 border border-white/10">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-white" />
                    <p className="text-3xl font-bold text-white">{profile.stats.provider}</p>
                    <p className="text-sm text-white/60">Provider</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 border border-white/10">
                    <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-white" />
                    <p className="text-3xl font-bold text-white">{profile.stats.plan}</p>
                    <p className="text-sm text-white/60">Plano atual</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 border border-white/10">
                    <Flame className="h-8 w-8 mx-auto mb-2 text-white" />
                    <p className="text-2xl font-bold text-white">{profile.stats.favoriteMode}</p>
                    <p className="text-sm text-white/60">Modo de presença</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5 text-white" />
                  My Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex gap-3 p-4 bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]"
                    >
                      <badge.icon className="h-8 w-8 text-white shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{badge.name}</p>
                        <p className="text-sm text-white/60">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Reservas e favoritos</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">Reservas salvas</p>
                  {profile.reservations.length === 0 ? (
                    <p className="text-sm text-white/60">Nenhuma reserva persistida ainda.</p>
                  ) : (
                    profile.reservations.map((reservation) => (
                      <div
                        key={reservation.matchId}
                        className="p-3 bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="flex-1 text-left"
                            onClick={() => navigate(`/booking/${reservation.matchId}`)}
                          >
                            <p className="font-semibold text-white flex items-center gap-2">
                              <CheckCheck className="h-4 w-4" />
                              {reservation.match.homeTeam} x {reservation.match.awayTeam}
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                              {reservation.match.date} • {reservation.match.venue}
                            </p>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/60 hover:text-white"
                            onClick={() => {
                              void (async () => {
                                await removeReservation(user.id, reservation.matchId);
                                refreshProductState();
                              })();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">Favoritos</p>
                  {profile.favoriteMatches.length === 0 ? (
                    <p className="text-sm text-white/60">Nenhum evento favoritado ainda.</p>
                  ) : (
                    profile.favoriteMatches.map((match) => (
                      <div
                        key={match.id}
                        className="p-3 bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="flex-1 text-left"
                            onClick={() => navigate(`/booking/${match.id}`)}
                          >
                            <p className="font-semibold text-white flex items-center gap-2">
                              <Heart className="h-4 w-4 fill-white" />
                              {match.homeTeam} x {match.awayTeam}
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                              {match.stage} • {match.date}
                            </p>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/60 hover:text-white"
                            onClick={() => {
                              void (async () => {
                                await toggleFavoriteMatch(user.id, match.id);
                                refreshProductState();
                              })();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent Games</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.recentGames.map((game) => (
                  <div 
                    key={`${game.matchId}-${game.context}`}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                    onClick={() => navigate(getHistoryPath(game.context, game.matchId))}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {game.match.homeTeam} x {game.match.awayTeam}
                      </p>
                      <p className="text-sm text-white/60">
                        {game.match.date} • {game.context}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      {game.context}
                    </Badge>
                  </div>
                ))}
                {profile.recentGames.length === 0 && (
                  <p className="text-sm text-white/60">Nenhum histórico salvo ainda.</p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => navigate("/")}
                >
                  Explorar jogos
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
