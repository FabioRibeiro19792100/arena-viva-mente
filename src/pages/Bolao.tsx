import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMockAuth } from "@/contexts/MockAuthContext";
import {
  formatBrasiliaTime,
  getCurrentMatchStatus,
  type WorldCupMatch,
} from "@/data/worldCup2026";
import {
  getWorldCupLeaderboard,
  getWorldCupPredictions,
  saveWorldCupPrediction,
  scoreWorldCupPrediction,
  type WorldCupPrediction,
} from "@/lib/bolao";
import { fetchWorldCupPoolMatches, type WorldCupPoolMatch } from "@/lib/worldCupPoolApi";
import { useToast } from "@/hooks/use-toast";
import { MatchCardFrame } from "@/components/MatchCardFrame";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamMark } from "@/components/MatchCardFrame";
import { MatchCountriesMap } from "@/components/MatchCountriesMap";
import { Sparkles } from "lucide-react";
import { FIFA_RANKING_2026, FIFA_RANKING_SNAPSHOT_DATE } from "@/data/fifaRanking2026";

const toInitialValues = (predictions: WorldCupPrediction[]) =>
  predictions.reduce<Record<string, { home: string; away: string }>>((acc, prediction) => {
    acc[prediction.matchId] = {
      home: String(prediction.predictedHomeScore),
      away: String(prediction.predictedAwayScore),
    };
    return acc;
  }, {});

const statusLabelByMatchStatus = (status: ReturnType<typeof getCurrentMatchStatus>) => {
  if (status === "live") return "Jogo ao vivo";
  if (status === "ended") return "Encerrado";
  return "Palpite aberto";
};

const hasOfficialScore = (match: WorldCupPoolMatch) =>
  typeof match.homeScore === "number" && typeof match.awayScore === "number";

const getPredictionFeedback = (points: number | null) => {
  if (points === 5) {
    return {
      label: "Cravou o placar",
      className: "text-emerald-600",
    };
  }

  if (points === 3) {
    return {
      label: "Acertou o resultado",
      className: "text-sky-600",
    };
  }

  if (points === 0) {
    return {
      label: "Errou o palpite",
      className: "text-rose-600",
    };
  }

  return {
    label: "Palpite salvo",
    className: "text-muted-foreground",
  };
};

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, index) => index);
const WHEEL_ITEM_HEIGHT = 44;
const TEAM_RANKING_ALIASES: Record<string, string> = {
  "Costa do Marfim": "Ivory Coast",
  Equador: "Ecuador",
  "Coreia do Sul": "South Korea",
  "Estados Unidos": "United States",
  "Países Baixos": "Netherlands",
  "República Tcheca": "Czech Republic",
  "Bósnia e Herzegovina": "Bosnia and Herzegovina",
  "África do Sul": "South Africa",
  "Arábia Saudita": "Saudi Arabia",
  "Nova Zelândia": "New Zealand",
  "RD Congo": "DR Congo",
  "Cabo Verde": "Cape Verde",
  "Suíça": "Switzerland",
  "Irã": "Iran",
  "Japão": "Japan",
  "Marrocos": "Morocco",
  "Alemanha": "Germany",
  "Inglaterra": "England",
  "França": "France",
  "Croácia": "Croatia",
  "Argélia": "Algeria",
  "Áustria": "Austria",
  Escócia: "Scotland",
  México: "Mexico",
  Senegal: "Senegal",
};

const getRankingKey = (team: string) => TEAM_RANKING_ALIASES[team] || team;

type AiProposal = {
  match: WorldCupPoolMatch;
  homeScore: number;
  awayScore: number;
  reasons: string[];
  mode: "ranking" | "random";
};

const getPredictionProfile = (predictions: WorldCupPrediction[]) => {
  if (predictions.length === 0) {
    return {
      avgGoals: 2.4,
      drawRate: 0.28,
      tendencyLabel: "Sem histórico seu ainda, a leitura ficou no cenário mais seguro.",
    };
  }

  const totals = predictions.reduce(
    (acc, prediction) => {
      acc.goals += prediction.predictedHomeScore + prediction.predictedAwayScore;
      acc.draws += prediction.predictedHomeScore === prediction.predictedAwayScore ? 1 : 0;
      return acc;
    },
    { goals: 0, draws: 0 },
  );

  const avgGoals = totals.goals / predictions.length;
  const drawRate = totals.draws / predictions.length;

  let tendencyLabel = "Seu histórico recente está equilibrado, sem puxar demais o placar.";
  if (avgGoals <= 2.1) {
    tendencyLabel = "Seus palpites costumam ser mais curtos, então a sugestão segurou os gols.";
  } else if (avgGoals >= 3.4) {
    tendencyLabel = "Seus palpites costumam abrir mais gols, então a sugestão soltou mais o jogo.";
  } else if (drawRate >= 0.4) {
    tendencyLabel = "Você costuma respeitar equilíbrio, então o empate ganhou peso.";
  }

  return { avgGoals, drawRate, tendencyLabel };
};

const buildAiProposal = (
  match: WorldCupPoolMatch,
  existingPredictions: WorldCupPrediction[],
): AiProposal => {
  const homeRank = FIFA_RANKING_2026[getRankingKey(match.homeTeam)] ?? null;
  const awayRank = FIFA_RANKING_2026[getRankingKey(match.awayTeam)] ?? null;
  const rankGap = homeRank !== null && awayRank !== null ? awayRank - homeRank : 0;
  const profile = getPredictionProfile(existingPredictions);
  const isGroupStage = match.stage.startsWith("Grupo");

  let homeScore = 1;
  let awayScore = 1;

  if (homeRank !== null && awayRank !== null) {
    if (rankGap >= 20) {
      homeScore = 3;
      awayScore = 0;
    } else if (rankGap >= 10) {
      homeScore = 2;
      awayScore = 0;
    } else if (rankGap >= 5) {
      homeScore = 2;
      awayScore = 1;
    } else if (rankGap <= -20) {
      homeScore = 0;
      awayScore = 3;
    } else if (rankGap <= -10) {
      homeScore = 0;
      awayScore = 2;
    } else if (rankGap <= -5) {
      homeScore = 1;
      awayScore = 2;
    }
  }

  if (isGroupStage && profile.drawRate >= 0.4 && Math.abs(rankGap) <= 5) {
    homeScore = 1;
    awayScore = 1;
  }

  if (profile.avgGoals <= 2.1) {
    homeScore = Math.min(homeScore, 2);
    awayScore = Math.min(awayScore, 1);
  } else if (profile.avgGoals >= 3.4 && homeScore + awayScore <= 2) {
    if (rankGap >= 0) {
      homeScore += 1;
    } else {
      awayScore += 1;
    }
  }

  const rankReason =
    homeRank !== null && awayRank !== null
      ? `${match.homeTeam} está em ${homeRank}º e ${match.awayTeam} em ${awayRank}º no ranking FIFA local de ${FIFA_RANKING_SNAPSHOT_DATE}.`
      : "Sem ranking local fechado para um dos lados, a sugestão ficou no cenário mais neutro.";

  const matchupReason =
    homeRank !== null && awayRank !== null
      ? Math.abs(rankGap) <= 4
        ? "A distância entre os dois é curta, então a leitura pede margem apertada."
        : rankGap > 0
          ? `${match.homeTeam} chega acima no ranking e por isso a sugestão pende para esse lado.`
          : `${match.awayTeam} chega acima no ranking e por isso a sugestão pende para esse lado.`
      : isGroupStage
        ? "Na fase de grupos, a leitura ficou mais conservadora."
        : "Sem comparação forte, a sugestão ficou no placar mais plausível.";

  return {
    match,
    homeScore,
    awayScore,
    reasons: [rankReason, matchupReason, profile.tendencyLabel],
    mode: "ranking",
  };
};

const buildRandomProposal = (match: WorldCupPoolMatch): AiProposal => {
  const seedBase = `${match.id}:${Date.now()}:${Math.random()}`;
  const seed = Array.from(seedBase).reduce((acc, char) => ((acc * 33) + char.charCodeAt(0)) % 9973, 11);
  const homeScore = seed % 5;
  const awayScore = Math.floor(seed / 7) % 5;

  return {
    match,
    homeScore,
    awayScore,
    mode: "random",
    reasons: [
      "Aqui não teve análise: foi licença poética de arquibancada.",
      "A ideia é só te tirar da indecisão e jogar um placar possível na tela.",
      "Se não curtir, troca na mão e segue o jogo.",
    ],
  };
};

const ScoreWheel = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: value * WHEEL_ITEM_HEIGHT, behavior: "auto" });
  }, [value]);

  useEffect(
    () => () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-11 -translate-y-1/2 border-y border-border/80 bg-muted/20" />
        <div
          ref={viewportRef}
          className="h-[220px] overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: WHEEL_ITEM_HEIGHT * 2, paddingBottom: WHEEL_ITEM_HEIGHT * 2 }}
          onScroll={(event) => {
            if (scrollTimeoutRef.current !== null) {
              window.clearTimeout(scrollTimeoutRef.current);
            }

            const nextTop = event.currentTarget.scrollTop;
            const nextValue = Math.max(0, Math.min(10, Math.round(nextTop / WHEEL_ITEM_HEIGHT)));

            if (nextValue !== value) {
              onChange(nextValue);
            }

            scrollTimeoutRef.current = window.setTimeout(() => {
              event.currentTarget.scrollTo({
                top: nextValue * WHEEL_ITEM_HEIGHT,
                behavior: "smooth",
              });
            }, 80);
          }}
        >
          {SCORE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`block h-11 w-full snap-center text-center text-xl font-semibold transition-colors ${
                option === value ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Bolao = () => {
  const { user } = useMockAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState<WorldCupPoolMatch[]>([]);
  const [predictions, setPredictions] = useState<WorldCupPrediction[]>([]);
  const [formValues, setFormValues] = useState<Record<string, { home: string; away: string }>>({});
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof getWorldCupLeaderboard>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"palpites" | "ranking">("palpites");
  const [predictionView, setPredictionView] = useState<"deck" | "saved">("deck");
  const [activeDeckMatchId, setActiveDeckMatchId] = useState<string | null>(null);
  const [activePickerMatchId, setActivePickerMatchId] = useState<string | null>(null);
  const [pickerValues, setPickerValues] = useState<{ home: number; away: number } | null>(null);
  const [aiProposal, setAiProposal] = useState<AiProposal | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const loadBolaoData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const resolvedMatches = await fetchWorldCupPoolMatches();
      const [nextPredictions, nextLeaderboard] = await Promise.all([
        getWorldCupPredictions(user.id, resolvedMatches),
        getWorldCupLeaderboard(resolvedMatches, user),
      ]);

      setMatches(resolvedMatches);
      setPredictions(nextPredictions);
      setFormValues(toInitialValues(nextPredictions));
      setLeaderboard(nextLeaderboard);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void loadBolaoData();
  }, [user]);

  const predictionsByMatchId = useMemo(
    () =>
      predictions.reduce<Record<string, WorldCupPrediction>>((acc, prediction) => {
        acc[prediction.matchId] = prediction;
        return acc;
      }, {}),
    [predictions],
  );

  const myTotalPoints = useMemo(
    () =>
      matches.reduce((sum, match) => {
        const points = scoreWorldCupPrediction(match, predictionsByMatchId[match.id]);
        return sum + (points || 0);
      }, 0),
    [matches, predictionsByMatchId],
  );

  const myExactHits = useMemo(
    () =>
      matches.reduce((sum, match) => {
        const points = scoreWorldCupPrediction(match, predictionsByMatchId[match.id]);
        return sum + (points === 5 ? 1 : 0);
      }, 0),
    [matches, predictionsByMatchId],
  );

  const myOutcomeHits = useMemo(
    () =>
      matches.reduce((sum, match) => {
        const points = scoreWorldCupPrediction(match, predictionsByMatchId[match.id]);
        return sum + (points === 3 ? 1 : 0);
      }, 0),
    [matches, predictionsByMatchId],
  );

  const currentUserRankingEntry = useMemo(() => {
    const existing = leaderboard.find((entry) => entry.userId === user?.id);
    if (existing) return existing;
    if (!user) return null;
    return {
      userId: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatar,
      totalPoints: myTotalPoints,
      exactScoreHits: myExactHits,
      outcomeHits: myOutcomeHits,
      predictionsCount: predictions.length,
    };
  }, [leaderboard, myExactHits, myOutcomeHits, myTotalPoints, predictions.length, user]);

  const applySavedPredictionLocally = (matchId: string, home: number, away: number) => {
    const nextPrediction: WorldCupPrediction = {
      matchId,
      predictedHomeScore: home,
      predictedAwayScore: away,
      updatedAt: new Date().toISOString(),
    };

    setPredictions((current) => [
      nextPrediction,
      ...current.filter((prediction) => prediction.matchId !== matchId),
    ]);
    setFormValues((current) => ({
      ...current,
      [matchId]: {
        home: String(home),
        away: String(away),
      },
    }));
  };

  const persistPrediction = async (match: WorldCupPoolMatch, values: { home: number; away: number }) => {
    if (!user) return;

    setSavingMatchId(match.id);
    try {
      await saveWorldCupPrediction(
        user.id,
        match.id,
        values.home,
        values.away,
        match.linkedSportsMatchId ? [match.linkedSportsMatchId] : [],
      );
    } catch {
      toast({
        title: "Não foi possível salvar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSavingMatchId(null);
    }
  };

  const queuePredictionSave = (match: WorldCupPoolMatch, values: { home: number; away: number }) => {
    if (!user) return;
    if (Number.isNaN(values.home) || Number.isNaN(values.away)) {
      return;
    }

    applySavedPredictionLocally(match.id, values.home, values.away);

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void persistPrediction(match, values);
    }, 250);
  };

  const openScorePicker = (match: WorldCupPoolMatch) => {
    const currentValues = formValues[match.id];
    const savedPrediction = predictionsByMatchId[match.id];
    setActivePickerMatchId(match.id);
    setPickerValues({
      home: Number(currentValues?.home ?? savedPrediction?.predictedHomeScore ?? 0),
      away: Number(currentValues?.away ?? savedPrediction?.predictedAwayScore ?? 0),
    });
  };

  const applyAiProposal = () => {
    if (!aiProposal || !user) return;

    const nextValues = {
      home: aiProposal.homeScore,
      away: aiProposal.awayScore,
    };

    applySavedPredictionLocally(aiProposal.match.id, nextValues.home, nextValues.away);

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void persistPrediction(aiProposal.match, nextValues);
    }, 50);

    setAiProposal(null);
  };

  const applyRandomProposal = (match: WorldCupPoolMatch) => {
    if (!user) return;

    const randomProposal = buildRandomProposal(match);
    const nextValues = {
      home: randomProposal.homeScore,
      away: randomProposal.awayScore,
    };

    applySavedPredictionLocally(match.id, nextValues.home, nextValues.away);

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void persistPrediction(match, nextValues);
    }, 50);
  };

  const activePickerMatch = useMemo(
    () => matches.find((match) => match.id === activePickerMatchId) || null,
    [activePickerMatchId, matches],
  );

  useEffect(
    () => () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    },
    [],
  );

  const pendingPredictionsCount = useMemo(
    () =>
      matches.filter(
        (match) => getCurrentMatchStatus(match) === "scheduled" && !predictionsByMatchId[match.id],
      ).length,
    [matches, predictionsByMatchId],
  );

  const savedPredictionsCount = useMemo(
    () => Object.keys(predictionsByMatchId).length,
    [predictionsByMatchId],
  );

  const pendingMatches = useMemo(
    () =>
      matches
        .filter(
          (match) => getCurrentMatchStatus(match) === "scheduled" && !predictionsByMatchId[match.id],
        )
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [matches, predictionsByMatchId],
  );

  const savedMatches = useMemo(
    () =>
      matches
        .filter((match) => Boolean(predictionsByMatchId[match.id]))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [matches, predictionsByMatchId],
  );

  useEffect(() => {
    if (pendingMatches.length === 0) return;

    const currentStillExists = activeDeckMatchId && pendingMatches.some((match) => match.id === activeDeckMatchId);
    if (currentStillExists) return;

    const currentSavedMatch = activeDeckMatchId ? matches.find((match) => match.id === activeDeckMatchId) : null;
    if (currentSavedMatch && getCurrentMatchStatus(currentSavedMatch) === "scheduled") return;

    setActiveDeckMatchId(pendingMatches[0].id);
  }, [activeDeckMatchId, matches, pendingMatches]);

  const activeDeckIndex = useMemo(
    () => pendingMatches.findIndex((match) => match.id === activeDeckMatchId),
    [activeDeckMatchId, pendingMatches],
  );

  const goToPreviousDeckMatch = () => {
    if (activeDeckIndex <= 0) return;
    setActiveDeckMatchId(pendingMatches[activeDeckIndex - 1]?.id || null);
  };

  const goToNextDeckMatch = () => {
    if (activeDeckIndex >= pendingMatches.length - 1) return;
    setActiveDeckMatchId(pendingMatches[activeDeckIndex + 1]?.id || null);
  };

  const activeDeckMatch =
    (activeDeckMatchId ? matches.find((match) => match.id === activeDeckMatchId) : null) ||
    pendingMatches[0] ||
    null;

  const savedGroupedMatches = useMemo(
    () =>
      Array.from(
        savedMatches.reduce((groups, match) => {
          const list = groups.get(match.stage) || [];
          list.push(match);
          groups.set(match.stage, list);
          return groups;
        }, new Map<string, WorldCupPoolMatch[]>()),
      ),
    [savedMatches],
  );

  const renderPredictionCard = (match: WorldCupPoolMatch) => {
    const currentStatus = getCurrentMatchStatus(match);
    const savedPrediction = predictionsByMatchId[match.id];
    const points = scoreWorldCupPrediction(match, savedPrediction);
    const predictionFeedback = getPredictionFeedback(points);
    const values = formValues[match.id] || { home: "", away: "" };
    const isLocked = currentStatus !== "scheduled";
    const showOfficialScore = hasOfficialScore(match);
    const isMobileDeck = isMobile && predictionView === "deck";
    const displayHomeValue =
      values.home !== "" ? values.home : savedPrediction ? String(savedPrediction.predictedHomeScore) : "--";
    const displayAwayValue =
      values.away !== "" ? values.away : savedPrediction ? String(savedPrediction.predictedAwayScore) : "--";

    return (
      <MatchCardFrame
        key={match.id}
        surface={isMobileDeck ? "plain" : "card"}
        className={isMobileDeck ? "h-full" : "h-full border-border/80 shadow-[var(--shadow-card)]"}
        topRight={
          <div className="flex items-center gap-2">
            {currentStatus !== "scheduled" ? (
              <span className="text-xs font-medium text-muted-foreground">
                {statusLabelByMatchStatus(currentStatus)}
              </span>
            ) : null}
            {points !== null ? <span className="text-xs font-medium text-foreground">{points} pts</span> : null}
          </div>
        }
        league={match.league}
        meta={`${match.date} • ${formatBrasiliaTime(match.startTime)}`}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeTeamLogo={match.homeTeamLogo}
        awayTeamLogo={match.awayTeamLogo}
        centerContent={
          isLocked && showOfficialScore ? (
            <div className="space-y-2 text-center">
              <div>
                <p className="text-xl font-semibold tracking-[0.12em] text-muted-foreground">
                  {match.homeScore} - {match.awayScore}
                </p>
                <span className="text-xs font-medium text-muted-foreground">Placar oficial</span>
              </div>
              {savedPrediction ? (
                <div className={`text-xs font-medium ${predictionFeedback.className}`}>
                  <div>
                    Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                  </div>
                  <div>
                    {predictionFeedback.label}
                    {points !== null ? ` • ${points} pontos` : ""}
                  </div>
                </div>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Encerrado</span>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <button
                type="button"
                onClick={() => openScorePicker(match)}
                className={`transition-colors ${isMobileDeck ? "px-0 py-2" : "rounded-2xl border border-border/80 bg-background px-4 py-3 hover:bg-muted/30"}`}
              >
                <div className={`${isMobileDeck ? "text-4xl" : "text-xl"} font-semibold tracking-[0.12em] text-foreground`}>
                  {displayHomeValue} - {displayAwayValue}
                </div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">
                  {savingMatchId === match.id ? "Salvando..." : "Toque para escolher"}
                </div>
              </button>
              {savedPrediction ? (
                <div className={`text-xs font-medium ${predictionFeedback.className}`}>
                  Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                </div>
              ) : null}
            </div>
          )
        }
        bottomContent={
          <div className="space-y-3">
            {!isLocked ? (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAiProposal(buildAiProposal(match, predictions))}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/25 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>IA, qual seu palpite?</span>
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => applyRandomProposal(match)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/25 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Mete o louco(a)</span>
                  </button>
                </div>
              </div>
            ) : null}

            <MatchCountriesMap
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeTeamLogo={match.homeTeamLogo}
              awayTeamLogo={match.awayTeamLogo}
            />
          </div>
        }
      />
    );
  };

  const renderSavedPredictionRow = (match: WorldCupPoolMatch) => {
    const savedPrediction = predictionsByMatchId[match.id];
    if (!savedPrediction) return null;

    const points = scoreWorldCupPrediction(match, savedPrediction);
    const predictionFeedback = getPredictionFeedback(points);
    const officialScore = hasOfficialScore(match)
      ? `${match.homeScore} x ${match.awayScore}`
      : null;

    return (
      <div
        key={match.id}
        className="flex w-full items-center gap-3 border-b border-border/60 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm">
            <TeamMark
              src={match.homeTeamLogo}
              alt={match.homeTeam}
              defined
              imageClassName="h-6 w-auto max-w-[28px] object-contain"
            />
          </div>
          <span className="truncate text-sm font-medium text-foreground">{match.homeTeam}</span>
        </div>

        <div className="flex min-w-[92px] flex-col items-center text-center">
          <span className="text-sm font-semibold text-foreground">
            {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
          </span>
          {officialScore ? (
            <span className="text-[11px] text-muted-foreground">Oficial {officialScore}</span>
          ) : null}
          <span className={`text-[11px] font-medium ${predictionFeedback.className}`}>
            {predictionFeedback.label}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-medium text-foreground">{match.awayTeam}</span>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm">
            <TeamMark
              src={match.awayTeamLogo}
              alt={match.awayTeam}
              defined
              imageClassName="h-6 w-auto max-w-[28px] object-contain"
            />
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="py-6 md:py-14">
        <div className="container px-6">
          {!isMobile && (
            <div className="mb-4 space-y-2 md:mb-8 md:space-y-3">
              <h1 className="text-2xl font-semibold text-foreground md:text-4xl">
                Bolão
              </h1>
            </div>
          )}

          <div className="mb-4 hidden items-center justify-between gap-4 md:flex">
            <p className="text-sm text-muted-foreground">
              Regras: 5 pontos no placar exato, 3 pontos no resultado e 0 pontos quando não acertar.
            </p>
          </div>

          <div className="mb-6 space-y-4 md:mb-10 md:space-y-6">
            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("palpites");
                  setPredictionView("saved");
                }}
                className={`underline underline-offset-4 transition-colors ${
                  activeTab === "palpites" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Lista de palpites
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ranking")}
                className={`underline underline-offset-4 transition-colors ${
                  activeTab === "ranking" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ranking
              </button>
            </div>

            {activeTab === "ranking" ? (
              <div className="space-y-6">
              {currentUserRankingEntry && (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Meu desempenho</p>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={currentUserRankingEntry.avatarUrl || undefined} alt={currentUserRankingEntry.name} />
                        <AvatarFallback>{currentUserRankingEntry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-foreground">{currentUserRankingEntry.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentUserRankingEntry.totalPoints} pontos totais
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="border border-border/70 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Pontos</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{currentUserRankingEntry.totalPoints}</p>
                      </div>
                      <div className="border border-border/70 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Placares exatos</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{currentUserRankingEntry.exactScoreHits}</p>
                      </div>
                      <div className="border border-border/70 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Resultados</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{currentUserRankingEntry.outcomeHits}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/80 shadow-[var(--shadow-card)]">
                <CardContent className="space-y-5 p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Classificação</h2>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {leaderboard.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ainda não há pontuação fechada.</p>
                    ) : (
                      leaderboard.slice(0, 12).map((entry, index) => (
                        <div
                          key={entry.userId}
                          className="flex items-center gap-3 border border-border/70 px-3 py-3"
                        >
                          <span className="w-5 text-sm font-medium text-muted-foreground">{index + 1}</span>
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
                            <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.exactScoreHits} exatos · {entry.outcomeHits} resultados
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{entry.totalPoints} pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className="space-y-8">
              <div className="flex items-center justify-between gap-3">
                {predictionView === "deck" ? (
                  <span className="text-sm font-medium text-foreground">
                    {pendingMatches.length === 0
                      ? "Nenhum jogo faltando"
                      : `${pendingMatches.length} ${pendingMatches.length === 1 ? "jogo faltando" : "jogos faltando"}`}
                  </span>
                ) : (
                  <span />
                )}
                {predictionView === "saved" ? (
                  <button
                    type="button"
                    onClick={() => setPredictionView("deck")}
                    className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Voltar aos jogos
                  </button>
                ) : null}
              </div>

              {isLoading ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="p-8 text-sm text-muted-foreground">
                    Carregando bolão...
                  </CardContent>
                </Card>
              ) : matches.length === 0 ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="space-y-2 p-8">
                    <p className="text-sm font-medium text-foreground">
                      Os jogos do bolão ainda não apareceram na base.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Assim que a tabela do bolão estiver pronta no ambiente e o sync rodar, os jogos entram aqui.
                    </p>
                  </CardContent>
                </Card>
          ) : predictionView === "saved" && savedMatches.length === 0 ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="p-8 text-sm text-muted-foreground">
                    Nenhum palpite salvo ainda.
                  </CardContent>
                </Card>
              ) : predictionView === "deck" && !activeDeckMatch ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="space-y-3 p-8 text-center">
                    <p className="text-base font-medium text-foreground">Não há jogos abertos para palpitar agora.</p>
                    <p className="text-sm text-muted-foreground">
                      Quando aparecer jogo novo na agenda, ele entra aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                predictionView === "deck" && activeDeckMatch ? (
                  <section className="space-y-4 md:space-y-5">
                    {!isMobile && (
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                          {activeDeckIndex + 1} de {pendingMatches.length}
                        </h2>
                        <p className="text-sm text-muted-foreground">{activeDeckMatch.stage}</p>
                      </div>
                    )}

                    <div
                      className={isMobile ? "flex min-h-[calc(100svh-320px)] flex-col" : ""}
                      onTouchStart={(event) => {
                        touchStartXRef.current = event.touches[0]?.clientX ?? null;
                        touchDeltaXRef.current = 0;
                      }}
                      onTouchMove={(event) => {
                        if (touchStartXRef.current === null) return;
                        touchDeltaXRef.current = (event.touches[0]?.clientX ?? 0) - touchStartXRef.current;
                      }}
                      onTouchEnd={() => {
                        if (!isMobile) return;
                        if (touchDeltaXRef.current <= -48) {
                          goToNextDeckMatch();
                        } else if (touchDeltaXRef.current >= 48) {
                          goToPreviousDeckMatch();
                        }
                        touchStartXRef.current = null;
                        touchDeltaXRef.current = 0;
                      }}
                    >
                      <div className={isMobile ? "flex-1" : ""}>
                        {renderPredictionCard(activeDeckMatch)}
                      </div>
                    </div>

                    {isMobile ? (
                      <div className="flex items-center justify-center pb-2 text-center text-xs font-medium text-muted-foreground">
                        Deslize para o lado para ver o proximo jogo
                      </div>
                    ) : null}

                    <div className="hidden items-center justify-between gap-3 md:flex">
                      <Button
                        variant="outline"
                        onClick={goToPreviousDeckMatch}
                        disabled={activeDeckIndex === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={goToNextDeckMatch}
                        disabled={activeDeckIndex >= pendingMatches.length - 1}
                      >
                        Próximo
                      </Button>
                    </div>
                  </section>
                ) : (
                isMobile ? (
                  <div className="max-h-[calc(100svh-220px)] overflow-y-auto">
                    {savedMatches.map((match) => renderSavedPredictionRow(match))}
                  </div>
                ) : (
                  savedGroupedMatches.map(([stage, stageMatches]) => (
                    <section key={stage} className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-foreground">{stage}</h2>
                        <p className="text-sm text-muted-foreground">
                          {stageMatches.length} {stageMatches.length === 1 ? "jogo" : "jogos"}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {stageMatches.map((match) => renderPredictionCard(match))}
                      </div>
                    </section>
                  ))
                ))
              )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Drawer open={Boolean(activePickerMatch)} onOpenChange={(open) => !open && setActivePickerMatchId(null)}>
        <DrawerContent className="border-border bg-card">
          <DrawerHeader>
            <DrawerTitle>
              {activePickerMatch ? `${activePickerMatch.homeTeam} x ${activePickerMatch.awayTeam}` : "Escolher placar"}
            </DrawerTitle>
            <DrawerDescription>Deslize para cima ou para baixo. O palpite salva sozinho.</DrawerDescription>
          </DrawerHeader>

          {activePickerMatch && pickerValues && (
            <div className="grid grid-cols-2 gap-6 px-6 pb-8 pt-2">
              <ScoreWheel
                label={activePickerMatch.homeTeam}
                value={pickerValues.home}
                onChange={(nextHome) => {
                  const nextValues =
                    pickerValues && activePickerMatch
                      ? { home: nextHome, away: pickerValues.away }
                      : null;
                  setPickerValues((current) => (current ? { ...current, home: nextHome } : current));
                  if (nextValues) {
                    queuePredictionSave(activePickerMatch, nextValues);
                  }
                }}
              />
              <ScoreWheel
                label={activePickerMatch.awayTeam}
                value={pickerValues.away}
                onChange={(nextAway) => {
                  const nextValues =
                    pickerValues && activePickerMatch
                      ? { home: pickerValues.home, away: nextAway }
                      : null;
                  setPickerValues((current) => (current ? { ...current, away: nextAway } : current));
                  if (nextValues) {
                    queuePredictionSave(activePickerMatch, nextValues);
                  }
                }}
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Dialog open={Boolean(aiProposal)} onOpenChange={(open) => !open && setAiProposal(null)}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sugestão da IA</DialogTitle>
            <DialogDescription>
              {aiProposal
                ? `${aiProposal.match.homeTeam} x ${aiProposal.match.awayTeam}`
                : "Sugestão de palpite baseada no ranking local"}
            </DialogDescription>
          </DialogHeader>

          {aiProposal ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-semibold text-foreground">
                  {aiProposal.homeScore} x {aiProposal.awayScore}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {aiProposal.mode === "ranking" ? (
                  <p>
                    A sugestão considera o ranking FIFA local e também o seu padrão recente de palpites.
                  </p>
                ) : (
                  <p>
                    Aqui não teve leitura técnica: foi aleatorização controlada para te destravar.
                  </p>
                )}
                {aiProposal.reasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiProposal(null)}>
              Cancelar
            </Button>
            <Button onClick={applyAiProposal}>
              Usar sugestão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Bolao;
