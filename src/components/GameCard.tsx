import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCurrentMatchStatus, getMatchStatusLabel, type MatchStatus } from "@/data/worldCup2026";
import { CheckCheck, Heart, MessageSquare, Sparkles, Ticket } from "lucide-react";
import { useState } from "react";
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
  /^Group .* runners-up$/i.test(team) ||
  /^Group .* third place$/i.test(team);

interface GameCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  liveDetail?: string;
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
  hasRoom?: boolean;
  onToggleFavorite?: (matchId: string) => void;
  onReserveMatch?: (matchId: string) => void;
}

const TeamMark = ({
  src,
  alt,
  defined,
}: {
  src: string;
  alt: string;
  defined: boolean;
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (!defined) {
    return (
      <div className="flex h-16 min-w-[88px] items-center justify-center border border-dashed border-border/80 bg-muted/30 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:h-20 sm:min-w-[104px]">
        A definir
      </div>
    );
  }

  if (!src || hasImageError) {
    return (
      <div className="flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
        <div className="h-9 w-9 rounded-full border border-black/40 bg-white shadow-sm sm:h-11 sm:w-11" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-16 w-auto max-w-[88px] object-contain drop-shadow-sm sm:h-20 sm:max-w-[104px]"
      onError={() => setHasImageError(true)}
    />
  );
};

export const GameCard = ({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  liveDetail,
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
  hasRoom = false,
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
  const shouldShowScore =
    (currentStatus === "live" || currentStatus === "ended") &&
    homeScore !== undefined &&
    awayScore !== undefined;
  const statusTone =
    currentStatus === "live"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      : currentStatus === "ended"
        ? "bg-muted text-muted-foreground"
        : "bg-muted text-muted-foreground";
  const liveRoomClass =
    hasRoom && currentStatus === "live"
      ? "border-emerald-500/55 shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_0_28px_rgba(34,197,94,0.12)]"
      : "border-border/80";

  const getStatusBadge = () => {
    if (!hasRoom) {
      return null;
    }
    if (currentStatus === "live") {
      return (
        <Badge variant="live">
          🟢 Tempo de jogo
          {liveDetail ? ` • ${liveDetail}` : ""}
        </Badge>
      );
    }
    if (currentStatus === "scheduled") {
      return <Badge variant="scheduled">⚪ {statusLabel}</Badge>;
    }
    return <Badge variant="full">⚫ {statusLabel}</Badge>;
  };

  const favoriteTooltipLabel = isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos";

  const headerMeta = [league, startTime ? `${date} • ${startTime}` : date]
    .filter(Boolean)
    .join(" • ");

  const renderAction = () => {
    if (!hasRoom) {
      return null;
    }

    if (currentStatus === "live") {
      return (
        <button
          type="button"
          aria-label="Entrar"
          className="h-9 rounded-full border border-border/90 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          onClick={() => navigate(`/arquibancada/${id}`)}
        >
          Entrar
        </button>
      );
    }

    if (currentStatus === "ended") {
      return (
        <button
          type="button"
          aria-label="Ver highlights"
          className="flex h-9 w-9 items-center justify-center border border-border/90 bg-background text-foreground transition-colors hover:bg-muted"
          onClick={() => navigate(`/resumo/${id}`)}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      );
    }

    if (isReserved) {
      return (
        <div
          aria-label="Sala reservada"
          className="flex h-9 w-9 items-center justify-center border border-border/90 bg-muted text-foreground"
        >
          <CheckCheck className="h-4 w-4" />
        </div>
      );
    }

    return (
      <button
        type="button"
        aria-label="Reservar sala"
        className="flex h-9 w-9 items-center justify-center border border-border/90 bg-background text-foreground transition-colors hover:bg-muted"
        onClick={() => onReserveMatch?.(id)}
      >
        <Ticket className="h-4 w-4" />
      </button>
    );
  };

  return (
    <Card className={`flex h-full flex-col overflow-hidden bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${liveRoomClass}`}>
      <TooltipProvider delayDuration={120}>
      <div className="flex h-full flex-col p-5">
        <div className="flex min-h-10 items-start justify-between gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite?.(id);
                }}
                className="rounded-full border border-border/80 bg-background/90 p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={favoriteTooltipLabel}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{favoriteTooltipLabel}</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex min-h-8 items-start justify-end">
            {hasRoom && isReserved ? (
              <Badge variant="secondary" className="bg-accent/12 text-foreground">
                <CheckCheck className="mr-1 h-3 w-3" />
                Reservado
              </Badge>
            ) : (
              getStatusBadge()
            )}
          </div>
        </div>

        <div className="mt-4 text-left">
          <p className="text-[0.95rem] font-medium text-muted-foreground">{headerMeta}</p>
        </div>

        <div className="mt-6 min-h-[152px]">
          <div className="grid grid-cols-2 items-start gap-6">
            <div className="flex flex-col items-center text-center">
              <TeamMark src={homeTeamLogo} alt={homeTeamLabel} defined={homeTeamDefined} />
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {homeTeamLabel}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <TeamMark src={awayTeamLogo} alt={awayTeamLabel} defined={awayTeamDefined} />
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {awayTeamLabel}
              </p>
            </div>
          </div>
          <div className="mt-4 flex min-h-5 items-center justify-center">
            <p
              className={`text-sm font-semibold tracking-[0.12em] ${
                shouldShowScore ? "text-muted-foreground" : "invisible"
              }`}
            >
              {shouldShowScore ? (
                <>
                  {homeScore} - {awayScore}
                </>
              ) : (
                "0 - 0"
              )}
            </p>
          </div>
          <div className="mt-5 flex min-h-6 items-center justify-center">
            {currentStatus === "live" && liveDetail ? (
              <span className={`px-2 py-0.5 text-xs font-medium ${statusTone}`}>{liveDetail}</span>
            ) : (
              <span className="invisible px-2 py-0.5 text-xs font-medium">00'</span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-end gap-2 pt-4">
          {hasRoom && (
            <Tooltip>
              <TooltipTrigger asChild>{renderAction()}</TooltipTrigger>
              <TooltipContent>
                <p>
                  {currentStatus === "live"
                    ? "Entrar na sala"
                    : currentStatus === "ended"
                      ? "Ver highlights"
                      : isReserved
                        ? "Sala reservada"
                        : "Reservar sala"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      </TooltipProvider>
    </Card>
  );
};
