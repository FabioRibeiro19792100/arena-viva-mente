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
    <div className="min-h-screen bg-black">
      <Header />

      <section className="relative bg-black py-12 md:py-16">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Ticket className="h-5 w-5 text-white/70" />
              <span className="text-sm uppercase tracking-[0.2em] text-white/60">
                Catálogo de eventos
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Copa do Mundo 2026
            </h1>
            <p className="text-base md:text-lg text-white/60 max-w-3xl">
              Explore a agenda oficial por esporte, fase, seleção e data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_repeat(4,0.8fr)] gap-3 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por seleção, sede ou fase"
                className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Esporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos esportes</SelectItem>
                <SelectItem value="futebol">Futebol</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
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
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
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
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
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
            <div className="flex items-center gap-2 text-sm text-white/60">
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
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
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
