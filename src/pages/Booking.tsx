import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import matchLive from "@/assets/match-live.jpg";

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock data - seria substituído por dados reais
  const game = {
    id: "3",
    homeTeam: "Flamengo",
    awayTeam: "Botafogo",
    league: "Brasileirão Série A",
    startTime: "19:30",
    date: "Hoje",
    maxSeats: 3000,
    seatsRemaining: 1847,
    image: matchLive,
  };

  const [countdown, setCountdown] = useState(4320); // 72 minutos em segundos
  const [isBooking, setIsBooking] = useState(false);

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
      toast({
        title: "🎉 Assento reservado!",
        description: `Seu lugar na arquibancada de ${game.homeTeam} x ${game.awayTeam} está garantido.`,
      });
      
      setTimeout(() => {
        navigate(`/arquibancada/${id}`);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← Voltar para jogos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagem do jogo */}
          <div className="relative h-64 md:h-auto rounded-lg overflow-hidden">
            <img
              src={game.image}
              alt={`${game.homeTeam} vs ${game.awayTeam}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xs text-muted-foreground mb-1">{game.league}</p>
              <h1 className="text-2xl font-bold">
                {game.homeTeam} <span className="text-muted-foreground">x</span> {game.awayTeam}
              </h1>
              <p className="text-sm text-accent mt-1">
                {game.date} às {game.startTime}
              </p>
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
      <Footer />
    </div>
  );
};

export default Booking;
