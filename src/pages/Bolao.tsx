import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { fetchMatchesFeed, type DisplayMatch } from "@/lib/matchesApi";
import { isApiSportsMediaUrl, toProxiedAssetUrl } from "@/lib/media";
import { useToast } from "@/hooks/use-toast";

const toInitialValues = (predictions: WorldCupPrediction[]) =>
  predictions.reduce<Record<string, { home: string; away: string }>>((acc, prediction) => {
    acc[prediction.matchId] = {
      home: String(prediction.predictedHomeScore),
      away: String(prediction.predictedAwayScore),
    };
    return acc;
  }, {});

const normalizeLabel = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isApiWorldCupMatch = (match: DisplayMatch) => {
  const league = normalizeLabel(match.league).replace(/\s+/g, " ").trim();
  return match.apiSource === "football" && (league === "world cup" || league === "copa do mundo");
};

const TeamMark = ({ name, logo }: { name: string; logo: string }) => {
  const [currentSrc, setCurrentSrc] = useState(() => toProxiedAssetUrl(logo));

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border/70 sm:h-14 sm:w-14">
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              if (isApiSportsMediaUrl(logo) && currentSrc !== logo) {
                setCurrentSrc(logo);
                return;
              }
              setCurrentSrc("");
            }}
          />
        ) : (
          <span className="text-sm font-semibold text-foreground">{name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
    </div>
  );
};

const statusLabelByMatchStatus = (status: ReturnType<typeof getCurrentMatchStatus>) => {
  if (status === "live") return "Jogo ao vivo";
  if (status === "ended") return "Encerrado";
  return "Palpite aberto";
};

const Bolao = () => {
  const { user } = useMockAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<WorldCupMatch[]>([]);
  const [predictions, setPredictions] = useState<WorldCupPrediction[]>([]);
  const [formValues, setFormValues] = useState<Record<string, { home: string; away: string }>>({});
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof getWorldCupLeaderboard>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"palpites" | "ranking">("palpites");

  const loadBolaoData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const feed = await fetchMatchesFeed({
        sport: "futebol",
        quick: "all",
        search: "",
        league: "World Cup",
        includePast: true,
      });
      const resolvedMatches = [...feed.todayMatches, ...feed.matches].filter(
        isApiWorldCupMatch,
      ) as WorldCupMatch[];
      const [nextPredictions, nextLeaderboard] = await Promise.all([
        getWorldCupPredictions(user.id),
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

  const groupedMatches = useMemo(
    () =>
      Array.from(
        matches.reduce((groups, match) => {
          const list = groups.get(match.stage) || [];
          list.push(match);
          groups.set(match.stage, list);
          return groups;
        }, new Map<string, WorldCupMatch[]>()),
      ),
    [matches],
  );

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

  const handleFieldChange = (matchId: string, side: "home" | "away", value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setFormValues((current) => ({
      ...current,
      [matchId]: {
        home: side === "home" ? value : current[matchId]?.home || "",
        away: side === "away" ? value : current[matchId]?.away || "",
      },
    }));
  };

  const handleSavePrediction = async (match: WorldCupMatch) => {
    if (!user) return;
    const values = formValues[match.id];
    if (!values?.home?.trim() || !values?.away?.trim()) {
      toast({
        title: "Placar incompleto",
        description: "Preencha os dois lados do placar antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setSavingMatchId(match.id);
    try {
      await saveWorldCupPrediction(user.id, match.id, Number(values.home), Number(values.away));
      await loadBolaoData();
      toast({
        title: "Palpite salvo",
        description: `${match.homeTeam} x ${match.awayTeam} entrou no seu bolão.`,
      });
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
              Bolão da Copa
            </h1>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Regras: 5 pontos no placar exato, 3 pontos no resultado e 0 pontos quando não acertar.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "palpites" | "ranking")}
            className="mb-10 space-y-6"
          >
            <TabsList className="grid w-full max-w-[320px] grid-cols-2">
              <TabsTrigger value="palpites">Palpites</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="space-y-6">
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
            </TabsContent>

            <TabsContent value="palpites" className="space-y-8">
              {isLoading ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="p-8 text-sm text-muted-foreground">
                    Carregando bolão da Copa...
                  </CardContent>
                </Card>
              ) : matches.length === 0 ? (
                <Card className="border-border/80 shadow-[var(--shadow-card)]">
                  <CardContent className="space-y-2 p-8">
                    <p className="text-sm font-medium text-foreground">
                      Ainda não encontrei jogos da Copa vindos da API.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      O bolão agora depende só do feed persistido da API. Sincronize a agenda para a Copa entrar aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                groupedMatches.map(([stage, stageMatches]) => (
                  <section key={stage} className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold text-foreground">{stage}</h2>
                      <p className="text-sm text-muted-foreground">
                        {stageMatches.length} {stageMatches.length === 1 ? "jogo" : "jogos"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {stageMatches.map((match) => {
                        const currentStatus = getCurrentMatchStatus(match);
                        const savedPrediction = predictionsByMatchId[match.id];
                        const points = scoreWorldCupPrediction(match, savedPrediction);
                        const values = formValues[match.id] || { home: "", away: "" };
                        const isLocked = currentStatus !== "scheduled";

                        return (
                          <Card
                            key={match.id}
                            className="overflow-hidden border-border/80 bg-card shadow-[var(--shadow-card)]"
                          >
                            <CardContent className="flex flex-col gap-5 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-foreground">{match.league}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {match.date} • {formatBrasiliaTime(match.startTime)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-border bg-muted/45 text-foreground">
                                    {statusLabelByMatchStatus(currentStatus)}
                                  </Badge>
                                  {points !== null && (
                                    <Badge className="bg-foreground text-background hover:bg-foreground">
                                      {points} pts
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
                                <div className="flex flex-col items-center gap-3">
                                  <TeamMark name={match.homeTeam} logo={match.homeTeamLogo} />
                                  <span className="max-w-[6.5rem] text-center text-[13px] font-semibold leading-tight text-foreground sm:max-w-[8.5rem] sm:text-base">
                                    {match.homeTeam}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Input
                                    inputMode="numeric"
                                    value={values.home}
                                    onChange={(event) => handleFieldChange(match.id, "home", event.target.value)}
                                    placeholder="0"
                                    disabled={isLocked}
                                    className="h-12 w-14 text-center text-lg font-semibold sm:w-16"
                                  />
                                  <span className="text-lg font-semibold text-muted-foreground">x</span>
                                  <Input
                                    inputMode="numeric"
                                    value={values.away}
                                    onChange={(event) => handleFieldChange(match.id, "away", event.target.value)}
                                    placeholder="0"
                                    disabled={isLocked}
                                    className="h-12 w-14 text-center text-lg font-semibold sm:w-16"
                                  />
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                  <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} />
                                  <span className="max-w-[6.5rem] text-center text-[13px] font-semibold leading-tight text-foreground sm:max-w-[8.5rem] sm:text-base">
                                    {match.awayTeam}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-h-5 text-xs text-muted-foreground">
                                  {savedPrediction
                                    ? `Seu palpite: ${savedPrediction.predictedHomeScore} x ${savedPrediction.predictedAwayScore}${points !== null ? ` • ${points} pontos` : ""}`
                                    : "Defina seu placar antes de a partida começar."}
                                </div>

                                <Button
                                  onClick={() => void handleSavePrediction(match)}
                                  disabled={isLocked || savingMatchId === match.id}
                                  className="w-full sm:w-auto"
                                >
                                  {savingMatchId === match.id ? "Salvando..." : savedPrediction ? "Atualizar" : "Salvar"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Bolao;
