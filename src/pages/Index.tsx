import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { Footer } from "@/components/Footer";
import { getCurrentMatchStatus, worldCup2026Matches, type WorldCupMatch } from "@/data/worldCup2026";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addReservation, getProductState, toggleFavoriteMatch } from "@/lib/productState";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  mapApiFixtureToWorldCupMatch,
  mapApiNbaGameToMatch,
  mergeStaticMatchesWithApiFixtures,
  type ApiFootballFixture,
  type ApiNbaGame,
} from "@/lib/apiFootball";
import { upsertRuntimeMatches } from "@/lib/runtimeMatches";

type SportType = "futebol" | "basquete";
type DisplayMatch = WorldCupMatch & { sport: SportType };

const Index = () => {
  const nbaTestDate = "2026-06-04";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "live">("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [reservedIds, setReservedIds] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [matches, setMatches] = useState<DisplayMatch[]>(
    worldCup2026Matches.map((match) => ({ ...match, sport: "futebol" })),
  );
  const [todayMatches, setTodayMatches] = useState<DisplayMatch[]>([]);

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
      try {
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());

        const [worldCupResponse, todayFootballResponse, todayNbaResponse] = await Promise.all([
          fetch("/api/football/fixtures?league=1&season=2026"),
          fetch(`/api/football/fixtures?date=${today}&timezone=America/Sao_Paulo`),
          fetch(`/api/nba/games?date=${nbaTestDate}`),
        ]);

        if (!isActive) {
          return;
        }

        if (worldCupResponse.ok) {
          const payload = await worldCupResponse.json();
          const fixtures = Array.isArray(payload?.response)
            ? (payload.response as ApiFootballFixture[])
            : [];

          if (fixtures.length > 0) {
            setMatches(
              mergeStaticMatchesWithApiFixtures(worldCup2026Matches, fixtures).map((match) => ({
                ...match,
                sport: "futebol" as const,
              })),
            );
          }
        }

        const nextTodayMatches: DisplayMatch[] = [];

        if (todayFootballResponse.ok) {
          const payload = await todayFootballResponse.json();
          const todayFixtures = Array.isArray(payload?.response)
            ? (payload.response as ApiFootballFixture[])
            : [];

          nextTodayMatches.push(
            ...todayFixtures.map((fixture) => ({
              ...mapApiFixtureToWorldCupMatch(fixture),
              sport: "futebol" as const,
            })),
          );
        }

        if (todayNbaResponse.ok) {
          const payload = await todayNbaResponse.json();
          const todayGames = Array.isArray(payload?.response)
            ? (payload.response as ApiNbaGame[])
            : [];

          nextTodayMatches.push(
            ...todayGames.map((game) => ({
              ...mapApiNbaGameToMatch(game),
              sport: "basquete" as const,
            })),
          );
        }

        if (nextTodayMatches.length > 0) {
          setTodayMatches(nextTodayMatches);
          upsertRuntimeMatches(nextTodayMatches);
        }
      } catch {
        // Keep static fallback silently when the proxy is unavailable locally.
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const todayMatchIds = useMemo(() => new Set(todayMatches.map((match) => match.id)), [todayMatches]);

  const filteredTodayMatches = useMemo(() => {
    return todayMatches.filter((match) => {
      const sportMatch = selectedSport === "all" || match.sport === selectedSport;
      const leagueMatch = selectedLeague === "all" || match.league === selectedLeague;
      const eventMatch = selectedEvent === "all" || match.stage === selectedEvent;
      const teamMatch =
        selectedTeam === "all" ||
        match.homeTeam === selectedTeam ||
        match.awayTeam === selectedTeam;
      const dateMatch = selectedDate === "all" || match.date === selectedDate;
      const quickMatch =
        quickFilter === "all" ||
        getCurrentMatchStatus({
          id: match.id,
          date: match.date,
          startTime: match.startTime || "",
          status: match.status,
        }) === "live";
      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        query === "" ||
        [
          match.homeTeam,
          match.awayTeam,
          match.stage,
          match.venue,
          match.date,
          match.league,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return sportMatch && leagueMatch && eventMatch && teamMatch && dateMatch && quickMatch && searchMatch;
    });
  }, [todayMatches, searchQuery, selectedDate, selectedEvent, selectedLeague, selectedSport, selectedTeam, quickFilter]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => !todayMatchIds.has(match.id))
      .filter((match) => {
        const sportMatch = selectedSport === "all" || match.sport === selectedSport;
        const leagueMatch = selectedLeague === "all" || match.league === selectedLeague;
        const eventMatch = selectedEvent === "all" || match.stage === selectedEvent;
        const teamMatch =
          selectedTeam === "all" ||
          match.homeTeam === selectedTeam ||
          match.awayTeam === selectedTeam;
        const dateMatch = selectedDate === "all" || match.date === selectedDate;
        const quickMatch =
          quickFilter === "all" ||
          getCurrentMatchStatus({
            id: match.id,
            date: match.date,
            startTime: match.startTime || "",
            status: match.status,
          }) === "live";
        const query = searchQuery.trim().toLowerCase();
        const searchMatch =
          query === "" ||
          [
            match.homeTeam,
            match.awayTeam,
            match.stage,
            match.venue,
            match.date,
            match.league,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return sportMatch && leagueMatch && eventMatch && teamMatch && dateMatch && quickMatch && searchMatch;
      });
  }, [matches, todayMatchIds, searchQuery, selectedDate, selectedEvent, selectedLeague, selectedSport, selectedTeam, quickFilter]);

  const totalVisibleMatches = filteredTodayMatches.length + filteredMatches.length;

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

      const match = [...todayMatches, ...matches].find((item) => item.id === matchId);
      toast({
        title: "Sala reservada",
        description: match
          ? `${match.homeTeam} x ${match.awayTeam} foi adicionado à sua agenda.`
          : "A reserva foi adicionada à sua agenda.",
      });
    })();
  };

  const eventOptions = useMemo(
    () => Array.from(new Set([...todayMatches, ...matches].map((match) => match.stage))),
    [matches, todayMatches],
  );

  const leagueOptions = useMemo(
    () => Array.from(new Set([...todayMatches, ...matches].map((match) => match.league))).sort((a, b) => a.localeCompare(b)),
    [matches, todayMatches],
  );

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...todayMatches, ...matches].flatMap((match) => [match.homeTeam, match.awayTeam]),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [matches, todayMatches],
  );

  const dateOptions = useMemo(
    () => Array.from(new Set([...todayMatches, ...matches].map((match) => match.date))),
    [matches, todayMatches],
  );

  const hasActiveFilters =
    selectedSport !== "all" ||
    selectedLeague !== "all" ||
    selectedEvent !== "all" ||
    selectedTeam !== "all" ||
    selectedDate !== "all" ||
    quickFilter !== "all" ||
    searchQuery !== "";

  const activeFilterCount = [
    selectedSport !== "all",
    selectedLeague !== "all",
    selectedEvent !== "all",
    selectedTeam !== "all",
    selectedDate !== "all",
    quickFilter !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative py-12 md:py-16">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setQuickFilter((current) => (current === "live" ? "all" : "live"))}
              className={`h-10 border px-4 text-sm font-medium transition-colors ${
                quickFilter === "live"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              Ao vivo agora
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((current) => !current)}
                className="flex h-12 flex-1 items-center justify-between rounded-xl border border-border bg-card px-4 text-left text-sm font-medium text-foreground shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`}
                />
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSport("all");
                    setSelectedLeague("all");
                    setSelectedEvent("all");
                    setSelectedTeam("all");
                    setSelectedDate("all");
                    setQuickFilter("all");
                    setSearchQuery("");
                  }}
                  className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className={`${mobileFiltersOpen ? "mt-3 grid" : "hidden"} grid-cols-1 gap-3 lg:mt-0 lg:grid lg:grid-cols-[1.3fr_repeat(5,0.8fr)]`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por seleção, sede ou fase"
                  className="h-12 border-border bg-card pl-11 placeholder:text-muted-foreground"
                />
              </div>

              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="h-12 border-border bg-card">
                  <SelectValue placeholder="Esporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos esportes</SelectItem>
                  <SelectItem value="futebol">Futebol</SelectItem>
                  <SelectItem value="basquete">Basquete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="h-12 border-border bg-card">
                  <SelectValue placeholder="Campeonato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos campeonatos</SelectItem>
                  {leagueOptions.map((league) => (
                    <SelectItem key={league} value={league}>
                      {league}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="h-12 border-border bg-card">
                  <SelectValue placeholder="Fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fases</SelectItem>
                  {eventOptions.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-12 border-border bg-card">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos times</SelectItem>
                  {teamOptions.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="h-12 border-border bg-card">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas datas</SelectItem>
                  {dateOptions.map((date) => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {totalVisibleMatches} {totalVisibleMatches === 1 ? "evento encontrado" : "eventos encontrados"}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedSport("all");
                  setSelectedLeague("all");
                  setSelectedEvent("all");
                  setSelectedTeam("all");
                  setSelectedDate("all");
                  setQuickFilter("all");
                  setSearchQuery("");
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              {filteredTodayMatches.length > 0 && (
                <section className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-foreground">Hoje</h2>
                    <p className="text-sm text-muted-foreground">Jogos reais do dia para testar status, entrada e fluxo ao vivo.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTodayMatches.map((game) => (
                      <GameCard
                        key={game.id}
                        {...game}
                        startTime={game.startTime}
                        hasRoom={false}
                        isFavorite={favoriteIds.includes(game.id)}
                        isReserved={reservedIds.includes(game.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onReserveMatch={handleReserveMatch}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredMatches.length > 0 && (
                <section className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-foreground">Copa do Mundo 2026</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredMatches.map((game) => (
                      <GameCard
                        key={game.id}
                        {...game}
                        startTime={game.startTime}
                        hasRoom={true}
                        isFavorite={favoriteIds.includes(game.id)}
                        isReserved={reservedIds.includes(game.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onReserveMatch={handleReserveMatch}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
