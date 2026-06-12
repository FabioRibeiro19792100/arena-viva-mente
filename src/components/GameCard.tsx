import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatBrasiliaTime,
  getCurrentMatchStatus,
  isMatchRoomOpen,
  parseWorldCupMatchDate,
  type MatchStatus,
} from "@/data/worldCup2026";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck, Heart, Share2, Sparkles, Ticket } from "lucide-react";
import { translateTeamLabel } from "@/lib/matchLabels";
import { MatchCardFrame } from "@/components/MatchCardFrame";

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
  reservationCount?: number;
  onToggleFavorite?: (matchId: string) => void;
  onReserveMatch?: (matchId: string) => void;
}

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
  reservationCount = 0,
  onToggleFavorite,
  onReserveMatch,
}: GameCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [now, setNow] = useState(() => Date.now());
  const homeTeamLabel = translateTeamLabel(homeTeam);
  const awayTeamLabel = translateTeamLabel(awayTeam);
  const homeTeamDefined = !isPlaceholderTeam(homeTeam);
  const awayTeamDefined = !isPlaceholderTeam(awayTeam);
  const normalizedReservationCount = Math.max(0, reservationCount);

  const currentStatus = getCurrentMatchStatus({ id, date, startTime: startTime || "", status });
  const roomOpen = hasRoom && isMatchRoomOpen({ id, date, startTime: startTime || "", status });
  const canFavorite = currentStatus !== "ended";
  const shouldShowScore =
    (currentStatus === "live" || currentStatus === "ended") &&
    homeScore !== undefined &&
    awayScore !== undefined;
  const kickoff = parseWorldCupMatchDate({ date, startTime: startTime || "" });
  const countdownMs = kickoff ? kickoff.getTime() - now : null;
  const shouldShowCountdown =
    currentStatus === "scheduled" &&
    countdownMs !== null &&
    countdownMs > 0 &&
    countdownMs <= 2 * 60 * 60 * 1000;

  useEffect(() => {
    if (!shouldShowCountdown) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [shouldShowCountdown]);

  const liveRoomClass =
    roomOpen
      ? "border-emerald-500/55 shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_0_28px_rgba(34,197,94,0.12)]"
      : "border-border/80";

  const formattedCountdown = (() => {
    if (!shouldShowCountdown || countdownMs === null) {
      return null;
    }

    const totalSeconds = Math.max(0, Math.floor(countdownMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  })();

  const renderTopAction = () => {
    if (!hasRoom || roomOpen) {
      return null;
    }

    const kind = currentStatus === "ended" ? "highlights" : isReserved ? "reserved" : "reserve";
    const label = currentStatus === "ended" ? "Highlights" : isReserved ? "Reservado" : "Reservar";
    const icon = currentStatus === "ended"
      ? <Sparkles className="h-3.5 w-3.5" />
      : isReserved
        ? <CheckCheck className="h-3.5 w-3.5" />
        : <Ticket className="h-3.5 w-3.5" />;

    const handleClick = () => {
      if (kind === "reserve") {
        onReserveMatch?.(id);
        return;
      }

      if (kind === "highlights") {
        navigate(`/resumo/${id}`);
      }
    };

    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex h-8 items-center justify-center gap-1.5 border border-border/90 px-2.5 text-xs font-medium text-foreground ${
            isReserved ? "bg-muted" : "bg-background transition-colors hover:bg-muted"
          }`}
          aria-label={label}
        >
          {icon}
          <span>{label}</span>
        </button>
        {(isReserved || kind === "reserve") && (
          <span className="text-[11px] text-muted-foreground">
            {normalizedReservationCount} reservas
          </span>
        )}
      </div>
    );
  };

  const handleShare = async () => {
    const path =
      roomOpen
        ? `/arquibancada/${id}`
        : currentStatus === "ended"
          ? `/resumo/${id}`
          : hasRoom
            ? `/booking/${id}`
            : "/";
    const shareUrl = `${window.location.origin}${path}`;
    const shareData = {
      title: `${homeTeamLabel} x ${awayTeamLabel}`,
      text: `${league} • ${date}${startTime ? ` • ${formatBrasiliaTime(startTime)}` : ""}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast({
          title: "Link copiado",
          description: "O evento foi copiado para compartilhar.",
        });
      }
    } catch {
      // Ignore canceled shares.
    }
  };

  return (
    <MatchCardFrame
      className={liveRoomClass}
      topLeft={
        <button
          type="button"
          onClick={() => canFavorite && onToggleFavorite?.(id)}
          disabled={!canFavorite}
          className={`rounded-full border border-border/80 bg-background/90 p-2 transition-colors ${
            canFavorite
              ? "text-muted-foreground hover:text-foreground"
              : "cursor-not-allowed text-muted-foreground/40"
          }`}
          aria-label={canFavorite ? (isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos") : "Favoritos indisponíveis para jogo encerrado"}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
        </button>
      }
      topRight={
        roomOpen ? (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              aria-label="Entrar"
              className="h-9 rounded-full border border-border/90 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => navigate(`/arquibancada/${id}`)}
            >
              Entrar
            </button>
            <span className="text-[11px] text-muted-foreground">
              {currentStatus === "live" ? `${normalizedReservationCount} na sala` : "Pré-jogo liberado"}
            </span>
          </div>
        ) : (
          renderTopAction()
        )
      }
      league={league}
      meta={`${date}${startTime ? ` • ${formatBrasiliaTime(startTime)}` : ""}`}
      homeTeam={homeTeamLabel}
      awayTeam={awayTeamLabel}
      homeTeamLogo={homeTeamLogo}
      awayTeamLogo={awayTeamLogo}
      homeTeamDefined={homeTeamDefined}
      awayTeamDefined={awayTeamDefined}
      centerContent={
        <>
          <p
            className={`text-sm font-semibold tracking-[0.12em] ${
              shouldShowScore || shouldShowCountdown ? "text-muted-foreground" : "invisible"
            }`}
          >
            {shouldShowScore ? `${homeScore} - ${awayScore}` : formattedCountdown || "0 - 0"}
          </p>

          {currentStatus === "live" && liveDetail ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {liveDetail}
            </span>
          ) : shouldShowCountdown ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Em breve
            </span>
          ) : currentStatus === "ended" && shouldShowScore ? (
            <span className="text-xs font-medium text-muted-foreground">Encerrado</span>
          ) : (
            <span className="invisible text-xs font-medium">00'</span>
          )}
        </>
      }
      footerContent={
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Compartilhar"
        >
          <Share2 className="h-4 w-4" />
        </button>
      }
    />
  );
};
