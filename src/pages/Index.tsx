import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import heroImage from "@/assets/hero-stadium.jpg";
import matchLive from "@/assets/match-live.jpg";
import matchBasketball from "@/assets/match-basketball.jpg";

const Index = () => {
  // Mock data - will be replaced with real API data
  const liveGames = [
    {
      id: "1",
      homeTeam: "Palmeiras",
      awayTeam: "Grêmio",
      homeScore: 2,
      awayScore: 1,
      league: "Brasileirão Série A",
      status: "live" as const,
      seatsRemaining: 247,
      maxSeats: 3000,
      image: matchLive,
    },
    {
      id: "2",
      homeTeam: "Lakers",
      awayTeam: "Celtics",
      homeScore: 89,
      awayScore: 92,
      league: "NBA",
      status: "almost-full" as const,
      seatsRemaining: 83,
      maxSeats: 3000,
      image: matchBasketball,
    },
  ];

  const upcomingGames = [
    {
      id: "3",
      homeTeam: "Flamengo",
      awayTeam: "Botafogo",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 1847,
      maxSeats: 3000,
      startTime: "19:30",
      image: matchLive,
    },
    {
      id: "4",
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 2234,
      maxSeats: 3000,
      startTime: "21:00",
      image: matchLive,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Stadium atmosphere"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative container h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gradient-stadium">
            O estádio digital do ao vivo
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 max-w-3xl mb-8">
            Cada jogo cria um espaço temporário onde as torcidas se encontram, vibram e deixam rastros emocionais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#live-now">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-status-live text-background hover:bg-status-live/90 hover:shadow-[0_0_20px_hsl(var(--status-live)/0.5)] hover:scale-105 h-14 rounded-lg px-10 text-base">
                Ver jogos ao vivo
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Live Games Section */}
      <section id="live-now" className="container py-16 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-3 h-3 rounded-full bg-status-live animate-pulse-glow" />
          <h2 className="text-3xl font-bold">Ao vivo agora</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveGames.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* Upcoming Games Section */}
      <section className="container py-16 px-4">
        <h2 className="text-3xl font-bold mb-8">Próximos jogos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingGames.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Feito por quem ama ver o jogo junto</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
