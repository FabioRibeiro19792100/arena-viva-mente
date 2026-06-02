import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { worldCupMatchMap } from "@/data/worldCup2026";
import { getProductState, removeReservation, type ProductState } from "@/lib/productState";
import { Calendar, CheckCheck, Clock3, LogOut, MapPin, Star, X } from "lucide-react";

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

  const refreshProductState = () => {
    void (async () => {
      setProductState(await getProductState(user.id));
    })();
  };

  const getHistoryPath = (context: "booking" | "arquibancada" | "resumo", matchId: string) => {
    if (context === "booking") return `/booking/${matchId}`;
    if (context === "arquibancada") return `/arquibancada/${matchId}`;
    return `/resumo/${matchId}`;
  };

  const reservations = productState.reservations
    .map((reservation) => ({
      ...reservation,
      match: worldCupMatchMap[reservation.matchId],
    }))
    .filter((item) => item.match)
    .slice(0, 4);

  const recentGames = productState.history
    .map((item) => ({
      ...item,
      match: worldCupMatchMap[item.matchId],
    }))
    .filter((item) => item.match)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="container mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader className="space-y-4 text-center">
              <Avatar className="mx-auto h-24 w-24 ring-4 ring-white/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {user.name.split(" ").map((name) => name[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <CardTitle className="text-xl text-foreground">{user.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{user.username}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="rounded-none border-border bg-muted/45 text-foreground">
                  {user.provider === "google" ? "Google" : user.provider}
                </Badge>
                <Badge variant="outline" className="rounded-none border-border bg-muted/45 text-foreground">
                  {user.plan === "premium" ? "Premium" : "Gratuito"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Time favorito</span>
                </div>

                <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Palmeiras">🟢 Palmeiras</SelectItem>
                    <SelectItem value="Grêmio">🔵 Grêmio</SelectItem>
                    <SelectItem value="Flamengo">🔴 Flamengo</SelectItem>
                    <SelectItem value="Corinthians">⚫ Corinthians</SelectItem>
                    <SelectItem value="Neutro">⚪ Neutro</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="w-full rounded-none"
                  onClick={() => updateUser({ favoriteTeam })}
                >
                  Salvar time favorito
                </Button>

                <p className="text-xs text-muted-foreground">
                  Sua escolha aparece vinculada ao seu perfil nos comentários.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Desde {user.joinDate}</span>
              </div>

              <Separator className="bg-border" />

              <Button
                variant="outline"
                className="w-full rounded-none"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="border border-border bg-muted/35 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Login</p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {user.provider === "google" ? "Google" : user.provider}
                    </p>
                  </div>
                  <div className="border border-border bg-muted/35 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Plano</p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {user.plan === "premium" ? "Premium" : "Gratuito"}
                    </p>
                  </div>
                  <div className="border border-border bg-muted/35 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Presença</p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {favoriteTeam === "Neutro" ? "Observador" : "Torcida ativa"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Minha agenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma reserva salva ainda.</p>
                ) : (
                  reservations.map((reservation) => (
                    <div
                      key={reservation.matchId}
                      className="border border-border bg-muted/35 p-3 transition-colors hover:border-primary/30"
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
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {reservation.match.date}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {reservation.match.venue}
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
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Atividade recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentGames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sua atividade recente aparece aqui.</p>
                ) : (
                  recentGames.map((game) => (
                    <div
                      key={`${game.matchId}-${game.context}`}
                      className="flex cursor-pointer items-center justify-between border border-border bg-muted/35 p-4 transition-colors hover:border-primary/30"
                      onClick={() => navigate(getHistoryPath(game.context, game.matchId))}
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {game.match.homeTeam} x {game.match.awayTeam}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {game.match.date}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-none border-border bg-background/70 text-muted-foreground">
                        {game.context}
                      </Badge>
                    </div>
                  ))
                )}

                <Button variant="outline" className="w-full rounded-none" onClick={() => navigate("/")}>
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
