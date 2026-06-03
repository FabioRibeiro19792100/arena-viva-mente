import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCurrentMatchStatus, getMatchStatusLabel, type MatchStatus } from "@/data/worldCup2026";
import { CheckCheck, Heart, Sparkles, Ticket } from "lucide-react";

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
  date,
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
  const [openPopover, setOpenPopover] = useState<null | "favorite" | "reserve" | "highlights" | "reserved">(null);
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

  const liveRoomClass =
    hasRoom && currentStatus === "live"
      ? "border-emerald-500/55 shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_0_28px_rgba(34,197,94,0.12)]"
      : "border-border/80";

  const getStatusBadge = () => {
    if (!hasRoom) return null;
    if (currentStatus === "live") return null;
    if (currentStatus === "scheduled") return null;
    return <Badge variant="full">⚫ {statusLabel}</Badge>;
  };

  const popoverCopy = {
    favorite: {
      title: isFavorite ? "Favorito salvo" : "Favoritar jogo",
      description: isFavorite
        ? "Esse jogo já está guardado na sua área de favoritos para acesso rápido."
        : "Guarde esse jogo na sua área de favoritos para voltar rápido depois.",
      actionLabel: isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos",
      action: () => {
        onToggleFavorite?.(id);
        setOpenPopover(null);
      },
    },
    reserve: {
      title: "Reservar sala",
      description: "Reserve sua entrada agora e volte para a sala quando ela abrir.",
      actionLabel: "Confirmar reserva",
      action: () => {
        onReserveMatch?.(id);
        setOpenPopover(null);
      },
    },
    highlights: {
      title: "Ver highlights",
      description: "Abra o resumo da partida e veja os destaques depois do jogo.",
      actionLabel: "Abrir highlights",
      action: () => {
        navigate(`/resumo/${id}`);
        setOpenPopover(null);
      },
    },
    reserved: {
      title: "Sala reservada",
      description: "Sua reserva já está feita. Quando a sala abrir, você entra por aqui.",
      actionLabel: "Fechar",
      action: () => setOpenPopover(null),
    },
  } as const;

  const renderIconAction = () => {
    if (!hasRoom || currentStatus === "live") {
      return null;
    }

    const kind = currentStatus === "ended" ? "highlights" : isReserved ? "reserved" : "reserve";
    const icon =
      currentStatus === "ended" ? (
        <Sparkles className="h-4 w-4" />
      ) : isReserved ? (
        <CheckCheck className="h-4 w-4" />
      ) : (
        <Ticket className="h-4 w-4" />
      );

    return (
      <Popover open={openPopover === kind} onOpenChange={(open) => setOpenPopover(open ? kind : null)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-9 w-9 items-center justify-center border border-border/90 text-foreground ${
              isReserved ? "bg-muted" : "bg-background transition-colors hover:bg-muted"
            }`}
            aria-label={popoverCopy[kind].title}
          >
            {icon}
          </button>
        </PopoverTrigger>
        <PopoverContent side="left" align="start" className="w-72 rounded-none border-border bg-card">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{popoverCopy[kind].title}</p>
              <p className="text-sm text-muted-foreground">{popoverCopy[kind].description}</p>
            </div>
            <Button onClick={popoverCopy[kind].action} className="w-full rounded-none">
              {popoverCopy[kind].actionLabel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Card className={`flex h-full flex-col overflow-hidden bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${liveRoomClass}`}>
      <div className="flex h-full flex-col p-5">
        <div className="flex min-h-10 items-start justify-between gap-3">
          <Popover open={openPopover === "favorite"} onOpenChange={(open) => setOpenPopover(open ? "favorite" : null)}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenPopover("favorite");
                }}
                className="rounded-full border border-border/80 bg-background/90 p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={isFavorite ? "Favorito salvo" : "Favoritar jogo"}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-72 rounded-none border-border bg-card">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{popoverCopy.favorite.title}</p>
                  <p className="text-sm text-muted-foreground">{popoverCopy.favorite.description}</p>
                </div>
                <Button onClick={popoverCopy.favorite.action} className="w-full rounded-none">
                  {popoverCopy.favorite.actionLabel}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex min-h-8 items-center justify-end gap-2">
            {hasRoom && isReserved ? (
              <Badge variant="secondary" className="bg-accent/12 text-foreground">
                <CheckCheck className="mr-1 h-3 w-3" />
                Reservado
              </Badge>
            ) : (
              getStatusBadge()
            )}

            {hasRoom && currentStatus === "live" ? (
              <button
                type="button"
                aria-label="Entrar"
                className="h-9 rounded-full border border-border/90 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => navigate(`/arquibancada/${id}`)}
              >
                Entrar
              </button>
            ) : (
              renderIconAction()
            )}
          </div>
        </div>

        <div className="mt-4 text-left">
          <p className="text-sm font-medium text-muted-foreground">{league}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {date}
            {startTime ? ` • ${startTime}` : ""}
          </p>
        </div>

        <div className="mt-6 min-h-[152px]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4">
            <div className="flex flex-col items-center text-center">
              <TeamMark src={homeTeamLogo} alt={homeTeamLabel} defined={homeTeamDefined} />
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {homeTeamLabel}
              </p>
            </div>

            <div className="flex min-h-[110px] min-w-[72px] flex-col items-center justify-center gap-1">
              <p
                className={`text-sm font-semibold tracking-[0.12em] ${
                  shouldShowScore ? "text-muted-foreground" : "invisible"
                }`}
              >
                {shouldShowScore ? `${homeScore} - ${awayScore}` : "0 - 0"}
              </p>

              {currentStatus === "live" && liveDetail ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {liveDetail}
                </span>
              ) : (
                <span className="invisible text-xs font-medium">00'</span>
              )}
            </div>

            <div className="flex flex-col items-center text-center">
              <TeamMark src={awayTeamLogo} alt={awayTeamLabel} defined={awayTeamDefined} />
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {awayTeamLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
