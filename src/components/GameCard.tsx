import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCheck, Heart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  league: string;
  stage: string;
  venue: string;
  status: "live" | "scheduled" | "almost-full" | "full";
  startTime?: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  isFavorite?: boolean;
  isReserved?: boolean;
  onToggleFavorite?: (matchId: string) => void;
}

export const GameCard = ({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
  stage,
  venue,
  status,
  startTime,
  homeTeamLogo,
  awayTeamLogo,
  isFavorite = false,
  isReserved = false,
  onToggleFavorite,
}: GameCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (status) {
      case "live":
        return <Badge variant="live">🟢 Sala aberta</Badge>;
      case "scheduled":
        return <Badge variant="scheduled">⚪ Agenda oficial</Badge>;
      case "almost-full":
        return <Badge variant="almost-full">🟧 Reserva aberta</Badge>;
      case "full":
        return <Badge variant="full">🟥 Lista de espera</Badge>;
    }
  };

  const getActionButton = () => {
    if (status === "live") {
      return (
        <Button 
          className="w-full bg-white text-black hover:bg-white/90 font-semibold"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Entrar na sala
        </Button>
      );
    }
    if (status === "full") {
      return (
        <Button 
          className="w-full bg-white/10 text-white hover:bg-white/20 font-semibold border border-white/20"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Ver modo espera
        </Button>
      );
    }
    return (
      <Button 
        className="w-full bg-white text-black hover:bg-white/90 font-semibold"
        onClick={() => navigate(`/booking/${id}`)}
      >
        {status === "almost-full" ? "Reservar acesso" : "Ver detalhes"}
      </Button>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)] transition-all duration-300 hover:scale-[1.02] bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-white/5 to-black/50">
        <div className="absolute inset-0 flex items-center justify-center gap-6 p-6">
          <div className="flex flex-1 justify-end">
            <img
              src={homeTeamLogo}
              alt={homeTeam}
              className="h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>
          <div className="text-lg font-bold text-white/30">VS</div>
          <div className="flex flex-1 justify-start">
            <img
              src={awayTeamLogo}
              alt={awayTeam}
              className="h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>
        </div>
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite?.(id);
          }}
          className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/40 p-2 text-white/80 transition-colors hover:text-white"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-white text-white" : ""}`} />
        </button>
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
        <div className="flex flex-wrap gap-2">
          {isFavorite && (
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              <Heart className="h-3 w-3 mr-1 fill-white" />
              Favoritado
            </Badge>
          )}
          {isReserved && (
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              <CheckCheck className="h-3 w-3 mr-1" />
              Reservado
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-white/70">
            <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-white">{stage}</p>
              {startTime && <p>{startTime}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-white/70">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{venue}</span>
          </div>
        </div>
        {getActionButton()}
      </CardContent>
    </Card>
  );
};
