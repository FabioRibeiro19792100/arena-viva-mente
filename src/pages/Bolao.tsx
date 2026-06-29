import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  consumeWorldCupEditCredit,
  filterMatchesByLeaderboardCycle,
  getWorldCupEditCreditSummary,
  getWorldCupLeaderboard,
  getWorldCupPredictions,
  saveWorldCupPrediction,
  scoreWorldCupPrediction,
  WorldCupCreditMutationError,
  type WorldCupCreditSummary,
  type WorldCupLeaderboardCycle,
  type WorldCupLeaderboardScope,
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
import { translateTeamLabel } from "@/lib/matchLabels";

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
      tendencyLabel: "Sem histórico seu ainda, a sugestão ficou no cenário mais seguro.",
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

  let tendencyLabel = "Seu histórico recente não puxou a sugestão para nenhum extremo.";
  if (avgGoals <= 2.1) {
    tendencyLabel = "Seus palpites costumam ser mais curtos, então a sugestão segurou os gols.";
  } else if (avgGoals >= 3.4) {
    tendencyLabel = "Seus palpites costumam abrir mais gols, então a sugestão soltou mais o jogo.";
  }

  return { avgGoals, drawRate, tendencyLabel };
};

const buildAiProposal = (
  match: WorldCupPoolMatch,
  existingPredictions: WorldCupPrediction[],
): AiProposal => {
  const homeTeamLabel = translateTeamLabel(match.homeTeam);
  const awayTeamLabel = translateTeamLabel(match.awayTeam);
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
      ? `${homeTeamLabel} está em ${homeRank}º e ${awayTeamLabel} em ${awayRank}º no ranking FIFA local de ${FIFA_RANKING_SNAPSHOT_DATE}.`
      : "Sem ranking local fechado para um dos lados, a sugestão ficou no cenário mais neutro.";

  const matchupReason =
    homeRank !== null && awayRank !== null
      ? Math.abs(rankGap) <= 4
        ? "A distância entre os dois é curta, então a leitura pede margem apertada."
        : rankGap > 0
          ? `${homeTeamLabel} chega acima no ranking e por isso a sugestão pende para esse lado.`
          : `${awayTeamLabel} chega acima no ranking e por isso a sugestão pende para esse lado.`
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
  const [leaderboards, setLeaderboards] = useState<
    Record<WorldCupLeaderboardCycle, Record<WorldCupLeaderboardScope, Awaited<ReturnType<typeof getWorldCupLeaderboard>>>>
  >({
    knockout: {
      general: [],
      brazil: [],
    },
    "group-stage-history": {
      general: [],
      brazil: [],
    },
  });
  const [creditSummary, setCreditSummary] = useState<WorldCupCreditSummary>({
    availableCredits: 0,
    exactHitCredits: 0,
    consumedCredits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [savedFeedbackMatchId, setSavedFeedbackMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"palpites" | "ranking">("palpites");
  const [activeLeaderboardCycle, setActiveLeaderboardCycle] = useState<WorldCupLeaderboardCycle>("knockout");
  const [activeRankingScope, setActiveRankingScope] = useState<WorldCupLeaderboardScope>("general");
  const [predictionView, setPredictionView] = useState<"deck" | "saved">("deck");
  const [activeDeckMatchId, setActiveDeckMatchId] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<{ matchId: string; mode: "deck" | "credit-edit" } | null>(null);
  const [pickerValues, setPickerValues] = useState<{ home: number; away: number } | null>(null);
  const [aiProposal, setAiProposal] = useState<AiProposal | null>(null);
  const [sessionEditableMatchIds, setSessionEditableMatchIds] = useState<string[]>([]);
  const savedFeedbackTimeoutRef = useRef<number | null>(null);
  const swipeTimeoutRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDraggingCard, setIsDraggingCard] = useState(false);

  const showSaveFeedback = (matchId: string) => {
    setSavedFeedbackMatchId(matchId);
    if (savedFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(savedFeedbackTimeoutRef.current);
    }
    savedFeedbackTimeoutRef.current = window.setTimeout(() => {
      setSavedFeedbackMatchId((current) => (current === matchId ? null : current));
    }, 1400);
  };

  const refreshMetaState = useCallback(async (
    resolvedMatches: WorldCupPoolMatch[],
    nextPredictions: WorldCupPrediction[],
  ) => {
    if (!user) return;

    const knockoutMatches = filterMatchesByLeaderboardCycle(resolvedMatches, "knockout");
    const [knockoutGeneralLeaderboard, knockoutBrazilLeaderboard, historicalGeneralLeaderboard, historicalBrazilLeaderboard, nextCredits] = await Promise.all([
      getWorldCupLeaderboard(resolvedMatches, user, "general", "knockout"),
      getWorldCupLeaderboard(resolvedMatches, user, "brazil", "knockout"),
      getWorldCupLeaderboard(resolvedMatches, user, "general", "group-stage-history"),
      getWorldCupLeaderboard(resolvedMatches, user, "brazil", "group-stage-history"),
      getWorldCupEditCreditSummary(user.id, knockoutMatches, nextPredictions),
    ]);

    setLeaderboards({
      knockout: {
        general: knockoutGeneralLeaderboard,
        brazil: knockoutBrazilLeaderboard,
      },
      "group-stage-history": {
        general: historicalGeneralLeaderboard,
        brazil: historicalBrazilLeaderboard,
      },
    });
    setCreditSummary(nextCredits);
  }, [user]);

  const loadBolaoData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const resolvedMatches = await fetchWorldCupPoolMatches();
      const nextPredictions = await getWorldCupPredictions(user.id, resolvedMatches);

      setMatches(resolvedMatches);
      setPredictions(nextPredictions);
      setFormValues(toInitialValues(nextPredictions));
      setSessionEditableMatchIds([]);
      await refreshMetaState(resolvedMatches, nextPredictions);
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshMetaState]);

  useEffect(() => {
    if (!user) return;
    void loadBolaoData();
  }, [user, loadBolaoData]);

  useEffect(
    () => () => {
      if (savedFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(savedFeedbackTimeoutRef.current);
      }
      if (swipeTimeoutRef.current !== null) {
        window.clearTimeout(swipeTimeoutRef.current);
      }
    },
    [],
  );

  const predictionsByMatchId = useMemo(
    () =>
      predictions.reduce<Record<string, WorldCupPrediction>>((acc, prediction) => {
        acc[prediction.matchId] = prediction;
        return acc;
      }, {}),
    [predictions],
  );

  const sessionEditableSet = useMemo(
    () => new Set(sessionEditableMatchIds),
    [sessionEditableMatchIds],
  );

  const knockoutMatches = useMemo(
    () => filterMatchesByLeaderboardCycle(matches, "knockout"),
    [matches],
  );

  const deckMatches = useMemo(
    () =>
      knockoutMatches
        .filter((match) => getCurrentMatchStatus(match) === "scheduled")
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [knockoutMatches],
  );

  const pendingMatches = useMemo(
    () => deckMatches.filter((match) => !predictionsByMatchId[match.id]),
    [deckMatches, predictionsByMatchId],
  );

  const completedDeckCount = useMemo(
    () => deckMatches.filter((match) => Boolean(predictionsByMatchId[match.id])).length,
    [deckMatches, predictionsByMatchId],
  );

  const savedMatches = useMemo(
    () =>
      knockoutMatches
        .filter((match) => Boolean(predictionsByMatchId[match.id]))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [knockoutMatches, predictionsByMatchId],
  );

  useEffect(() => {
    if (deckMatches.length === 0) return;

    const currentStillExists = activeDeckMatchId && deckMatches.some((match) => match.id === activeDeckMatchId);
    if (currentStillExists) return;

    const firstPendingMatch = deckMatches.find((match) => !predictionsByMatchId[match.id]);
    setActiveDeckMatchId(firstPendingMatch?.id || null);
  }, [activeDeckMatchId, deckMatches, predictionsByMatchId]);

  const activeDeckIndex = useMemo(
    () => deckMatches.findIndex((match) => match.id === activeDeckMatchId),
    [activeDeckMatchId, deckMatches],
  );

  const activeDeckMatch =
    (activeDeckMatchId ? deckMatches.find((match) => match.id === activeDeckMatchId) : null) || null;

  const activePickerMatch = useMemo(
    () => knockoutMatches.find((match) => match.id === activePicker?.matchId) || null,
    [activePicker, knockoutMatches],
  );

  const currentLeaderboard = leaderboards[activeLeaderboardCycle][activeRankingScope];
  const isMobilePredictionDeck = isMobile && activeTab === "palpites" && predictionView === "deck";

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

  const markSessionEditable = (matchId: string) => {
    setSessionEditableMatchIds((current) => (current.includes(matchId) ? current : [...current, matchId]));
  };

  const saveDeckPrediction = async (match: WorldCupPoolMatch, values: { home: number; away: number }) => {
    if (!user) return;

    applySavedPredictionLocally(match.id, values.home, values.away);
    markSessionEditable(match.id);
    setSavingMatchId(match.id);
    try {
      await saveWorldCupPrediction(
        user.id,
        match.id,
        values.home,
        values.away,
      );
      showSaveFeedback(match.id);
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

  const savePredictionWithCredit = async (match: WorldCupPoolMatch, values: { home: number; away: number }) => {
    if (!user) return;

    const currentPrediction = predictionsByMatchId[match.id];
    if (!currentPrediction) return;

    setSavingMatchId(match.id);
    try {
      const nextSummary = await consumeWorldCupEditCredit(
        user.id,
        match,
        values,
        knockoutMatches,
        currentPrediction,
      );

      applySavedPredictionLocally(match.id, values.home, values.away);
      setCreditSummary(nextSummary);
      setLeaderboards((current) => ({
        ...current,
        knockout: {
          general: current.knockout.general.map((entry) =>
            entry.userId === user.id
              ? { ...entry, editCreditsAvailable: nextSummary.availableCredits }
              : entry,
          ),
          brazil: current.knockout.brazil.map((entry) =>
            entry.userId === user.id
              ? { ...entry, editCreditsAvailable: nextSummary.availableCredits }
              : entry,
          ),
        },
      }));
      showSaveFeedback(match.id);
    } catch (error) {
      if (error instanceof WorldCupCreditMutationError) {
        if (error.code !== "UNCHANGED") {
          toast({
            title: "Não foi possível editar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Não foi possível editar",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setSavingMatchId(null);
    }
  };

  const openScorePicker = (match: WorldCupPoolMatch, mode: "deck" | "credit-edit") => {
    const currentValues = formValues[match.id];
    const savedPrediction = predictionsByMatchId[match.id];
    setActivePicker({ matchId: match.id, mode });
    setPickerValues({
      home: Number(currentValues?.home ?? savedPrediction?.predictedHomeScore ?? 0),
      away: Number(currentValues?.away ?? savedPrediction?.predictedAwayScore ?? 0),
    });
  };

  const applyAiProposal = async () => {
    if (!aiProposal || !user) return;
    const nextValues = {
      home: aiProposal.homeScore,
      away: aiProposal.awayScore,
    };
    await saveDeckPrediction(aiProposal.match, nextValues);
    setAiProposal(null);
  };

  const applyRandomProposal = async (match: WorldCupPoolMatch) => {
    if (!user) return;
    const randomProposal = buildRandomProposal(match);
    await saveDeckPrediction(match, {
      home: randomProposal.homeScore,
      away: randomProposal.awayScore,
    });
  };

  const goToPreviousDeckMatch = () => {
    if (activeDeckIndex <= 0) return;
    setActiveDeckMatchId(deckMatches[activeDeckIndex - 1]?.id || null);
  };

  const canAdvanceFromCurrentDeckMatch = () => {
    if (!activeDeckMatch) return false;
    return Boolean(predictionsByMatchId[activeDeckMatch.id]);
  };

  const attemptAdvanceDeck = () => {
    if (!activeDeckMatch) return;
    if (!canAdvanceFromCurrentDeckMatch()) {
      toast({
        title: "Palpite pendente",
        description: "Você precisa registrar o placar deste jogo antes de avançar.",
        variant: "destructive",
      });
      return;
    }
    if (activeDeckIndex >= deckMatches.length - 1) return;
    setActiveDeckMatchId(deckMatches[activeDeckIndex + 1]?.id || null);
  };

  const commitPickerValues = async () => {
    if (!activePickerMatch || !pickerValues || !activePicker) return;

    if (activePicker.mode === "deck") {
      await saveDeckPrediction(activePickerMatch, pickerValues);
    } else {
      await savePredictionWithCredit(activePickerMatch, pickerValues);
    }

    setActivePicker(null);
  };

  const getSavedEditState = (match: WorldCupPoolMatch) => {
    if (getCurrentMatchStatus(match) !== "scheduled") {
      return {
        canEdit: false,
        label: "Bloqueado",
        helper: "Este jogo já começou e não pode mais ser alterado.",
      };
    }

    if (creditSummary.availableCredits <= 0) {
      return {
        canEdit: false,
        label: "Sem créditos",
        helper: "Você não possui créditos de edição disponíveis.",
      };
    }

    return {
      canEdit: true,
      label: "Editar com 1 crédito",
      helper: "Use 1 crédito para alterar este palpite futuro.",
    };
  };

  const renderPredictionCard = (match: WorldCupPoolMatch) => {
    const homeTeamLabel = translateTeamLabel(match.homeTeam);
    const awayTeamLabel = translateTeamLabel(match.awayTeam);
    const currentStatus = getCurrentMatchStatus(match);
    const savedPrediction = predictionsByMatchId[match.id];
    const points = scoreWorldCupPrediction(match, savedPrediction);
    const predictionFeedback = getPredictionFeedback(points);
    const values = formValues[match.id] || { home: "", away: "" };
    const isLocked = currentStatus !== "scheduled";
    const isSessionEditable = sessionEditableSet.has(match.id);
    const isDeckEditable = !savedPrediction || isSessionEditable;
    const showOfficialScore = hasOfficialScore(match);
    const isMobileDeck = isMobile && predictionView === "deck";
    const isDesktopDeck = !isMobile && predictionView === "deck";
    const displayHomeValue =
      values.home !== "" ? values.home : savedPrediction ? String(savedPrediction.predictedHomeScore) : "--";
    const displayAwayValue =
      values.away !== "" ? values.away : savedPrediction ? String(savedPrediction.predictedAwayScore) : "--";

    if (isMobileDeck) {
      return (
        <div className="mx-auto grid h-[410px] w-full max-w-[360px] grid-rows-[44px_1fr_118px]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <span>{match.stage}</span>
              <span>•</span>
              <span>{formatBrasiliaTime(match.startTime)}</span>
              {points !== null ? (
                <>
                  <span>•</span>
                  <span className="text-foreground">{points} pts</span>
                </>
              ) : null}
            </div>
            <div className="mt-2 h-4 text-xs font-medium text-muted-foreground">
              {currentStatus !== "scheduled" ? statusLabelByMatchStatus(currentStatus) : null}
            </div>
          </div>

          <div className="flex items-start justify-center pt-6">
            <div className="grid w-full grid-cols-[minmax(0,1fr)_108px_minmax(0,1fr)] items-center gap-2 px-1">
              <div className="flex min-w-0 flex-col items-center text-center">
                <TeamMark
                  src={match.homeTeamLogo}
                  alt={homeTeamLabel}
                  defined
                  imageClassName="h-14 w-auto max-w-[76px] object-contain drop-shadow-sm"
                />
                <p className="mt-3 flex h-[44px] max-w-[92px] items-start justify-center text-center text-[0.9rem] font-semibold leading-tight text-foreground break-words">
                  {homeTeamLabel}
                </p>
              </div>

              <div className="flex min-w-0 flex-col items-center justify-start text-center">
                {isLocked && showOfficialScore ? (
                  <>
                    <div className="whitespace-nowrap text-[2.3rem] font-semibold tracking-[0.02em] text-foreground">
                      {match.homeScore} - {match.awayScore}
                    </div>
                    <div className="mt-2 text-sm font-medium text-muted-foreground">Placar oficial</div>
                    <div className="mt-3 min-h-10">
                      {savedPrediction ? (
                        <div className={`text-xs font-medium ${predictionFeedback.className}`}>
                          <div>
                            Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                          </div>
                          <div className="mt-1">
                            {predictionFeedback.label}
                            {points !== null ? ` • ${points} pontos` : ""}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : isDeckEditable ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openScorePicker(match, "deck")}
                      className="px-0 py-2"
                    >
                      <div className="whitespace-nowrap text-[2.45rem] font-semibold tracking-[0.02em] text-foreground">
                        {displayHomeValue} - {displayAwayValue}
                      </div>
                      <div className="mt-2 text-xs font-medium leading-tight text-muted-foreground">
                        {savingMatchId === match.id
                          ? "Salvando..."
                          : savedFeedbackMatchId === match.id
                            ? "Salvo"
                            : "Toque para escolher"}
                      </div>
                    </button>
                    <div className="mt-3 min-h-10">
                      {savedPrediction ? (
                        <div className={`text-xs font-medium ${predictionFeedback.className}`}>
                          Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="whitespace-nowrap text-[2.45rem] font-semibold tracking-[0.02em] text-foreground">
                      {displayHomeValue} - {displayAwayValue}
                    </div>
                    <div className="mt-3 min-h-10 space-y-1 text-xs font-medium text-muted-foreground">
                      <div>Seu palpite: {savedPrediction?.predictedHomeScore} x {savedPrediction?.predictedAwayScore}</div>
                      <div>Palpite travado nesta sessão.</div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex min-w-0 flex-col items-center text-center">
                <TeamMark
                  src={match.awayTeamLogo}
                  alt={awayTeamLabel}
                  defined
                  imageClassName="h-14 w-auto max-w-[76px] object-contain drop-shadow-sm"
                />
                <p className="mt-3 flex h-[44px] max-w-[92px] items-start justify-center text-center text-[0.9rem] font-semibold leading-tight text-foreground break-words">
                  {awayTeamLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8 pb-2">
            {!isLocked && isDeckEditable ? (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAiProposal(buildAiProposal(match, predictions))}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-muted/25 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  >
                    IA, qual seu palpite?
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => applyRandomProposal(match)}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-muted/25 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  >
                    Mete o louco(a)
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (isDesktopDeck) {
      return (
        <div className="w-full space-y-8 border-y border-border/70 py-8">
          <div className="flex items-start justify-end gap-4">
            <div className="flex items-center gap-3 text-sm">
              {currentStatus !== "scheduled" ? (
                <span className="font-medium text-muted-foreground">
                  {statusLabelByMatchStatus(currentStatus)}
                </span>
              ) : null}
              {points !== null ? <span className="font-medium text-foreground">{points} pts</span> : null}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-8">
              <div className="flex flex-col items-center text-center">
                <TeamMark
                  src={match.homeTeamLogo}
                  alt={homeTeamLabel}
                  defined
                  imageClassName="h-24 w-auto max-w-[128px] object-contain drop-shadow-sm"
                />
                <p className="mt-4 text-xl font-semibold text-foreground">{homeTeamLabel}</p>
              </div>

              <div className="min-w-[180px] text-center">
                {isLocked && showOfficialScore ? (
                  <div className="space-y-3">
                    <div className="text-4xl font-semibold tracking-[0.08em] text-foreground">
                      {match.homeScore} - {match.awayScore}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Placar oficial</div>
                    {savedPrediction ? (
                      <div className={`space-y-1 text-sm font-medium ${predictionFeedback.className}`}>
                        <div>
                          Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                        </div>
                        <div>
                          {predictionFeedback.label}
                          {points !== null ? ` • ${points} pontos` : ""}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : isDeckEditable ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => openScorePicker(match, "deck")}
                      className="rounded-2xl border border-border/80 bg-background px-5 py-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="text-4xl font-semibold tracking-[0.08em] text-foreground">
                        {displayHomeValue} - {displayAwayValue}
                      </div>
                      <div className="mt-2 text-sm font-medium text-muted-foreground">
                        {savingMatchId === match.id
                          ? "Salvando..."
                          : savedFeedbackMatchId === match.id
                            ? "Salvo"
                            : "Toque para escolher"}
                      </div>
                    </button>
                    {savedPrediction ? (
                      <div className={`text-sm font-medium ${predictionFeedback.className}`}>
                        Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-4xl font-semibold tracking-[0.08em] text-foreground">
                      {displayHomeValue} - {displayAwayValue}
                    </div>
                    <div className="space-y-1 text-sm font-medium text-muted-foreground">
                      <div>Seu palpite: {savedPrediction?.predictedHomeScore} x {savedPrediction?.predictedAwayScore}</div>
                      <div>Palpite travado nesta sessão.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center text-center">
                <TeamMark
                  src={match.awayTeamLogo}
                  alt={awayTeamLabel}
                  defined
                  imageClassName="h-24 w-auto max-w-[128px] object-contain drop-shadow-sm"
                />
                <p className="mt-4 text-xl font-semibold text-foreground">{awayTeamLabel}</p>
              </div>
            </div>

            {!isLocked && isDeckEditable ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setAiProposal(buildAiProposal(match, predictions))}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/25 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>IA, qual seu palpite?</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyRandomProposal(match)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/25 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Mete o louco(a)</span>
                </button>
              </div>
            ) : null}

          <div className="mx-auto flex max-w-sm items-center justify-center">
            <MatchCountriesMap
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeTeamLogo={match.homeTeamLogo}
              awayTeamLogo={match.awayTeamLogo}
              showLegend
            />
          </div>
        </div>
      );
    }

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
        league={isMobileDeck ? match.stage : match.league}
        meta={isMobileDeck ? formatBrasiliaTime(match.startTime) : `${match.date} • ${formatBrasiliaTime(match.startTime)}`}
        homeTeam={homeTeamLabel}
        awayTeam={awayTeamLabel}
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
          ) : isDeckEditable ? (
            <div className="space-y-2 text-center">
              <button
                type="button"
                onClick={() => openScorePicker(match, "deck")}
                className={`transition-colors ${isMobileDeck ? "px-0 py-2" : "rounded-2xl border border-border/80 bg-background px-4 py-3 hover:bg-muted/30"}`}
              >
                <div className={`${isMobileDeck ? "text-5xl" : "text-xl"} font-semibold tracking-[0.12em] text-foreground`}>
                  {displayHomeValue} - {displayAwayValue}
                </div>
                <div className={`mt-1 font-medium text-muted-foreground ${isMobileDeck ? "text-sm" : "text-xs"}`}>
                  {savingMatchId === match.id
                    ? "Salvando..."
                    : savedFeedbackMatchId === match.id
                      ? "Salvo"
                      : "Toque para escolher"}
                </div>
              </button>
              {savedPrediction ? (
                <div className={`text-xs font-medium ${predictionFeedback.className}`}>
                  Seu palpite: {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <div className={`${isMobileDeck ? "text-4xl" : "text-xl"} font-semibold tracking-[0.12em] text-foreground`}>
                {displayHomeValue} - {displayAwayValue}
              </div>
              <div className="space-y-1 text-xs font-medium text-muted-foreground">
                <div>Seu palpite: {savedPrediction?.predictedHomeScore} x {savedPrediction?.predictedAwayScore}</div>
                <div>Palpite travado nesta sessão.</div>
              </div>
            </div>
          )
        }
        bottomContent={
          <div className={`space-y-3 ${isMobileDeck ? "pt-2" : ""}`}>
            {!isLocked && isDeckEditable ? (
              <div className={isMobileDeck ? "grid grid-cols-2 gap-3" : "space-y-2"}>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAiProposal(buildAiProposal(match, predictions))}
                    className={`inline-flex items-center justify-center gap-2 border border-border/70 bg-muted/25 font-medium text-foreground transition-colors hover:bg-muted/40 ${
                      isMobileDeck ? "min-h-12 w-full rounded-2xl px-3 py-3 text-sm" : "rounded-full px-4 py-2 text-sm"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>IA, qual seu palpite?</span>
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => applyRandomProposal(match)}
                    className={`inline-flex items-center justify-center gap-2 border border-border/70 bg-muted/25 font-medium text-foreground transition-colors hover:bg-muted/40 ${
                      isMobileDeck ? "min-h-12 w-full rounded-2xl px-3 py-3 text-sm" : "rounded-full px-4 py-2 text-sm"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Mete o louco(a)</span>
                  </button>
                </div>
              </div>
            ) : null}

            {!isMobileDeck ? (
              <MatchCountriesMap
                homeTeam={homeTeamLabel}
                awayTeam={awayTeamLabel}
                homeTeamLogo={match.homeTeamLogo}
                awayTeamLogo={match.awayTeamLogo}
                showLegend
              />
            ) : null}
          </div>
        }
      />
    );
  };

  const renderSavedPredictionRow = (match: WorldCupPoolMatch) => {
    const homeTeamLabel = translateTeamLabel(match.homeTeam);
    const awayTeamLabel = translateTeamLabel(match.awayTeam);
    const savedPrediction = predictionsByMatchId[match.id];
    if (!savedPrediction) return null;

    const points = scoreWorldCupPrediction(match, savedPrediction);
    const predictionFeedback = getPredictionFeedback(points);
    const editState = getSavedEditState(match);
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
              alt={homeTeamLabel}
              defined
              imageClassName="h-6 w-auto max-w-[28px] object-contain"
            />
          </div>
          <span className="truncate text-sm font-medium text-foreground">{homeTeamLabel}</span>
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
          <div className="min-w-0 flex-1 text-right">
            <span className="block truncate text-sm font-medium text-foreground">{awayTeamLabel}</span>
            {editState.canEdit ? (
              <button
                type="button"
                onClick={() => openScorePicker(match, "credit-edit")}
                className="mt-1 text-[11px] font-medium text-foreground underline underline-offset-4"
              >
                Editar
              </button>
            ) : getCurrentMatchStatus(match) !== "scheduled" ? (
              <span className="mt-1 block text-[11px] font-medium text-muted-foreground">Jogo iniciado</span>
            ) : null}
          </div>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm">
            <TeamMark
              src={match.awayTeamLogo}
              alt={awayTeamLabel}
              defined
              imageClassName="h-6 w-auto max-w-[28px] object-contain"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSavedPredictionDesktopRow = (match: WorldCupPoolMatch) => {
    const homeTeamLabel = translateTeamLabel(match.homeTeam);
    const awayTeamLabel = translateTeamLabel(match.awayTeam);
    const savedPrediction = predictionsByMatchId[match.id];
    if (!savedPrediction) return null;

    const points = scoreWorldCupPrediction(match, savedPrediction);
    const predictionFeedback = getPredictionFeedback(points);
    const editState = getSavedEditState(match);
    const officialScore = hasOfficialScore(match) ? `${match.homeScore} x ${match.awayScore}` : "—";

    return (
      <div
        key={match.id}
        className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px_140px] items-center gap-4 border-b border-border/60 px-4 py-4"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {homeTeamLabel} x {awayTeamLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {match.date} • {formatBrasiliaTime(match.startTime)} • {match.stage}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {savedPrediction.predictedHomeScore} x {savedPrediction.predictedAwayScore}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{officialScore}</p>
        </div>
        <div className="text-center">
          <p className={`text-xs font-medium ${predictionFeedback.className}`}>
            {predictionFeedback.label}
          </p>
        </div>
        <div className="text-right">
          {editState.canEdit ? (
            <button
              type="button"
              onClick={() => openScorePicker(match, "credit-edit")}
              className="text-xs font-medium text-foreground underline underline-offset-4"
            >
              Editar
            </button>
          ) : getCurrentMatchStatus(match) !== "scheduled" ? (
            <span className="text-xs font-medium text-muted-foreground">Jogo iniciado</span>
          ) : null}
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground ${isMobilePredictionDeck ? "h-[100svh] overflow-hidden" : ""}`}>
      <Header />

      <section className={`flex-1 ${isMobilePredictionDeck ? "overflow-hidden py-0" : "py-4 md:py-8"}`}>
        <div className={`container ${isMobilePredictionDeck ? "px-4" : "px-6"} ${isMobilePredictionDeck ? "flex h-full min-h-0 flex-col" : ""}`}>
          {!isMobile ? (
            <div className="mb-4 flex items-start justify-between gap-6 md:mb-6">
              <h1 className="text-2xl font-semibold text-foreground md:text-4xl">
                Bolão
              </h1>
              <div className="flex items-center gap-4 pt-2 text-sm">
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
            </div>
          ) : null}

          <div className={`${isMobilePredictionDeck ? "mx-auto flex h-full min-h-0 w-full max-w-[420px] flex-1 flex-col" : "mb-4 space-y-4 md:mb-6 md:space-y-5"}`}>
            <div className={`flex gap-4 text-sm ${isMobilePredictionDeck ? "shrink-0 items-center justify-center py-4 text-center" : "hidden"}`}>
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
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveLeaderboardCycle("knockout")}
                  className={`underline underline-offset-4 transition-colors ${
                    activeLeaderboardCycle === "knockout" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Eliminatória
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeaderboardCycle("group-stage-history")}
                  className={`underline underline-offset-4 transition-colors ${
                    activeLeaderboardCycle === "group-stage-history" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Grupos encerrados
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveRankingScope("general")}
                  className={`underline underline-offset-4 transition-colors ${
                    activeRankingScope === "general" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Geral
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRankingScope("brazil")}
                  className={`underline underline-offset-4 transition-colors ${
                    activeRankingScope === "brazil" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Brasil
                </button>
              </div>
              <Card className="border-border/80 shadow-[var(--shadow-card)]">
                <CardContent className="space-y-5 p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Classificação</h2>
                    <p className="text-sm text-muted-foreground">
                      {activeLeaderboardCycle === "knockout"
                        ? "Novo ranking valendo da fase eliminatória em diante."
                        : "Ranking encerrado da fase de grupos, mantido só para consulta."}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {currentLeaderboard.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ainda não há pontuação fechada.</p>
                    ) : (
                      currentLeaderboard.slice(0, 12).map((entry, index) => (
                        <div
                          key={entry.userId}
                          className={`flex items-center gap-3 border px-3 py-3 ${
                            entry.userId === user?.id
                              ? "border-foreground/70 bg-muted/25"
                              : "border-border/70"
                          }`}
                        >
                          <span className="w-5 text-sm font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
                            <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {entry.name} ⭐ {entry.editCreditsAvailable}
                              {entry.userId === user?.id ? " • Você" : ""}
                            </p>
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
              <div className={`${isMobilePredictionDeck ? "grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto]" : "space-y-8"}`}>
              <div className={`flex gap-3 ${isMobilePredictionDeck ? "shrink-0 items-center justify-center py-2 text-center" : "items-center justify-end"}`}>
                {predictionView === "deck" ? (
                  isMobilePredictionDeck ? (
                    <span className="text-sm font-medium text-foreground">
                      {pendingMatches.length === 0
                        ? "Nenhum jogo faltando"
                        : `${pendingMatches.length} ${pendingMatches.length === 1 ? "jogo" : "jogos"} faltando`}
                      {deckMatches.length > 0 ? ` • ${completedDeckCount}/${deckMatches.length}` : ""}
                    </span>
                  ) : <span />
                ) : (
                  isMobilePredictionDeck ? (
                    <span />
                  ) : <span />
                )}
                {predictionView === "saved" ? (
                  <button
                    type="button"
                    onClick={() => setPredictionView("deck")}
                    className={`text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground ${isMobilePredictionDeck ? "self-center" : ""}`}
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
              ) : knockoutMatches.length === 0 ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="space-y-2 p-8">
                    <p className="text-sm font-medium text-foreground">
                      Os jogos da eliminatória ainda não apareceram na base.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Assim que a agenda da fase final estiver pronta no ambiente e o sync rodar, ela entra aqui.
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
                  <section className={`${isMobilePredictionDeck ? "grid min-h-0 grid-rows-[430px_32px] justify-items-center text-center" : "space-y-4 md:space-y-5"}`}>
                    {!isMobile && (
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                          {pendingMatches.length === 0 ? "Todos os palpites foram preenchidos" : `${activeDeckIndex + 1} de ${deckMatches.length}`}
                        </h2>
                      </div>
                    )}

                    <div
                      className={isMobilePredictionDeck ? "flex h-[430px] w-full items-start justify-center overflow-hidden" : isMobile ? "flex h-[calc(100svh-232px)] min-h-[540px] flex-col overflow-hidden" : ""}
                      onTouchStart={(event) => {
                        touchStartXRef.current = event.touches[0]?.clientX ?? null;
                        touchDeltaXRef.current = 0;
                        setIsDraggingCard(true);
                      }}
                      onTouchMove={(event) => {
                        if (touchStartXRef.current === null) return;
                        touchDeltaXRef.current = (event.touches[0]?.clientX ?? 0) - touchStartXRef.current;
                        setDragOffsetX(touchDeltaXRef.current);
                      }}
                      onTouchEnd={() => {
                        if (!isMobile) return;
                        const delta = touchDeltaXRef.current;

                        if (delta <= -48 && activeDeckIndex < deckMatches.length - 1) {
                          if (!canAdvanceFromCurrentDeckMatch()) {
                            toast({
                              title: "Palpite pendente",
                              description: "Você precisa registrar o placar deste jogo antes de avançar.",
                              variant: "destructive",
                            });
                            setIsDraggingCard(false);
                            setDragOffsetX(0);
                            touchStartXRef.current = null;
                            touchDeltaXRef.current = 0;
                            return;
                          }
                          setDragOffsetX(-window.innerWidth * 0.95);
                          setIsDraggingCard(false);
                          swipeTimeoutRef.current = window.setTimeout(() => {
                            attemptAdvanceDeck();
                            setDragOffsetX(0);
                          }, 170);
                        } else if (delta >= 48 && activeDeckIndex > 0) {
                          setDragOffsetX(window.innerWidth * 0.95);
                          setIsDraggingCard(false);
                          swipeTimeoutRef.current = window.setTimeout(() => {
                            goToPreviousDeckMatch();
                            setDragOffsetX(0);
                          }, 170);
                        } else {
                          setIsDraggingCard(false);
                          setDragOffsetX(0);
                        }
                        touchStartXRef.current = null;
                        touchDeltaXRef.current = 0;
                      }}
                      >
                      <div
                        className={isMobilePredictionDeck ? "flex h-full w-full items-start justify-center pt-2" : isMobile ? "flex-1" : ""}
                        style={
                          isMobile
                            ? {
                                transform: `translateX(${dragOffsetX}px) rotate(${dragOffsetX / 28}deg)`,
                                opacity: Math.max(0.45, 1 - Math.abs(dragOffsetX) / 420),
                                transition: isDraggingCard ? "none" : "transform 180ms ease, opacity 180ms ease",
                              }
                            : undefined
                        }
                      >
                        {renderPredictionCard(activeDeckMatch)}
                      </div>
                    </div>

                    {isMobile ? (
                      <div className={`${isMobilePredictionDeck ? "flex h-8 items-end justify-center px-4 pb-[max(2px,env(safe-area-inset-bottom))]" : "pb-2"} text-center text-xs font-medium text-muted-foreground`}>
                        Deslize para o lado para ver o proximo jogo
                      </div>
                    ) : null}

                    <div className="hidden items-center justify-between gap-3 pt-2 md:flex">
                      <Button
                        variant="outline"
                        onClick={goToPreviousDeckMatch}
                        disabled={activeDeckIndex === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={attemptAdvanceDeck}
                        disabled={activeDeckIndex >= deckMatches.length - 1}
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
                  <div className="overflow-hidden border border-border/70 bg-card shadow-[var(--shadow-card)]">
                    <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px_140px] gap-4 border-b border-border/70 px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      <span>Jogo</span>
                      <span className="text-center">Palpite</span>
                      <span className="text-center">Oficial</span>
                      <span className="text-center">Status</span>
                      <span className="text-right">Edição</span>
                    </div>
                    <div>
                      {savedMatches.map((match) => renderSavedPredictionDesktopRow(match))}
                    </div>
                  </div>
                ))
              )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Drawer open={Boolean(activePickerMatch)} onOpenChange={(open) => !open && setActivePicker(null)}>
        <DrawerContent className="border-border bg-card">
          <DrawerHeader>
            <DrawerTitle>
              {activePickerMatch ? `${translateTeamLabel(activePickerMatch.homeTeam)} x ${translateTeamLabel(activePickerMatch.awayTeam)}` : "Escolher placar"}
            </DrawerTitle>
            <DrawerDescription>Deslize para cima ou para baixo e toque em OK para confirmar.</DrawerDescription>
          </DrawerHeader>

          {activePickerMatch && pickerValues && (
            <div className="grid grid-cols-2 gap-6 px-6 pb-8 pt-2">
              <ScoreWheel
                label={translateTeamLabel(activePickerMatch.homeTeam)}
                value={pickerValues.home}
                onChange={(nextHome) => {
                  setPickerValues((current) => (current ? { ...current, home: nextHome } : current));
                }}
              />
              <ScoreWheel
                label={translateTeamLabel(activePickerMatch.awayTeam)}
                value={pickerValues.away}
                onChange={(nextAway) => {
                  setPickerValues((current) => (current ? { ...current, away: nextAway } : current));
                }}
              />
            </div>
          )}
          <div className="px-6 pb-8">
            <Button className="w-full" onClick={commitPickerValues}>
              OK
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={Boolean(aiProposal)} onOpenChange={(open) => !open && setAiProposal(null)}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sugestão da IA</DialogTitle>
            <DialogDescription>
              {aiProposal
                ? `${translateTeamLabel(aiProposal.match.homeTeam)} x ${translateTeamLabel(aiProposal.match.awayTeam)}`
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

      {!isMobilePredictionDeck ? <Footer /> : null}
    </div>
  );
};

export default Bolao;
