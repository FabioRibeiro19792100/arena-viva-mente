import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Clock, AlertCircle, CheckCircle2, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Games database - shared data
const gamesDatabase: Record<string, {
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  date: string;
  maxSeats: number;
  seatsRemaining: number;
  homeTeamLogo: string;
  awayTeamLogo: string;
}> = {
  "1": {
    homeTeam: "Palmeiras",
    awayTeam: "Grêmio",
    league: "Brasileirão Série A",
    startTime: "16:00",
    date: "Ao vivo",
    maxSeats: 3000,
    seatsRemaining: 16,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Gremio_logo.svg",
  },
  "2": {
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    league: "NBA",
    startTime: "22:00",
    date: "Ao vivo",
    maxSeats: 2500,
    seatsRemaining: 977,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg",
  },
  "3": {
    homeTeam: "Flamengo",
    awayTeam: "Botafogo",
    league: "Brasileirão Série A",
    startTime: "19:30",
    date: "Hoje",
    maxSeats: 3000,
    seatsRemaining: 1847,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Botafogo_de_Futebol_e_Regatas_logo.svg",
  },
  "4": {
    homeTeam: "Corinthians",
    awayTeam: "São Paulo",
    league: "Brasileirão Série A",
    startTime: "21:00",
    date: "Hoje",
    maxSeats: 3000,
    seatsRemaining: 844,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg",
  },
  "5": {
    homeTeam: "Sesi",
    awayTeam: "Minas",
    league: "Superliga de Vôlei",
    startTime: "20:00",
    date: "Amanhã",
    maxSeats: 2000,
    seatsRemaining: 1456,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/pt/8/8f/Sesi-SP_Volleyball.png",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/pt/4/4a/Minas_T%C3%AAnis_Clube_Volleyball.png",
  },
  "6": {
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    league: "Champions League",
    startTime: "16:00",
    date: "Sábado",
    maxSeats: 5000,
    seatsRemaining: 3234,
    homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  },
};

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get the correct game based on URL parameter
  const game = gamesDatabase[id || "3"] || gamesDatabase["3"];

  const [countdown, setCountdown] = useState(4320); // 72 minutos em segundos
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const occupancyPercentage = ((game.maxSeats - game.seatsRemaining) / game.maxSeats) * 100;
  
  const getOccupancyStatus = () => {
    if (occupancyPercentage >= 90) return { color: "bg-status-error", text: "Quase lotada!" };
    if (occupancyPercentage >= 70) return { color: "bg-status-warning", text: "Enchendo rápido" };
    return { color: "bg-status-live", text: "Boa disponibilidade" };
  };

  const status = getOccupancyStatus();

  const handleBooking = async () => {
    setIsBooking(true);
    
    // Simula reserva
    setTimeout(() => {
      setIsBooking(false);
      setShowSuccessDialog(true);
    }, 1500);
  };

  const handleContinueToArquibancada = () => {
    setShowSuccessDialog(false);
    navigate(`/arquibancada/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-5xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← Voltar para jogos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Info - com logos */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8">
                <p className="text-sm text-muted-foreground text-center mb-6">{game.league}</p>
                
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={game.homeTeamLogo} 
                      alt={game.homeTeam}
                      className="w-20 h-20 object-contain"
                    />
                    <span className="font-bold">{game.homeTeam}</span>
                  </div>
                  
                  <div className="text-3xl font-bold text-muted-foreground">VS</div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={game.awayTeamLogo} 
                      alt={game.awayTeam}
                      className="w-20 h-20 object-contain"
                    />
                    <span className="font-bold">{game.awayTeam}</span>
                  </div>
                </div>
                
                <p className="text-center text-lg text-accent font-semibold mt-6">
                  {game.date} às {game.startTime}
                </p>
              </div>
            </Card>

            {/* Aviso */}
            <div className="flex gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-accent mb-1">Atenção</p>
                <p className="text-muted-foreground">
                  Acima de {game.maxSeats.toLocaleString()} pessoas, novos usuários entram apenas como espectadores (sem poder comentar).
                </p>
              </div>
            </div>
          </div>

          {/* Informações de booking */}
          <div className="space-y-6">
            {/* Countdown */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Booking encerra em
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary text-center font-mono">
                  {formatTime(countdown)}
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Como no estádio, quem chega cedo vibra mais alto.
                </p>
              </CardContent>
            </Card>

            {/* Disponibilidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Disponibilidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Ocupação</span>
                    <span className="font-semibold">{occupancyPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={occupancyPercentage} className="h-3" />
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse-glow`} />
                    <span className="text-sm font-medium">{status.text}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{game.seatsRemaining.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">lugares restantes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-muted-foreground">{game.maxSeats.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">capacidade total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de reserva */}
            <Button
              variant="stadium"
              size="xl"
              className="w-full"
              onClick={handleBooking}
              disabled={isBooking}
            >
              {isBooking ? "Reservando..." : "Reservar meu assento"}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle2 className="h-16 w-16 text-primary" />
                <PartyPopper className="h-8 w-8 text-accent absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">
              Assento Reservado!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Seu lugar na arquibancada está garantido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jogo</span>
                  <span className="font-semibold">{game.homeTeam} x {game.awayTeam}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Horário</span>
                  <span className="font-semibold">{game.date} às {game.startTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Competição</span>
                  <span className="font-semibold">{game.league}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Próximo passo: Escolher seu time
              </p>
              <p className="text-xs text-muted-foreground">
                Ao entrar, você poderá escolher torcer pelo time da casa, visitante ou ser neutro
              </p>
            </div>

            <Button onClick={handleContinueToArquibancada} className="w-full" size="lg">
              Entrar na Arquibancada
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Booking;