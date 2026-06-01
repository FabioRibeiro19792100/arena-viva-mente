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
          className="w-full font-semibold"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Entrar na sala
        </Button>
      );
    }
    if (status === "full") {
      return (
        <Button
          variant="outline"
          className="w-full font-semibold"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Ver modo espera
        </Button>
      );
    }
    return (
      <Button
        className="w-full font-semibold"
        onClick={() => navigate(`/booking/${id}`)}
      >
        {status === "almost-full" ? "Reservar acesso" : "Ver detalhes"}
      </Button>
    );
  };

  return (
    <Card className="overflow-hidden border-border/80 transition-all duration-300 hover:scale-[1.01] hover:shadow-[var(--shadow-card)]">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/80">
        <div className="absolute inset-0 flex items-center justify-center gap-6 p-6">
          <div className="flex flex-1 justify-end">
            <img
              src={homeTeamLogo}
              alt={homeTeam}
              className="h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>
          <div className="text-lg font-bold text-muted-foreground/60">VS</div>
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
          className="absolute top-3 left-3 rounded-full border border-border/80 bg-background/85 p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent p-4">
          <p className="mb-1 text-xs text-muted-foreground">{league}</p>
          <h3 className="text-lg font-bold text-foreground">
            {homeTeam} {homeScore !== undefined && <span className="text-foreground">{homeScore}</span>}
            <span className="mx-2 text-muted-foreground">x</span>
            {awayScore !== undefined && <span className="text-foreground">{awayScore}</span>} {awayTeam}
          </h3>
        </div>
      </div>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          {isFavorite && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Heart className="mr-1 h-3 w-3 fill-primary" />
              Favoritado
            </Badge>
          )}
          {isReserved && (
            <Badge variant="secondary" className="bg-accent/15 text-foreground">
              <CheckCheck className="mr-1 h-3 w-3" />
              Reservado
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{stage}</p>
              {startTime && <p>{startTime}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{venue}</span>
          </div>
        </div>
        {getActionButton()}
      </CardContent>
    </Card>
  );
};
