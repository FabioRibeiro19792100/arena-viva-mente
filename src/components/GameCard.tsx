import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  league: string;
  status: "live" | "scheduled" | "almost-full" | "full";
  seatsRemaining?: number;
  maxSeats: number;
  startTime?: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeFansPercentage: number;
  awayFansPercentage: number;
}

export const GameCard = ({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
  status,
  seatsRemaining,
  maxSeats,
  startTime,
  homeTeamLogo,
  awayTeamLogo,
  homeFansPercentage,
  awayFansPercentage,
}: GameCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (status) {
      case "live":
        return <Badge variant="live">🟢 Ao vivo</Badge>;
      case "scheduled":
        return <Badge variant="scheduled">⚪ Agendado</Badge>;
      case "almost-full":
        return <Badge variant="almost-full">🟧 Quase cheia</Badge>;
      case "full":
        return <Badge variant="full">🟥 Lotada</Badge>;
    }
  };

  const getActionButton = () => {
    if (status === "live") {
      return (
        <Button 
          variant="live" 
          className="w-full"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Entrar na arquibancada
        </Button>
      );
    }
    if (status === "full") {
      return (
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Entrar como espectador
        </Button>
      );
    }
    return (
      <Button 
        variant={status === "almost-full" ? "energy" : "stadium"}
        className="w-full"
        onClick={() => navigate(`/booking/${id}`)}
      >
        {status === "almost-full" ? "Reservar agora" : "Reservar assento"}
      </Button>
    );
  };

  const getSeatsMessage = () => {
    if (status === "full") {
      return "Arquibancada cheia";
    }
    if (status === "almost-full" && seatsRemaining) {
      return `Últimos ${seatsRemaining} lugares`;
    }
    if (seatsRemaining) {
      return `${seatsRemaining.toLocaleString()} lugares restantes`;
    }
    return null;
  };

  return (
    <Card className="overflow-hidden hover:shadow-[0_8px_32px_hsl(var(--card-foreground)/0.2)] transition-all duration-300 hover:scale-[1.02] bg-card border-border">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted/50 to-background">
        <div className="absolute inset-0 flex items-center justify-center gap-8 p-8">
          <div className="flex-1 flex justify-end">
            <img
              src={homeTeamLogo}
              alt={homeTeam}
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
          <div className="text-3xl font-bold text-muted-foreground">VS</div>
          <div className="flex-1 flex justify-start">
            <img
              src={awayTeamLogo}
              alt={awayTeam}
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
        </div>
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/90 to-transparent p-4">
          <p className="text-xs text-muted-foreground mb-1">{league}</p>
          <h3 className="text-lg font-bold">
            {homeTeam} {homeScore !== undefined && <span className="text-primary">{homeScore}</span>}
            <span className="text-muted-foreground mx-2">x</span>
            {awayScore !== undefined && <span className="text-primary">{awayScore}</span>} {awayTeam}
          </h3>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-primary">{homeFansPercentage}%</span>
            <span className="text-muted-foreground">Torcidas presentes</span>
            <span className="text-accent">{awayFansPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${homeFansPercentage}%` }}
            />
            <div 
              className="bg-accent h-full transition-all duration-500 ease-out"
              style={{ width: `${awayFansPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{getSeatsMessage()}</span>
          </div>
          {startTime && status === "scheduled" && (
            <span className="text-accent font-semibold">{startTime}</span>
          )}
        </div>
        {getActionButton()}
      </CardContent>
    </Card>
  );
};
