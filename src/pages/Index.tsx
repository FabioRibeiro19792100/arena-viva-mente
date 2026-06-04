import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { Footer } from "@/components/Footer";
import { getCurrentMatchStatus, parseWorldCupMatchDate, worldCup2026Matches, type WorldCupMatch } from "@/data/worldCup2026";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Search } from "lucide-react";
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
type QuickFilterType = "all" | "live" | "soon";

const Index = () => {
  const nbaTestDate = "2026-06-04";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [reservedIds, setReservedIds] = useState<string[]>([]);
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
            const mergedWorldCupMatches = mergeStaticMatchesWithApiFixtures(worldCup2026Matches, fixtures).map((match) => ({
              ...match,
              sport: "futebol" as const,
            }));

            setMatches(mergedWorldCupMatches);
            upsertRuntimeMatches(mergedWorldCupMatches);
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

  const isMatchStartingSoon = (match: Pick<DisplayMatch, "date" | "startTime" | "status" | "id">) => {
    const status = getCurrentMatchStatus(match);
    if (status !== "scheduled") {
      return false;
    }

    const kickoff = parseWorldCupMatchDate({ date: match.date, startTime: match.startTime || "" });
    if (!kickoff) {
      return false;
    }

    const diff = kickoff.getTime() - Date.now();
    return diff > 0 && diff <= 2 * 60 * 60 * 1000;
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
      const leagueMatch = selectedLeague === "all" || match.league === selectedLeague;
      const teamMatch =
        selectedTeam === "all" ||
        match.homeTeam === selectedTeam ||
        match.awayTeam === selectedTeam;
      const dateMatch = selectedDate === "all" || match.date === selectedDate;
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

      return sportMatch && leagueMatch && teamMatch && dateMatch && quickMatch && searchMatch;
    });
  }, [todayMatches, searchQuery, selectedDate, selectedLeague, selectedSport, selectedTeam, quickFilter]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => !todayMatchIds.has(match.id))
      .filter((match) => {
        const sportMatch = selectedSport === "all" || match.sport === selectedSport;
        const leagueMatch = selectedLeague === "all" || match.league === selectedLeague;
        const teamMatch =
          selectedTeam === "all" ||
          match.homeTeam === selectedTeam ||
          match.awayTeam === selectedTeam;
      const dateMatch = selectedDate === "all" || match.date === selectedDate;
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

        return sportMatch && leagueMatch && teamMatch && dateMatch && quickMatch && searchMatch;
      });
  }, [matches, todayMatchIds, searchQuery, selectedDate, selectedLeague, selectedSport, selectedTeam, quickFilter]);

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

  const leagueOptions = useMemo(
    () => Array.from(new Set(sportScopedMatches.map((match) => match.league))).sort((a, b) => a.localeCompare(b)),
    [sportScopedMatches],
  );

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sportScopedMatches.flatMap((match) => [match.homeTeam, match.awayTeam]),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [sportScopedMatches],
  );

  const dateOptions = useMemo(
    () => Array.from(new Set(sportScopedMatches.map((match) => match.date))),
    [sportScopedMatches],
  );

  const hasActiveFilters =
    selectedSport !== "all" ||
    selectedLeague !== "all" ||
    selectedTeam !== "all" ||
    selectedDate !== "all" ||
    quickFilter !== "all" ||
    searchQuery !== "";

  const activeFilterCount = [
    selectedSport !== "all",
    selectedLeague !== "all",
    selectedTeam !== "all",
    selectedDate !== "all",
    quickFilter !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedSport("all");
    setSelectedLeague("all");
    setSelectedTeam("all");
    setSelectedDate("all");
    setQuickFilter("all");
    setSearchQuery("");
  };

  const getChipLabel = (type: "sport" | "league" | "team" | "date") => {
    if (type === "sport") {
      return selectedSport === "all" ? "Esporte" : selectedSport === "futebol" ? "Futebol" : "Basquete";
    }

    if (type === "league") {
      return selectedLeague === "all" ? "Campeonato" : selectedLeague;
    }

    if (type === "team") {
      return selectedTeam === "all" ? "Time" : selectedTeam;
    }

    return selectedDate === "all" ? "Data" : selectedDate;
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

  useEffect(() => {
    if (selectedLeague !== "all" && !leagueOptions.includes(selectedLeague)) {
      setSelectedLeague("all");
    }
  }, [leagueOptions, selectedLeague]);

  useEffect(() => {
    if (selectedTeam !== "all" && !teamOptions.includes(selectedTeam)) {
      setSelectedTeam("all");
    }
  }, [teamOptions, selectedTeam]);

  useEffect(() => {
    if (selectedDate !== "all" && !dateOptions.includes(selectedDate)) {
      setSelectedDate("all");
    }
  }, [dateOptions, selectedDate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative py-12 md:py-16">
        <div className="container px-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setQuickFilter((current) => (current === "live" ? "all" : "live"))}
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
              onClick={() => setQuickFilter((current) => (current === "soon" ? "all" : "soon"))}
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

          <div className="mb-8 lg:hidden">
            <div className="space-y-3 lg:hidden">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por seleção, campeonato ou data"
                  className="h-11 border-border bg-card pl-11 placeholder:text-muted-foreground"
                />
              </div>

              <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max items-center gap-2">
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="h-9 min-w-fit whitespace-nowrap border-border bg-card px-3 text-xs">
                      <SelectValue>{getChipLabel("sport")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos esportes</SelectItem>
                      <SelectItem value="futebol">Futebol</SelectItem>
                      <SelectItem value="basquete">Basquete</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                    <SelectTrigger className="h-9 min-w-fit whitespace-nowrap border-border bg-card px-3 text-xs">
                      <SelectValue>{getChipLabel("league")}</SelectValue>
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

                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="h-9 min-w-fit whitespace-nowrap border-border bg-card px-3 text-xs">
                      <SelectValue>{getChipLabel("team")}</SelectValue>
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
                    <SelectTrigger className="h-9 min-w-fit whitespace-nowrap border-border bg-card px-3 text-xs">
                      <SelectValue>{getChipLabel("date")}</SelectValue>
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

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex h-9 items-center whitespace-nowrap border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4 border-r border-border pr-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por seleção, campeonato ou data"
                    className="h-11 border-border bg-card pl-11 placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Esporte</p>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="h-11 border-border bg-card">
                      <SelectValue placeholder="Esporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos esportes</SelectItem>
                      <SelectItem value="futebol">Futebol</SelectItem>
                      <SelectItem value="basquete">Basquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Campeonato</p>
                  <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                    <SelectTrigger className="h-11 border-border bg-card">
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
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Time</p>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="h-11 border-border bg-card">
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
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Data</p>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="h-11 border-border bg-card">
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

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </aside>

            <div>
              <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {totalVisibleMatches} {totalVisibleMatches === 1 ? "evento encontrado" : "eventos encontrados"}
                  </span>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {leagueMatches.map((game) => (
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
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
