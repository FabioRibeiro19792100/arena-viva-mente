import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, Search, Trophy, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addReservation, getMatchReservationCounts, getProductState, toggleFavoriteMatch } from "@/lib/productState";
import { useToast } from "@/hooks/use-toast";
import { fetchWorldCupPoolMatches, type WorldCupPoolMatch } from "@/lib/worldCupPoolApi";
import { normalizeSearchText } from "@/lib/matchLabels";
import { getCurrentMatchStatus } from "@/data/worldCup2026";
import { useIsMobile } from "@/hooks/use-mobile";

type QuickFilterType = "all" | "live" | "soon";

const MOBILE_BANCADA_INTRO_KEY = "arena.mobile.bancada-intro.seen";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [reservedIds, setReservedIds] = useState<string[]>([]);
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [isSyncingFeed, setIsSyncingFeed] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const [worldCupMatches, setWorldCupMatches] = useState<WorldCupPoolMatch[]>([]);
  const [showBancadaIntro, setShowBancadaIntro] = useState(false);
  const [mobileView, setMobileView] = useState<"chooser" | "feed">("chooser");
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  useEffect(() => {
    setMobileView(isMobile ? "chooser" : "feed");
  }, [isMobile]);

  useEffect(() => {
    const quick = searchParams.get("quick");
    if (quick === "live" || quick === "soon") {
      setQuickFilter(quick);
      return;
    }
    setQuickFilter("all");
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setReservedIds([]);
      return;
    }

    void (async () => {
      const state = await getProductState(user.id);
      setFavoriteIds(state.favorites);
      setReservedIds(state.reservations.map((reservation) => reservation.matchId));
    })();
  }, [user]);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const matches = await fetchWorldCupPoolMatches().catch(() => []);
      if (!isActive) return;
      setWorldCupMatches(matches);
    })();

    return () => {
      isActive = false;
    };
  }, [syncTick]);

  const normalizedSearch = useMemo(() => normalizeSearchText(searchQuery), [searchQuery]);

  const filteredMatches = useMemo(() => {
    const quickMatches = worldCupMatches.filter((match) => {
      const status = getCurrentMatchStatus(match);
      if (quickFilter === "live") return status === "live";
      if (quickFilter === "soon") return status === "scheduled";
      return true;
    });

    if (!normalizedSearch) {
      return quickMatches;
    }

    return quickMatches.filter((match) => {
      const searchableText = normalizeSearchText(
        [match.homeTeam, match.awayTeam, match.league, match.stage, match.venue, match.date].join(" "),
      );
      return searchableText.includes(normalizedSearch);
    });
  }, [normalizedSearch, quickFilter, worldCupMatches]);

  useEffect(() => {
    const visibleIds = filteredMatches.map((match) => match.id);
    if (visibleIds.length === 0) {
      setReservationCounts({});
      return;
    }

    let isActive = true;

    void (async () => {
      const counts = await getMatchReservationCounts(visibleIds);
      if (isActive) {
        setReservationCounts(counts);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [filteredMatches]);

  const handleToggleFavorite = (matchId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    void (async () => {
      await toggleFavoriteMatch(user.id, matchId);
      const state = await getProductState(user.id);
      setFavoriteIds(state.favorites);
      setReservedIds(state.reservations.map((reservation) => reservation.matchId));
    })();
  };

  const handleReserveMatch = (matchId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    void (async () => {
      await addReservation(user.id, matchId);
      const state = await getProductState(user.id);
      setFavoriteIds(state.favorites);
      setReservedIds(state.reservations.map((reservation) => reservation.matchId));
      setReservationCounts(await getMatchReservationCounts(worldCupMatches.map((item) => item.id)));

      const match = worldCupMatches.find((item) => item.id === matchId);
      toast({
        title: "Sala reservada",
        description: match
          ? `${match.homeTeam} x ${match.awayTeam} foi adicionado à sua agenda.`
          : "A reserva foi adicionada à sua agenda.",
      });
    })();
  };

  const handleManualSync = async () => {
    try {
      setIsSyncingFeed(true);
      const response = await fetch("/api/jobs/sync-world-cup-scores");
      if (!response.ok) {
        throw new Error("sync_failed");
      }
      setSyncTick((value) => value + 1);
      toast({
        title: "Agenda sincronizada",
        description: "Os placares e status mais recentes foram atualizados.",
      });
    } catch {
      toast({
        title: "Não foi possível sincronizar",
        description: "Tenta de novo em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingFeed(false);
    }
  };

  const resetFilters = () => {
    setQuickFilter("all");
    setSearchQuery("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("quick");
      return next;
    });
  };

  const toggleQuickFilter = (value: Exclude<QuickFilterType, "all">) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (quickFilter === value) {
        next.delete("quick");
      } else {
        next.set("quick", value);
      }
      return next;
    });
  };

  const openBancada = () => {
    if (!isMobile) {
      setMobileView("feed");
      return;
    }

    const alreadySawIntro =
      typeof window !== "undefined" && window.localStorage.getItem(MOBILE_BANCADA_INTRO_KEY) === "1";

    if (alreadySawIntro) {
      setMobileView("feed");
      return;
    }

    setShowBancadaIntro(true);
  };

  const confirmBancadaIntro = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MOBILE_BANCADA_INTRO_KEY, "1");
    }
    setShowBancadaIntro(false);
    setMobileView("feed");
  };

  const chooserVisible = isMobile && mobileView === "chooser";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <Dialog open={showBancadaIntro} onOpenChange={setShowBancadaIntro}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Como funciona a Bancada</DialogTitle>
            <DialogDescription>
              Reserve a sala antes do jogo, entre no pre-jogo quando abrir e acompanhe ao vivo e resumo no mesmo fluxo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Os jogos abrem com antecedência para a torcida se organizar.</p>
            <p>Depois você acompanha a conversa da sala, o ao vivo e o pós-jogo sem sair do caminho principal.</p>
          </div>
          <DialogFooter>
            <Button onClick={confirmBancadaIntro} className="w-full sm:w-auto">
              Entrar na Bancada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1">
      {chooserVisible ? (
        <section className="py-10">
          <div className="container px-6">
            <div className="mx-auto max-w-lg space-y-8">
              <div className="space-y-3 text-left">
                <h1 className="max-w-md text-3xl font-semibold leading-tight text-foreground">
                  Comente os jogos em tempo real e banque o especialista
                </h1>
                <p className="text-base text-muted-foreground">
                  Escolha como quer entrar agora.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={openBancada}
                  className="w-full border border-border/80 bg-card px-5 py-5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-h-[112px] items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-background text-foreground">
                      <Users className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-foreground">Bancada</h2>
                      <p className="text-sm text-muted-foreground">Um estádio virtual para escolher seu lado, entrar no clima da torcida e comentar ao vivo.</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/bolao")}
                  className="w-full border border-border/80 bg-card px-5 py-5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-h-[112px] items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-background text-foreground">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-foreground">Bolão</h2>
                      <p className="text-sm text-muted-foreground">Dê seus palpites, acompanhe o resultado real e dispute posição no ranking.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative py-6 md:py-8">
          <div className="container px-6">
            {isMobile && (
              <div className="sticky top-20 z-30 -mx-6 mb-5 border-b border-border/80 bg-background/92 px-6 py-3 backdrop-blur-xl">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate("/bolao")}
                    className="inline-flex items-center gap-2 py-1 text-base font-semibold text-foreground transition-colors hover:text-foreground"
                  >
                    <Trophy className="h-4 w-4" />
                    Bolão
                  </button>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                        quickFilter === "all" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleQuickFilter("live")}
                      className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                        quickFilter === "live" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Ao vivo agora
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleQuickFilter("soon")}
                      className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                        quickFilter === "soon" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Em breve
                    </button>
                  </div>

                  <div className="relative min-w-0">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar jogos, seleções ou fase"
                      className="h-10 border-border bg-card pl-11 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="hidden md:block mb-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                    quickFilter === "all" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => toggleQuickFilter("live")}
                  className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                    quickFilter === "live" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Ao vivo agora
                </button>
                <button
                  type="button"
                  onClick={() => toggleQuickFilter("soon")}
                  className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                    quickFilter === "soon" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Em breve
                </button>
              </div>

              <div className="relative min-w-0">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar jogos, seleções ou fase"
                  className="h-11 border-border bg-card pl-11 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <div className="mb-6 md:mb-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {filteredMatches.length} {filteredMatches.length === 1 ? "jogo encontrado" : "jogos encontrados"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {isLocalhost && (
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncingFeed}
                      className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSyncingFeed ? "Sincronizando..." : "Sincronizar agora"}
                    </button>
                  )}
                </div>
              </div>

              {filteredMatches.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground shadow-[var(--shadow-card)]">
                  Nenhum jogo foi encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                    {filteredMatches.map((game) => (
                      <GameCard
                        key={game.id}
                        {...game}
                        startTime={game.startTime}
                        hasRoom={true}
                        isFavorite={favoriteIds.includes(game.id)}
                        isReserved={reservedIds.includes(game.id)}
                        reservationCount={reservationCounts[game.id] || 0}
                        onToggleFavorite={handleToggleFavorite}
                        onReserveMatch={handleReserveMatch}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
