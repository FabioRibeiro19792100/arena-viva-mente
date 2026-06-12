import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { isApiSportsMediaUrl, toProxiedAssetUrl } from "@/lib/media";

const TeamMark = ({
  src,
  alt,
  defined,
  fallbackText,
  imageClassName = "h-16 w-auto max-w-[88px] object-contain drop-shadow-sm sm:h-20 sm:max-w-[104px]",
}: {
  src: string;
  alt: string;
  defined: boolean;
  fallbackText?: string;
  imageClassName?: string;
}) => {
  const [imageSrc, setImageSrc] = useState(() => toProxiedAssetUrl(src));
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setImageSrc(toProxiedAssetUrl(src));
    setHasImageError(false);
  }, [src]);

  if (!defined) {
    return (
      <div className="flex h-16 min-w-[88px] items-center justify-center border border-dashed border-border/80 bg-muted/30 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:h-20 sm:min-w-[104px]">
        {fallbackText || "A definir"}
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
      src={imageSrc}
      alt={alt}
      className={imageClassName}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (imageSrc !== src && isApiSportsMediaUrl(src)) {
          setImageSrc(src);
          return;
        }
        setHasImageError(true);
      }}
    />
  );
};

interface MatchCardFrameProps {
  className?: string;
  surface?: "card" | "plain";
  topLeft?: ReactNode;
  topRight?: ReactNode;
  league: string;
  meta: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeTeamDefined?: boolean;
  awayTeamDefined?: boolean;
  centerContent: ReactNode;
  bottomContent?: ReactNode;
  footerContent?: ReactNode;
}

export const MatchCardFrame = ({
  className = "",
  surface = "card",
  topLeft,
  topRight,
  league,
  meta,
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
  homeTeamDefined = true,
  awayTeamDefined = true,
  centerContent,
  bottomContent,
  footerContent,
}: MatchCardFrameProps) => {
  const wrapperClassName =
    surface === "plain"
      ? `flex h-full flex-col ${className}`
      : `flex h-full flex-col overflow-hidden bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${className}`;

  const content = (
    <div className={`flex h-full flex-col ${surface === "plain" ? "p-0" : "p-5"}`}>
      {(topLeft || topRight) && (
        <div className="flex min-h-10 items-start justify-between gap-3">
          <div>{topLeft}</div>
          <div className="flex min-h-8 items-center justify-end gap-2">{topRight}</div>
        </div>
      )}

      <div className={`${topLeft || topRight ? "mt-4" : ""} text-left`}>
        <p className="text-sm font-medium text-muted-foreground">{league}</p>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </div>

      <div className="mt-6 min-h-[152px]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4">
          <div className="flex flex-col items-center text-center">
            <TeamMark src={homeTeamLogo} alt={homeTeam} defined={homeTeamDefined} />
            <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
              {homeTeam}
            </p>
          </div>

          <div className="flex min-h-[110px] min-w-[72px] flex-col items-center justify-center gap-1">
            {centerContent}
          </div>

          <div className="flex flex-col items-center text-center">
            <TeamMark src={awayTeamLogo} alt={awayTeam} defined={awayTeamDefined} />
            <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
              {awayTeam}
            </p>
          </div>
        </div>
      </div>

      {bottomContent ? <div className="mt-auto pt-4">{bottomContent}</div> : <div className="mt-auto pt-4" />}

      {footerContent ? <div className="flex justify-end pt-1">{footerContent}</div> : null}
    </div>
  );

  if (surface === "plain") {
    return <div className={wrapperClassName}>{content}</div>;
  }

  return <Card className={wrapperClassName}>{content}</Card>;
};

export { TeamMark };
