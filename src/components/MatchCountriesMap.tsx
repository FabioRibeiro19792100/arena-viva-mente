type MapPin = {
  x: number;
  y: number;
};

const COUNTRY_PIN_POSITIONS: Record<string, MapPin> = {
  mx: { x: 18, y: 41 },
  us: { x: 16, y: 32 },
  ca: { x: 15, y: 21 },
  pa: { x: 22, y: 50 },
  ec: { x: 28, y: 61 },
  co: { x: 27, y: 55 },
  py: { x: 32, y: 69 },
  uy: { x: 34, y: 78 },
  ar: { x: 31, y: 82 },
  br: { x: 34, y: 66 },
  ma: { x: 46, y: 41 },
  cv: { x: 40, y: 47 },
  sn: { x: 42, y: 49 },
  gh: { x: 47, y: 55 },
  ci: { x: 45, y: 56 },
  dz: { x: 49, y: 39 },
  tn: { x: 52, y: 40 },
  eg: { x: 56, y: 43 },
  cd: { x: 51, y: 61 },
  es: { x: 48, y: 35 },
  pt: { x: 46, y: 34 },
  gb: { x: 47, y: 24 },
  fr: { x: 50, y: 30 },
  be: { x: 51, y: 28 },
  nl: { x: 51, y: 25 },
  de: { x: 53, y: 27 },
  ch: { x: 52, y: 32 },
  at: { x: 54, y: 31 },
  hr: { x: 55, y: 33 },
  no: { x: 53, y: 16 },
  se: { x: 56, y: 18 },
  ba: { x: 55, y: 35 },
  cz: { x: 55, y: 28 },
  tr: { x: 60, y: 37 },
  iq: { x: 61, y: 41 },
  jo: { x: 58, y: 44 },
  sa: { x: 61, y: 49 },
  ir: { x: 65, y: 39 },
  uz: { x: 69, y: 31 },
  qa: { x: 60, y: 50 },
  za: { x: 55, y: 81 },
  kr: { x: 82, y: 34 },
  jp: { x: 86, y: 37 },
  au: { x: 83, y: 79 },
  nz: { x: 91, y: 87 },
};

const flagCodePattern = /\/([a-z]{2})\.png$/i;

const getFlagCode = (url: string) => {
  const match = url.match(flagCodePattern);
  return match?.[1]?.toLowerCase() || null;
};

const Pin = ({
  color,
  x,
  y,
}: {
  color: string;
  x: number;
  y: number;
}) => (
  <div
    className="absolute -translate-x-1/2 -translate-y-full"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    <div className="flex flex-col items-center">
      <div className="h-4 w-[2px]" style={{ backgroundColor: color }} />
      <div
        className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

export const MatchCountriesMap = ({
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
}: {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}) => {
  const homeCode = getFlagCode(homeTeamLogo);
  const awayCode = getFlagCode(awayTeamLogo);
  const homePin = homeCode ? COUNTRY_PIN_POSITIONS[homeCode] : null;
  const awayPin = awayCode ? COUNTRY_PIN_POSITIONS[awayCode] : null;

  if (!homePin || !awayPin) return null;

  return (
    <div className="space-y-2 pt-2">
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[18px] border border-border/60 bg-[#edf3ef]">
        <svg viewBox="0 0 1000 420" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <rect width="1000" height="420" fill="#edf3ef" />
          <path d="M67 109c44-42 100-63 157-56 31 4 71 23 83 54 12 30-17 53-43 70-29 18-47 38-47 70 0 24 18 52 3 73-16 22-54 8-79-4C83 383 20 326 15 258c-2-20 4-37 15-50 11-13 24-16 37-6z" fill="#d7e6d8" />
          <path d="M247 242c24-18 60-24 92-13 43 15 67 50 93 83 12 16 30 33 22 54-8 22-37 30-61 30-53 0-118-27-147-74-19-30-19-57 1-80z" fill="#d7e6d8" />
          <path d="M430 99c44-36 114-50 171-34 41 11 68 39 97 67 26 24 62 43 64 77 2 28-23 43-44 55-18 10-33 23-37 43-6 33 19 61 22 93 4 35-16 71-45 91-37 25-90 29-130 18-42-11-85-39-98-81-15-47 16-92 9-140-7-49-50-77-51-127-1-24 12-47 42-62z" fill="#d7e6d8" />
          <path d="M654 119c35-17 83-10 117 10 22 13 42 30 65 36 33 8 69-8 99 4 25 10 45 32 48 59 4 36-19 72-51 89-32 16-69 13-102 24-48 14-92 47-144 40-35-4-67-29-74-65-8-35 14-65 16-99 2-39-24-77-2-98 7-7 16-8 28 0z" fill="#d7e6d8" />
          <path d="M785 319c24-13 57-11 79 4 22 15 32 43 29 69-3 28-17 52-35 73-20 24-41 48-68 64-32 19-80 24-106-2-22-21-15-56-2-81 20-40 58-67 88-97 4-4 9-6 15-5z" fill="#d7e6d8" />
        </svg>

        <div className="absolute inset-0">
          <Pin color="#2563eb" x={homePin.x} y={homePin.y} />
          <Pin color="#e11d48" x={awayPin.x} y={awayPin.y} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
          <span>{homeTeam}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e11d48]" />
          <span>{awayTeam}</span>
        </div>
      </div>
    </div>
  );
};
