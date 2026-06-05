import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  formatBrasiliaTime,
  getCurrentMatchStatus,
  parseWorldCupMatchDate,
  type MatchStatus,
} from "@/data/worldCup2026";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck, Heart, Share2, Sparkles, Ticket } from "lucide-react";
import { translateTeamLabel } from "@/lib/matchLabels";
import { toProxiedAssetUrl } from "@/lib/media";

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
      src={toProxiedAssetUrl(src)}
      alt={alt}
      className="h-16 w-auto max-w-[88px] object-contain drop-shadow-sm sm:h-20 sm:max-w-[104px]"
      loading="lazy"
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
    hasRoom && currentStatus === "live"
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
    if (!hasRoom || currentStatus === "live") {
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
      currentStatus === "live" && hasRoom
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
    <Card className={`flex h-full flex-col overflow-hidden bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${liveRoomClass}`}>
      <div className="flex h-full flex-col p-5">
        <div className="flex min-h-10 items-start justify-between gap-3">
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

          <div className="flex min-h-8 items-center justify-end gap-2">
            {hasRoom && currentStatus === "live" ? (
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
                  {normalizedReservationCount} na sala
                </span>
              </div>
            ) : (
              renderTopAction()
            )}
          </div>
        </div>

        <div className="mt-4 text-left">
          <p className="text-sm font-medium text-muted-foreground">{league}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {date}
            {startTime ? ` • ${formatBrasiliaTime(startTime)}` : ""}
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
            </div>

            <div className="flex flex-col items-center text-center">
              <TeamMark src={awayTeamLogo} alt={awayTeamLabel} defined={awayTeamDefined} />
              <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {awayTeamLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-end pt-4">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Compartilhar"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
