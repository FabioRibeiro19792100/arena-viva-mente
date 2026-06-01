import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, AlertCircle, CheckCircle2, PartyPopper, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isSummaryAvailableForMatch, worldCupMatchMap } from "@/data/worldCup2026";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addHistoryEntry, addReservation, getProductState, removeReservation } from "@/lib/productState";

const fallbackMatch = worldCupMatchMap["wc2026-07"];

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const game = (id && worldCupMatchMap[id]) || fallbackMatch;
  const hasPostGameSummary = isSummaryAvailableForMatch(game);

  const [countdown, setCountdown] = useState(4320);
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isReserved, setIsReserved] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      await addHistoryEntry(user.id, game.id, "booking");
      const state = await getProductState(user.id);
      setIsReserved(state.reservations.some((reservation) => reservation.matchId === game.id));
    })();
  }, [game.id, user]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBooking = async () => {
    if (!user) return;
    setIsBooking(true);

    setTimeout(() => {
      void (async () => {
        await addReservation(user.id, game.id);
        setIsReserved(true);
        setIsBooking(false);
        setShowSuccessDialog(true);
        toast({
          title: "Reserva salva",
          description: "Esse evento agora aparece no seu perfil e fica persistido na sua conta.",
        });
      })();
    }, 1500);
  };

  const handleContinueToArquibancada = () => {
    setShowSuccessDialog(false);
    navigate(`/arquibancada/${game.id}`);
  };

  const handleCancelReservation = () => {
    if (!user) return;
    void (async () => {
      await removeReservation(user.id, game.id);
      setIsReserved(false);
      toast({
        title: "Reserva cancelada",
        description: "O evento foi removido da sua área de reservas salvas.",
      });
    })();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="container max-w-7xl mx-auto py-32 px-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          ← Voltar para os jogos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/80 shadow-[var(--shadow-card)]">
              <div className="bg-gradient-to-br from-primary/5 via-background to-muted/80 p-8">
                <p className="mb-2 text-center text-sm text-muted-foreground">{game.league}</p>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  {game.stage} • {game.venue}
                </p>

                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <img src={game.homeTeamLogo} alt={game.homeTeam} className="w-20 h-20 object-contain" />
                    <span className="font-bold text-foreground">{game.homeTeam}</span>
                  </div>

                  <div className="text-3xl font-bold text-muted-foreground">VS</div>

                  <div className="flex flex-col items-center gap-3">
                    <img src={game.awayTeamLogo} alt={game.awayTeam} className="w-20 h-20 object-contain" />
                    <span className="font-bold text-foreground">{game.awayTeam}</span>
                  </div>
                </div>

                <p className="mt-6 text-center text-lg font-semibold text-foreground">
                  {game.date} às {game.startTime}
                </p>
              </div>
            </Card>

            <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="mb-1 font-semibold text-foreground">Entrada da partida</p>
                <p className="text-muted-foreground">
                  Garanta seu lugar antes do jogo e volte direto para a arquibancada quando quiser.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Reserva fecha em
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center font-mono text-4xl font-bold text-foreground">
                  {formatTime(countdown)}
                </div>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Entre cedo para garantir sua vaga na arquibancada digital.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Modelo de acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status do evento</span>
                  <span className="font-semibold text-foreground">{game.statusLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo de entrada</span>
                  <span className="font-semibold text-foreground">Reserva digital</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validação atual</span>
                  <span className="font-semibold text-foreground">Sessão autenticada</span>
                </div>
                <div className="rounded-md border border-border bg-muted/45 p-3 text-sm text-muted-foreground">
                  Você acompanha status, sede e agenda da partida em um único lugar.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-[var(--shadow-card)]">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Partida</span>
                  <span className="font-semibold text-foreground">{game.stage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sede</span>
                  <span className="font-semibold text-foreground">{game.venue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data oficial FIFA</span>
                  <span className="font-semibold text-foreground">{game.date}</span>
                </div>

                {hasPostGameSummary && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/resumo/${game.id}`)}
                  >
                    Ver highlights do jogo
                  </Button>
                )}

                <Button
                  className="h-12 w-full font-semibold"
                  disabled={isBooking || isReserved}
                  onClick={handleBooking}
                >
                  {isBooking ? "Reservando..." : isReserved ? "Reserva já confirmada" : "Reservar lugar"}
                </Button>
                {isReserved && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelReservation}
                  >
                    Cancelar reserva
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5" />
              Reserva confirmada
            </DialogTitle>
            <DialogDescription>
              Sua vaga para {game.homeTeam} x {game.awayTeam} foi liberada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Você já pode entrar na arquibancada.
            </div>
            <Button onClick={handleContinueToArquibancada} className="w-full">
              Continuar para a arquibancada
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Booking;
