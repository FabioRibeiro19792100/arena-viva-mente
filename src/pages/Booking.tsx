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
    <div className="min-h-screen bg-black">
      <Header />

      <div className="container max-w-7xl mx-auto py-32 px-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-white/60 hover:text-white"
        >
          ← Voltar para os jogos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-white/5 via-black/50 to-white/5 p-8">
                <p className="text-sm text-white/60 text-center mb-2">{game.league}</p>
                <p className="text-sm text-white/50 text-center mb-6">
                  {game.stage} • {game.venue}
                </p>

                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <img src={game.homeTeamLogo} alt={game.homeTeam} className="w-20 h-20 object-contain" />
                    <span className="font-bold text-white">{game.homeTeam}</span>
                  </div>

                  <div className="text-3xl font-bold text-white/40">VS</div>

                  <div className="flex flex-col items-center gap-3">
                    <img src={game.awayTeamLogo} alt={game.awayTeam} className="w-20 h-20 object-contain" />
                    <span className="font-bold text-white">{game.awayTeam}</span>
                  </div>
                </div>

                <p className="text-center text-lg text-white font-semibold mt-6">
                  {game.date} às {game.startTime}
                </p>
              </div>
            </Card>

            <div className="flex gap-3 p-4 bg-white/5 border border-white/10">
              <AlertCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-white mb-1">Teste da Copa 2026</p>
                <p className="text-white/60">
                  Esta tela agora usa a tabela oficial da FIFA 2026. O placar ainda está simulado
                  como pré-jogo para validar a experiência do produto.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Clock className="h-5 w-5 text-white" />
                  Reserva fecha em
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white text-center font-mono">
                  {formatTime(countdown)}
                </div>
                <p className="text-sm text-white/60 text-center mt-2">
                  Entre cedo para garantir sua vaga na arquibancada digital.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <ShieldCheck className="h-5 w-5 text-white" />
                  Modelo de acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Status do evento</span>
                  <span className="text-white font-semibold">{game.statusLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tipo de entrada</span>
                  <span className="text-white font-semibold">Reserva digital</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Validação atual</span>
                  <span className="text-white font-semibold">Sessão mock autenticada</span>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/60">
                  Ainda não exibimos números de audiência nem disponibilidade estimada. Esta etapa
                  foca na jornada de descoberta, reserva e entrada.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Partida</span>
                  <span className="text-white font-semibold">{game.stage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Sede</span>
                  <span className="text-white font-semibold">{game.venue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Data oficial FIFA</span>
                  <span className="text-white font-semibold">{game.date}</span>
                </div>

                {hasPostGameSummary && (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => navigate(`/resumo/${game.id}`)}
                  >
                    Ver highlights do jogo
                  </Button>
                )}

                <Button
                  className="w-full bg-white text-black hover:bg-white/90 font-semibold h-12"
                  disabled={isBooking || isReserved}
                  onClick={handleBooking}
                >
                  {isBooking ? "Reservando..." : isReserved ? "Reserva já confirmada" : "Reservar lugar"}
                </Button>
                {isReserved && (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
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
        <DialogContent className="bg-black border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5" />
              Reserva confirmada
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Sua vaga para {game.homeTeam} x {game.awayTeam} foi liberada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <CheckCircle2 className="h-4 w-4" />
              Você já pode entrar na arquibancada.
            </div>
            <Button onClick={handleContinueToArquibancada} className="w-full bg-white text-black hover:bg-white/90">
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
