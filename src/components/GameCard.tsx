import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentMatchStatus, getMatchAvailableSpots, getMatchStatusLabel, type MatchStatus } from "@/data/worldCup2026";
import { CalendarDays, CheckCheck, Heart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const teamNamePtBr: Record<string, string> = {
  Algeria: "Argélia",
  Argentina: "Argentina",
  Australia: "Austrália",
  Austria: "Áustria",
  Belgium: "Bélgica",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  Colombia: "Colômbia",
  Croatia: "Croácia",
  Curacao: "Curaçao",
  "Czech Republic": "República Tcheca",
  England: "Inglaterra",
  France: "França",
  Germany: "Alemanha",
  Ghana: "Gana",
  Haiti: "Haiti",
  Iran: "Irã",
  Iraq: "Iraque",
  "Ivory Coast": "Costa do Marfim",
  Japan: "Japão",
  Jordan: "Jordânia",
  Mexico: "México",
  Morocco: "Marrocos",
  Netherlands: "Holanda",
  "New Zealand": "Nova Zelândia",
  Norway: "Noruega",
  Panama: "Panamá",
  Paraguay: "Paraguai",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  Scotland: "Escócia",
  Senegal: "Senegal",
  Sweden: "Suécia",
  Switzerland: "Suíça",
  Tunisia: "Tunísia",
  Turkey: "Turquia",
  "United States": "Estados Unidos",
  Uzbekistan: "Uzbequistão",
};

const isPlaceholderTeam = (team: string) =>
  /^Winner Match /i.test(team) ||
  /^Loser Match /i.test(team) ||
  /^Group .* winners$/i.test(team) ||
  /^Group .* third place$/i.test(team);

interface GameCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  league: string;
  stage: string;
  date: string;
  venue: string;
  status: MatchStatus;
  startTime?: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  isFavorite?: boolean;
  isReserved?: boolean;
  onToggleFavorite?: (matchId: string) => void;
  onReserveMatch?: (matchId: string) => void;
}

export const GameCard = ({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
  stage,
  date,
  venue,
  status,
  startTime,
  homeTeamLogo,
  awayTeamLogo,
  isFavorite = false,
  isReserved = false,
  onToggleFavorite,
  onReserveMatch,
}: GameCardProps) => {
  const navigate = useNavigate();
  const homeTeamLabel = teamNamePtBr[homeTeam] || homeTeam;
  const awayTeamLabel = teamNamePtBr[awayTeam] || awayTeam;
  const homeTeamDefined = !isPlaceholderTeam(homeTeam);
  const awayTeamDefined = !isPlaceholderTeam(awayTeam);

  const currentStatus = getCurrentMatchStatus({ id, date, startTime: startTime || "", status });
  const statusLabel = getMatchStatusLabel({ id, date, startTime: startTime || "", status });
  const availableSpots = getMatchAvailableSpots({ id, stage, status, date, startTime: startTime || "" });

  const getStatusBadge = () => {
    if (currentStatus === "live") {
      return <Badge variant="live">🟢 {statusLabel}</Badge>;
    }
    if (currentStatus === "scheduled") {
      return <Badge variant="scheduled">⚪ {statusLabel}</Badge>;
    }
    return <Badge variant="full">⚫ {statusLabel}</Badge>;
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <div className="border-b border-border/70 bg-gradient-to-br from-primary/5 via-background to-muted/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite?.(id);
            }}
            className="rounded-full border border-border/80 bg-background/90 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isReserved ? (
              <Badge variant="secondary" className="bg-accent/12 text-foreground">
                <CheckCheck className="mr-1 h-3 w-3" />
                Reservado
              </Badge>
            ) : (
              getStatusBadge()
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Badge variant="outline" className="rounded-sm border-border/90 bg-background/60 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground shadow-sm">
            {league}
          </Badge>
        </div>

        <div className="mt-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
            <div className="flex flex-col items-center text-center">
              {homeTeamDefined ? (
                <img
                  src={homeTeamLogo}
                  alt={homeTeamLabel}
                  className="h-16 w-auto max-w-[88px] object-contain drop-shadow-sm sm:h-20 sm:max-w-[104px]"
                />
              ) : (
                <div className="flex h-16 min-w-[88px] items-center justify-center border border-dashed border-border/80 bg-muted/30 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:h-20 sm:min-w-[104px]">
                  A definir
                </div>
              )}
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {homeTeamLabel}
              </p>
            </div>

            <div className="flex h-full items-center justify-center pt-5 sm:pt-6">
              <p className="text-xl font-bold tracking-[0.14em] text-muted-foreground/70">VS</p>
            </div>

            <div className="flex flex-col items-center text-center">
              {awayTeamDefined ? (
                <img
                  src={awayTeamLogo}
                  alt={awayTeamLabel}
                  className="h-16 w-auto max-w-[88px] object-contain drop-shadow-sm sm:h-20 sm:max-w-[104px]"
                />
              ) : (
                <div className="flex h-16 min-w-[88px] items-center justify-center border border-dashed border-border/80 bg-muted/30 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:h-20 sm:min-w-[104px]">
                  A definir
                </div>
              )}
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {awayTeamLabel}
              </p>
            </div>
          </div>

        </div>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="min-h-6">
          <div className="flex flex-wrap gap-2">
            {isFavorite && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Heart className="mr-1 h-3 w-3 fill-primary" />
                Favoritado
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{stage}</p>
              {startTime && <p className="text-sm">{date} • {startTime}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2 text-sm">{venue}</span>
          </div>
        </div>

        <div className="mt-auto pt-4">
          {(() => {
            if (currentStatus === "live") {
              return (
                <Button
                  className="h-10 w-full font-semibold"
                  onClick={() => navigate(`/arquibancada/${id}`)}
                >
                  Entrar na sala
                </Button>
              );
            }
            if (currentStatus === "ended") {
              return (
                <Button
                  variant="outline"
                  className="h-10 w-full font-semibold"
                  onClick={() => navigate(`/resumo/${id}`)}
                >
                  Ver highlights
                </Button>
              );
            }

            if (isReserved) {
              return (
                <Button
                  className="h-10 w-full font-semibold"
                  disabled
                >
                  Sala reservada
                </Button>
              );
            }

            return (
              <Button
                className="h-10 w-full font-semibold"
                onClick={() => onReserveMatch?.(id)}
              >
                Reservar sala
              </Button>
            );
          })()}
        </div>
        {currentStatus === "scheduled" && (
          <p className="pt-2 text-right text-xs text-muted-foreground">
            {availableSpots} spots disponíveis
          </p>
        )}
      </CardContent>
    </Card>
  );
};
