import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { Footer } from "@/components/Footer";
import { worldCup2026Matches } from "@/data/worldCup2026";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Search, Ticket } from "lucide-react";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { getProductState, toggleFavoriteMatch } from "@/lib/productState";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useMockAuth();
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [reservedIds, setReservedIds] = useState<string[]>([]);

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

  const eventOptions = useMemo(
    () => Array.from(new Set(worldCup2026Matches.map((match) => match.stage))),
    [],
  );

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Set(
          worldCup2026Matches.flatMap((match) => [match.homeTeam, match.awayTeam]),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const dateOptions = useMemo(
    () => Array.from(new Set(worldCup2026Matches.map((match) => match.date))),
    [],
  );

  const filteredMatches = useMemo(() => {
    return worldCup2026Matches.filter((match) => {
      const sportMatch = selectedSport === "all" || selectedSport === "futebol";
      const eventMatch = selectedEvent === "all" || match.stage === selectedEvent;
      const teamMatch =
        selectedTeam === "all" ||
        match.homeTeam === selectedTeam ||
        match.awayTeam === selectedTeam;
      const dateMatch = selectedDate === "all" || match.date === selectedDate;
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

      return sportMatch && eventMatch && teamMatch && dateMatch && searchMatch;
    });
  }, [searchQuery, selectedDate, selectedEvent, selectedSport, selectedTeam]);

  const hasActiveFilters =
    selectedSport !== "all" ||
    selectedEvent !== "all" ||
    selectedTeam !== "all" ||
    selectedDate !== "all" ||
    searchQuery !== "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative py-12 md:py-16">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Ticket className="h-5 w-5 text-primary" />
              <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Catálogo de eventos
              </span>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-foreground md:text-5xl">
              Copa do Mundo 2026
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
              Navegue pelos jogos, filtre o que importa e entre na sala de cada partida.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_repeat(4,0.8fr)] gap-3 mb-8">
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
              </SelectContent>
            </Select>

            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-12 border-border bg-card">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos eventos</SelectItem>
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

          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {filteredMatches.length} {filteredMatches.length === 1 ? "evento encontrado" : "eventos encontrados"}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedSport("all");
                  setSelectedEvent("all");
                  setSelectedTeam("all");
                  setSelectedDate("all");
                  setSearchQuery("");
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground shadow-[var(--shadow-card)]">
              Nenhum evento encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMatches.map((game) => (
                <GameCard
                  key={game.id}
                  {...game}
                  startTime={`${game.date} • ${game.startTime}`}
                  isFavorite={favoriteIds.includes(game.id)}
                  isReserved={reservedIds.includes(game.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
