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
  neutralFansPercentage: number;
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
  neutralFansPercentage,
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
          className="w-full bg-white text-black hover:bg-white/90 font-semibold"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Join Now
        </Button>
      );
    }
    if (status === "full") {
      return (
        <Button 
          className="w-full bg-white/10 text-white hover:bg-white/20 font-semibold border border-white/20"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Watch Only
        </Button>
      );
    }
    return (
      <Button 
        className="w-full bg-white text-black hover:bg-white/90 font-semibold"
        onClick={() => navigate(`/booking/${id}`)}
      >
        {status === "almost-full" ? "Reserve Now" : "Reserve"}
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
    <Card className="overflow-hidden hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)] transition-all duration-300 hover:scale-[1.02] bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-white/5 to-black/50">
        <div className="absolute inset-0 flex items-center justify-center gap-8 p-8">
          <div className="flex-1 flex justify-end">
            <img
              src={homeTeamLogo}
              alt={homeTeam}
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <div className="text-2xl font-bold text-white/40">VS</div>
          <div className="flex-1 flex justify-start">
            <img
              src={awayTeamLogo}
              alt={awayTeam}
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
        </div>
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4">
          <p className="text-xs text-white/60 mb-1">{league}</p>
          <h3 className="text-lg font-bold text-white">
            {homeTeam} {homeScore !== undefined && <span className="text-white">{homeScore}</span>}
            <span className="text-white/40 mx-2">x</span>
            {awayScore !== undefined && <span className="text-white">{awayScore}</span>} {awayTeam}
          </h3>
        </div>
      </div>
      <CardContent className="p-6 space-y-4 bg-black/30">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span className="text-white">{homeFansPercentage}%</span>
            <span className="text-white/60">{neutralFansPercentage}% neutros</span>
            <span className="text-white">{awayFansPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 overflow-hidden flex">
            <div 
              className="bg-white h-full transition-all duration-500 ease-out"
              style={{ width: `${homeFansPercentage}%` }}
            />
            <div 
              className="bg-white/30 h-full transition-all duration-500 ease-out"
              style={{ width: `${neutralFansPercentage}%` }}
            />
            <div 
              className="bg-white/60 h-full transition-all duration-500 ease-out"
              style={{ width: `${awayFansPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <Users className="h-4 w-4" />
            <span>{getSeatsMessage()}</span>
          </div>
          {startTime && status === "scheduled" && (
            <span className="text-white font-semibold">{startTime}</span>
          )}
        </div>
        {getActionButton()}
      </CardContent>
    </Card>
  );
};
