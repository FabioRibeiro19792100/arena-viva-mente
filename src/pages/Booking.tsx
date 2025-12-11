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
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6 text-white/60 hover:text-white"
        >
          ← Back to games
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Info - com logos */}
          <div className="space-y-6">
            <Card className="overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-white/5 via-black/50 to-white/5 p-8">
                <p className="text-sm text-white/60 text-center mb-6">{game.league}</p>
                
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={game.homeTeamLogo} 
                      alt={game.homeTeam}
                      className="w-20 h-20 object-contain"
                    />
                    <span className="font-bold text-white">{game.homeTeam}</span>
                  </div>
                  
                  <div className="text-3xl font-bold text-white/40">VS</div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={game.awayTeamLogo} 
                      alt={game.awayTeam}
                      className="w-20 h-20 object-contain"
                    />
                    <span className="font-bold text-white">{game.awayTeam}</span>
                  </div>
                </div>
                
                <p className="text-center text-lg text-white font-semibold mt-6">
                  {game.date} at {game.startTime}
                </p>
              </div>
            </Card>

            {/* Aviso */}
            <div className="flex gap-3 p-4 bg-white/5 border border-white/10">
              <AlertCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-white mb-1">Attention</p>
                <p className="text-white/60">
                  Above {game.maxSeats.toLocaleString()} people, new users can only join as viewers (no commenting).
                </p>
              </div>
            </div>
          </div>

          {/* Informações de booking */}
          <div className="space-y-6">
            {/* Countdown */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Clock className="h-5 w-5 text-white" />
                  Booking closes in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white text-center font-mono">
                  {formatTime(countdown)}
                </div>
                <p className="text-sm text-white/60 text-center mt-2">
                  Like in the stadium, early arrivals cheer louder.
                </p>
              </CardContent>
            </Card>

            {/* Disponibilidade */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Users className="h-5 w-5 text-white" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Occupancy</span>
                    <span className="font-semibold text-white">{occupancyPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={occupancyPercentage} className="h-3 bg-white/10" />
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 ${status.color} animate-pulse-glow`} />
                    <span className="text-sm font-medium text-white">{status.text}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{game.seatsRemaining.toLocaleString()}</p>
                      <p className="text-xs text-white/60">seats remaining</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white/60">{game.maxSeats.toLocaleString()}</p>
                      <p className="text-xs text-white/60">total capacity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de reserva */}
            <Button
              size="xl"
              className="w-full bg-white text-black hover:bg-white/90 font-semibold"
              onClick={handleBooking}
              disabled={isBooking}
            >
              {isBooking ? "Booking..." : "Reserve my seat"}
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
            <DialogTitle className="text-2xl text-center text-white">
              Seat Reserved!
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-white/60">
              Your stadium seat is guaranteed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="bg-white/5 border border-white/10">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Game</span>
                  <span className="font-semibold text-white">{game.homeTeam} x {game.awayTeam}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Time</span>
                  <span className="font-semibold text-white">{game.date} at {game.startTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Competition</span>
                  <span className="font-semibold text-white">{game.league}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-sm font-medium text-white mb-1">
                Next step: Choose your team
              </p>
              <p className="text-xs text-white/60">
                When entering, you can choose to support home, away, or be neutral
              </p>
            </div>

            <Button onClick={handleContinueToArquibancada} className="w-full bg-white text-black hover:bg-white/90" size="lg">
              Enter Stadium
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Booking;