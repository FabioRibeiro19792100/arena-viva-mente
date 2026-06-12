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
    <div className={`flex h-full flex-col ${surface === "plain" ? "justify-between p-0" : "p-5"}`}>
      {(topLeft || topRight) && (
        <div
          className={`flex min-h-10 gap-3 ${
            surface === "plain" ? "items-center justify-center text-center" : "items-start justify-between"
          }`}
        >
          {topLeft ? <div>{topLeft}</div> : null}
          {topRight ? (
            <div
              className={`flex min-h-8 items-center gap-2 ${
                surface === "plain" ? "justify-center" : "justify-end"
              }`}
            >
              {topRight}
            </div>
          ) : null}
        </div>
      )}

      <div className={`${topLeft || topRight ? "mt-4" : ""} ${surface === "plain" ? "text-center" : "text-left"}`}>
        <p className="text-sm font-medium text-muted-foreground">{league}</p>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </div>

      <div className={`${surface === "plain" ? "mt-4 flex flex-1 items-center" : "mt-6 min-h-[152px]"}`}>
        <div className={`grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${surface === "plain" ? "items-center gap-3" : "items-start gap-4"}`}>
          <div className="flex flex-col items-center text-center">
            <TeamMark src={homeTeamLogo} alt={homeTeam} defined={homeTeamDefined} />
            <p className="mt-3 max-w-full truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
              {homeTeam}
            </p>
          </div>

          <div className={`flex min-w-[72px] flex-col items-center justify-center gap-1 ${surface === "plain" ? "min-h-[96px]" : "min-h-[110px]"}`}>
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

      {bottomContent ? (
        <div className={surface === "plain" ? "pt-3" : "mt-auto pt-4"}>{bottomContent}</div>
      ) : (
        <div className={surface === "plain" ? "pt-3" : "mt-auto pt-4"} />
      )}

      {footerContent ? <div className="flex justify-end pt-1">{footerContent}</div> : null}
    </div>
  );

  if (surface === "plain") {
    return <div className={wrapperClassName}>{content}</div>;
  }

  return <Card className={wrapperClassName}>{content}</Card>;
};

export { TeamMark };
