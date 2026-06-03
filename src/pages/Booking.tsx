import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, CheckCircle2, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentMatchStatus, getMatchAvailableSpots, isSummaryAvailableForMatch, parseWorldCupMatchDate, worldCupMatchMap } from "@/data/worldCup2026";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addHistoryEntry, addReservation, getProductState, removeReservation } from "@/lib/productState";
import { getMatchById } from "@/lib/runtimeMatches";

const fallbackMatch = worldCupMatchMap["wc2026-07"];

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const game = getMatchById(id) || fallbackMatch;
  const hasPostGameSummary = isSummaryAvailableForMatch(game);
  const currentStatus = getCurrentMatchStatus(game);
  const availableSpots = getMatchAvailableSpots(game);
  const kickoff = parseWorldCupMatchDate(game);
  const [countdown, setCountdown] = useState(() => {
    if (!kickoff) return 0;
    return Math.max(0, Math.floor((kickoff.getTime() - Date.now()) / 1000));
  });
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isReserved, setIsReserved] = useState(false);

  useEffect(() => {
    if (!kickoff || currentStatus !== "scheduled") {
      setCountdown(0);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(Math.max(0, Math.floor((kickoff.getTime() - Date.now()) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStatus, kickoff]);

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
          title: "Sala reservada",
          description: "A reserva ficou salva na sua conta para você voltar no horário da partida.",
        });
      })();
    }, 1500);
  };

  const handleContinueToArquibancada = () => {
    setShowSuccessDialog(false);
    if (currentStatus === "live") {
      navigate(`/arquibancada/${game.id}`);
    }
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

      <div className="container mx-auto max-w-4xl px-6 py-24">
        <Card className="overflow-hidden border-border/80 shadow-[var(--shadow-card)]">
          <div className="bg-gradient-to-br from-primary/5 via-background to-muted/80 p-8">
            <div className="mb-6 flex justify-center">
              <span className="border border-border/80 bg-background/60 px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
                {game.league}
              </span>
            </div>

            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-3">
                <img src={game.homeTeamLogo} alt={game.homeTeam} className="h-20 w-20 object-contain" />
                <span className="font-bold text-foreground">{game.homeTeam}</span>
              </div>

              <div className="text-3xl font-bold text-muted-foreground">VS</div>

              <div className="flex flex-col items-center gap-3">
                <img src={game.awayTeamLogo} alt={game.awayTeam} className="h-20 w-20 object-contain" />
                <span className="font-bold text-foreground">{game.awayTeam}</span>
              </div>
            </div>

            <p className="mt-6 text-center text-lg font-semibold text-foreground">
              {game.date} às {game.startTime}
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {game.stage} • {game.venue}
            </p>
          </div>

          <CardContent className="space-y-4">
            {currentStatus === "scheduled" && countdown > 0 && (
              <div className="border border-border bg-muted/35 p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>A sala abre em</span>
                </div>
                <div className="font-mono text-4xl font-bold text-foreground">
                  {formatTime(countdown)}
                </div>
              </div>
            )}

            {currentStatus !== "ended" && (
              <div className="border border-border bg-muted/35 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Spots disponíveis
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">{availableSpots}</p>
              </div>
            )}

            {hasPostGameSummary && (
              <Button
                variant="outline"
                className="h-12 w-full"
                onClick={() => navigate(`/resumo/${game.id}`)}
              >
                Ver highlights do jogo
              </Button>
            )}

            {currentStatus === "live" ? (
              <Button
                className="h-12 w-full font-semibold"
                onClick={handleContinueToArquibancada}
              >
                Entrar na sala
              </Button>
            ) : currentStatus === "ended" ? (
              <Button
                variant="outline"
                className="h-12 w-full"
                disabled
              >
                Sala encerrada
              </Button>
            ) : (
              <>
                <Button
                  className="h-12 w-full font-semibold"
                  disabled={isBooking || isReserved}
                  onClick={handleBooking}
                >
                  {isBooking ? "Reservando..." : isReserved ? "Sala reservada" : "Reservar sala"}
                </Button>
                {isReserved && (
                  <Button
                    variant="outline"
                    className="h-12 w-full"
                    onClick={handleCancelReservation}
                  >
                    Cancelar reserva
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5" />
              Sala reservada
            </DialogTitle>
            <DialogDescription>
              Sua reserva para {game.homeTeam} x {game.awayTeam} já está salva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Quando a partida abrir, você volta direto por aqui para entrar na sala.
            </div>
            <Button onClick={handleContinueToArquibancada} className="w-full">
              Ver reserva
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Booking;
