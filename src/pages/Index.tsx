import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { Footer } from "@/components/Footer";
import { getCurrentMatchStatus, parseWorldCupMatchDate, worldCup2026Matches, type WorldCupMatch } from "@/data/worldCup2026";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Search } from "lucide-react";
import { useMockAuth } from "@/contexts/MockAuthContext";
import {
  addReservation,
  getMatchReservationCounts,
  getProductState,
  toggleFavoriteMatch,
} from "@/lib/productState";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  mapApiFixtureToWorldCupMatch,
  mapApiNbaGameToMatch,
  mapApiVolleyballGameToMatch,
  mergeStaticMatchesWithApiFixtures,
  type ApiFootballFixture,
  type ApiNbaGame,
  type ApiVolleyballGame,
} from "@/lib/apiFootball";
import { normalizeSearchText, translateTeamLabel } from "@/lib/matchLabels";
import { upsertRuntimeMatches } from "@/lib/runtimeMatches";

type SportType = "futebol" | "basquete" | "volei";
type DisplayMatch = WorldCupMatch & { sport: SportType };
type QuickFilterType = "all" | "live" | "soon";
type ApiFeedStatus = {
  football: "ok" | "partial" | "offline" | "plan";
  nba: "ok" | "partial" | "offline" | "limit";
  volleyball: "ok" | "partial" | "offline" | "limit";
};

const getSearchableMatchText = (match: DisplayMatch) =>
  normalizeSearchText(
    [
      match.homeTeam,
      translateTeamLabel(match.homeTeam),
      match.awayTeam,
      translateTeamLabel(match.awayTeam),
      match.stage,
      match.venue,
      match.date,
      match.league,
    ].join(" "),
  );

const dedupeMatchesById = (items: DisplayMatch[]) =>
  Array.from(new Map(items.map((match) => [match.id, match])).values());

const formatApiDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const Index = () => {
  const nbaTestDate = "2026-06-04";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [reservedIds, setReservedIds] = useState<string[]>([]);
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [apiFeedStatus, setApiFeedStatus] = useState<ApiFeedStatus>({
    football: "ok",
    nba: "ok",
    volleyball: "ok",
  });
  const [matches, setMatches] = useState<DisplayMatch[]>(
    worldCup2026Matches.map((match) => ({ ...match, sport: "futebol" })),
  );
  const [todayMatches, setTodayMatches] = useState<DisplayMatch[]>([]);

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
    const visibleIds = [...todayMatches, ...matches].map((match) => match.id);
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
  }, [matches, todayMatches]);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const response = await fetch(`/api/feed/home?sport=${selectedSport}&quick=${quickFilter}`);
        const payload = await response.json();

        if (!isActive) return;

        const nextMatches = Array.isArray(payload?.matches) ? (payload.matches as DisplayMatch[]) : [];
        const nextTodayMatches = Array.isArray(payload?.todayMatches)
          ? (payload.todayMatches as DisplayMatch[])
          : [];

        setMatches(nextMatches);
        setTodayMatches(nextTodayMatches);
        upsertRuntimeMatches([...nextMatches, ...nextTodayMatches]);

        if (payload?.apiFeedStatus) {
          setApiFeedStatus(payload.apiFeedStatus as ApiFeedStatus);
        }
      } catch {
        if (isActive) {
          setApiFeedStatus({
            football: "offline",
            nba: "offline",
            volleyball: "offline",
          });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [selectedSport, quickFilter]);

  const isMatchStartingSoon = (match: Pick<DisplayMatch, "date" | "startTime" | "status" | "id">) => {
    const status = getCurrentMatchStatus(match);
    if (status !== "scheduled") {
      return false;
    }

    const kickoff = parseWorldCupMatchDate({ date: match.date, startTime: match.startTime || "" });
    if (!kickoff) {
      return false;
    }

    const now = new Date();
    const diff = kickoff.getTime() - now.getTime();
    const sameDay =
      kickoff.getFullYear() === now.getFullYear() &&
      kickoff.getMonth() === now.getMonth() &&
      kickoff.getDate() === now.getDate();

    return diff > 0 && sameDay;
  };

  const todayMatchIds = useMemo(() => new Set(todayMatches.map((match) => match.id)), [todayMatches]);
  const allMatches = useMemo(() => [...todayMatches, ...matches], [todayMatches, matches]);
  const sportScopedMatches = useMemo(
    () => allMatches.filter((match) => selectedSport === "all" || match.sport === selectedSport),
    [allMatches, selectedSport],
  );

  const filteredTodayMatches = useMemo(() => {
    return todayMatches.filter((match) => {
      const sportMatch = selectedSport === "all" || match.sport === selectedSport;
      const quickMatch =
        quickFilter === "all" ||
        (quickFilter === "live"
          ? getCurrentMatchStatus({
              id: match.id,
              date: match.date,
              startTime: match.startTime || "",
              status: match.status,
            }) === "live"
          : isMatchStartingSoon(match));
      const query = normalizeSearchText(searchQuery);
      const searchMatch =
        query === "" || getSearchableMatchText(match).includes(query);

      return sportMatch && quickMatch && searchMatch;
    });
  }, [todayMatches, searchQuery, selectedSport, quickFilter]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => !todayMatchIds.has(match.id))
      .filter((match) => {
        const sportMatch = selectedSport === "all" || match.sport === selectedSport;
        const quickMatch =
          quickFilter === "all" ||
          (quickFilter === "live"
            ? getCurrentMatchStatus({
                id: match.id,
                date: match.date,
                startTime: match.startTime || "",
                status: match.status,
              }) === "live"
            : isMatchStartingSoon(match));
        const query = normalizeSearchText(searchQuery);
        const searchMatch =
          query === "" || getSearchableMatchText(match).includes(query);

        return sportMatch && quickMatch && searchMatch;
      });
  }, [matches, todayMatchIds, searchQuery, selectedSport, quickFilter]);

  const totalVisibleMatches = filteredTodayMatches.length + filteredMatches.length;
  const apiStatusLabel = (() => {
    if (
      apiFeedStatus.football === "ok" &&
      apiFeedStatus.nba === "ok" &&
      apiFeedStatus.volleyball === "ok"
    ) {
      return null;
    }

    const parts: string[] = [];
    if (apiFeedStatus.football !== "ok") {
      parts.push(
        apiFeedStatus.football === "partial"
          ? "Futebol parcial"
          : apiFeedStatus.football === "plan"
            ? "Futebol indisponível no plano"
            : "Futebol offline",
      );
    }
    if (apiFeedStatus.nba !== "ok") {
      parts.push(
        apiFeedStatus.nba === "partial"
          ? "NBA parcial"
          : apiFeedStatus.nba === "limit"
            ? "NBA no limite diário"
            : "NBA offline",
      );
    }
    if (apiFeedStatus.volleyball !== "ok") {
      parts.push(
        apiFeedStatus.volleyball === "partial"
          ? "Vôlei parcial"
          : apiFeedStatus.volleyball === "limit"
            ? "Vôlei no limite diário"
            : "Vôlei offline",
      );
    }

    return parts.join(" • ");
  })();

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
      setReservationCounts(
        await getMatchReservationCounts([...todayMatches, ...matches].map((item) => item.id)),
      );

      const match = [...todayMatches, ...matches].find((item) => item.id === matchId);
      toast({
        title: "Sala reservada",
        description: match
          ? `${match.homeTeam} x ${match.awayTeam} foi adicionado à sua agenda.`
          : "A reserva foi adicionada à sua agenda.",
      });
    })();
  };

  const hasActiveFilters =
    selectedSport !== "all" ||
    quickFilter !== "all" ||
    searchQuery !== "";

  const activeFilterCount = [
    selectedSport !== "all",
    quickFilter !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedSport("all");
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

  const getChipLabel = (type: "sport" | "league" | "team" | "date") => {
    if (type === "sport") {
      if (selectedSport === "all") return "Esporte";
      if (selectedSport === "futebol") return "Futebol";
      if (selectedSport === "basquete") return "Basquete";
      return "Vôlei";
    }

    return "Esporte";
  };

  const groupMatchesByLeague = (items: DisplayMatch[]) =>
    Array.from(
      items.reduce((groups, match) => {
        const current = groups.get(match.league) || [];
        current.push(match);
        groups.set(match.league, current);
        return groups;
      }, new Map<string, DisplayMatch[]>()),
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative py-12 md:py-16">
        <div className="container px-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                quickFilter === "all"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => toggleQuickFilter("live")}
              className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                quickFilter === "live"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ao vivo agora
            </button>
            <button
              type="button"
              onClick={() => toggleQuickFilter("soon")}
              className={`inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors ${
                quickFilter === "soon"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Em breve
            </button>
          </div>

          <div className="mb-8">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className="h-11 w-full shrink-0 border-border bg-card text-xs sm:w-[152px]">
                    <SelectValue>{getChipLabel("sport")}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos esportes</SelectItem>
                    <SelectItem value="futebol">Futebol</SelectItem>
                    <SelectItem value="basquete">Basquete</SelectItem>
                    <SelectItem value="volei">Vôlei</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar o que você quiser"
                    className="h-11 border-border bg-card pl-11 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
              <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {totalVisibleMatches} {totalVisibleMatches === 1 ? "evento encontrado" : "eventos encontrados"}
                    </span>
                  </div>
                  {apiStatusLabel && (
                    <p className="text-xs text-muted-foreground">
                      {apiStatusLabel}
                    </p>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {totalVisibleMatches === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground shadow-[var(--shadow-card)]">
                  Nenhum evento encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="space-y-12">
                  {[...groupMatchesByLeague(filteredTodayMatches), ...groupMatchesByLeague(filteredMatches)].map(
                    ([league, leagueMatches]) => (
                      <section key={league} className="space-y-5">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-semibold text-foreground">{league}</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                          {leagueMatches.map((game) => (
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
                      </section>
                    ),
                  )}
                </div>
              )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
