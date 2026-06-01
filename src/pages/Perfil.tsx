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
      accessModel: "Sessão persistida",
      provider: user.provider,
      plan: user.plan === "premium" ? "Premium" : "Gratuito",
      favoriteMode: user.favoriteTeam === "Neutro" ? "Observador" : "Torcida ativa",
    },
    badges: [
      { id: 1, name: "Cadeira Cativa", icon: Trophy, description: "Participou de 20+ jogos", color: "text-yellow-500" },
      { id: 2, name: "Voz da Torcida", icon: MessageSquare, description: "500+ mensagens enviadas", color: "text-blue-500" },
      { id: 3, name: "Conta verificada", icon: Shield, description: `Login social ativo via ${user.provider}`, color: "text-green-500" },
      { id: 4, name: user.plan === "premium" ? "PRO 2026" : "Conta ativa", icon: Flame, description: user.plan === "premium" ? "Experiência premium habilitada" : "Experiência principal liberada", color: "text-orange-500" },
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-white/20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {profile.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl text-foreground">{profile.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.username}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Time favorito</span>
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
                  className="w-full"
                  onClick={() => updateUser({ favoriteTeam })}
                >
                  Salvar time favorito
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sua escolha aparece vinculada ao seu perfil nos comentários.
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Desde {profile.joinDate}</span>
              </div>
              
              <Separator className="bg-border" />
              
              <Button variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Preferências de notificação
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Sair da conta
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Minhas estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border bg-muted/45 p-4 text-center">
                    <Trophy className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="text-xl font-bold text-foreground">{profile.stats.accessModel}</p>
                    <p className="text-sm text-muted-foreground">Modelo de acesso</p>
                  </div>
                  <div className="border border-border bg-muted/45 p-4 text-center">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="text-3xl font-bold text-foreground">{profile.stats.provider}</p>
                    <p className="text-sm text-muted-foreground">Login</p>
                  </div>
                  <div className="border border-border bg-muted/45 p-4 text-center">
                    <ThumbsUp className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="text-3xl font-bold text-foreground">{profile.stats.plan}</p>
                    <p className="text-sm text-muted-foreground">Plano atual</p>
                  </div>
                  <div className="border border-border bg-muted/45 p-4 text-center">
                    <Flame className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{profile.stats.favoriteMode}</p>
                    <p className="text-sm text-muted-foreground">Modo de presença</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex gap-3 border border-border bg-muted/45 p-4 transition-all hover:scale-[1.02] hover:border-primary/30"
                    >
                      <badge.icon className="h-8 w-8 shrink-0 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Reservas e favoritos</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Reservas salvas</p>
                  {profile.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma reserva persistida ainda.</p>
                  ) : (
                    profile.reservations.map((reservation) => (
                      <div
                        key={reservation.matchId}
                        className="border border-border bg-muted/45 p-3 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="flex-1 text-left"
                            onClick={() => navigate(`/booking/${reservation.matchId}`)}
                          >
                            <p className="flex items-center gap-2 font-semibold text-foreground">
                              <CheckCheck className="h-4 w-4" />
                              {reservation.match.homeTeam} x {reservation.match.awayTeam}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {reservation.match.date} • {reservation.match.venue}
                            </p>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                  <p className="text-sm font-semibold text-foreground">Favoritos</p>
                  {profile.favoriteMatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum evento favoritado ainda.</p>
                  ) : (
                    profile.favoriteMatches.map((match) => (
                      <div
                        key={match.id}
                        className="border border-border bg-muted/45 p-3 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="flex-1 text-left"
                            onClick={() => navigate(`/booking/${match.id}`)}
                          >
                            <p className="flex items-center gap-2 font-semibold text-foreground">
                              <Heart className="h-4 w-4 fill-primary text-primary" />
                              {match.homeTeam} x {match.awayTeam}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {match.stage} • {match.date}
                            </p>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Jogos recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.recentGames.map((game) => (
                  <div 
                    key={`${game.matchId}-${game.context}`}
                    className="flex cursor-pointer items-center justify-between border border-border bg-muted/45 p-4 transition-colors hover:border-primary/30"
                    onClick={() => navigate(getHistoryPath(game.context, game.matchId))}
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {game.match.homeTeam} x {game.match.awayTeam}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {game.match.date} • {game.context}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {game.context}
                    </Badge>
                  </div>
                ))}
                {profile.recentGames.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum histórico salvo ainda.</p>
                )}
                
                  <Button 
                  variant="outline" 
                  className="mt-4 w-full"
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
