import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-stadium.jpg";

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
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/1/15/Palmeiras_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Gremio.svg",
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
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Boston_Celtics.svg",
    },
    {
      id: "3",
      homeTeam: "Flamengo",
      awayTeam: "Santos",
      homeScore: 1,
      awayScore: 0,
      league: "Copa Libertadores",
      status: "live" as const,
      seatsRemaining: 892,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Flamengo-RJ_%28BRA%29.png",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/3/32/Santos_logo.svg",
    },
    {
      id: "4",
      homeTeam: "Vasco",
      awayTeam: "Botafogo",
      homeScore: 3,
      awayScore: 3,
      league: "Brasileirão Série A",
      status: "live" as const,
      seatsRemaining: 1234,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/4/43/Vasco_da_Gama_Logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg",
    },
    {
      id: "live5",
      homeTeam: "Real Madrid",
      awayTeam: "Bayern",
      homeScore: 2,
      awayScore: 2,
      league: "Champions League",
      status: "live" as const,
      seatsRemaining: 456,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_%282017%29.svg",
    },
    {
      id: "live6",
      homeTeam: "Sesi",
      awayTeam: "Praia Clube",
      homeScore: 2,
      awayScore: 1,
      league: "Superliga de Vôlei",
      status: "live" as const,
      seatsRemaining: 1890,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sesi_logo.svg/800px-Sesi_logo.svg.png",
      awayTeamLogo: "https://static.wixstatic.com/media/4c0d33_3d3f3e0b8b8d4c3c8f3f3e0b8b8d4c3c~mv2.png",
    },
    {
      id: "live7",
      homeTeam: "Warriors",
      awayTeam: "Heat",
      homeScore: 104,
      awayScore: 98,
      league: "NBA",
      status: "almost-full" as const,
      seatsRemaining: 145,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg",
    },
    {
      id: "live8",
      homeTeam: "Atlético-MG",
      awayTeam: "River Plate",
      homeScore: 1,
      awayScore: 0,
      league: "Copa Libertadores",
      status: "live" as const,
      seatsRemaining: 678,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_Club_Atlético_River_Plate.svg",
    },
    {
      id: "live9",
      homeTeam: "Corinthians",
      awayTeam: "Fortaleza",
      homeScore: 0,
      awayScore: 1,
      league: "Brasileirão Série A",
      status: "live" as const,
      seatsRemaining: 2123,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/5a/SC_Corinthians_Paulista.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/4/40/FortalezaEsporteClube.svg",
    },
    {
      id: "live10",
      homeTeam: "PSG",
      awayTeam: "Juventus",
      homeScore: 3,
      awayScore: 1,
      league: "Champions League",
      status: "almost-full" as const,
      seatsRemaining: 67,
      maxSeats: 3000,
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg",
    },
  ];

  const upcomingGames = [
    {
      id: "5",
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 2234,
      maxSeats: 3000,
      startTime: "19:30",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/5a/SC_Corinthians_Paulista.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasão_do_São_Paulo_Futebol_Clube.svg",
    },
    {
      id: "6",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      league: "Champions League",
      status: "scheduled" as const,
      seatsRemaining: 1540,
      maxSeats: 3000,
      startTime: "16:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    },
    {
      id: "7",
      homeTeam: "Sesi",
      awayTeam: "Minas",
      league: "Superliga de Vôlei",
      status: "scheduled" as const,
      seatsRemaining: 1990,
      maxSeats: 3000,
      startTime: "20:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sesi_logo.svg/800px-Sesi_logo.svg.png",
      awayTeamLogo: "https://static.wixstatic.com/media/4c0d33_3d3f3e0b8b8d4c3c8f3f3e0b8b8d4c3c~mv2.png",
    },
    {
      id: "8",
      homeTeam: "Atlético-MG",
      awayTeam: "Cruzeiro",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 456,
      maxSeats: 3000,
      startTime: "21:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg",
    },
    {
      id: "9",
      homeTeam: "Warriors",
      awayTeam: "Bucks",
      league: "NBA",
      status: "scheduled" as const,
      seatsRemaining: 2801,
      maxSeats: 3000,
      startTime: "22:30",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg",
    },
    {
      id: "10",
      homeTeam: "Internacional",
      awayTeam: "Fluminense",
      league: "Copa Libertadores",
      status: "scheduled" as const,
      seatsRemaining: 743,
      maxSeats: 3000,
      startTime: "19:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Fluminense_FC_escudo.svg",
    },
    {
      id: "11",
      homeTeam: "Boca Juniors",
      awayTeam: "Palmeiras",
      league: "Copa Libertadores",
      status: "scheduled" as const,
      seatsRemaining: 234,
      maxSeats: 3000,
      startTime: "21:30",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Boca_Juniors_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/1/15/Palmeiras_logo.svg",
    },
    {
      id: "12",
      homeTeam: "Milan",
      awayTeam: "Inter",
      league: "Champions League",
      status: "scheduled" as const,
      seatsRemaining: 1678,
      maxSeats: 3000,
      startTime: "16:45",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
    },
    {
      id: "13",
      homeTeam: "Nets",
      awayTeam: "Lakers",
      league: "NBA",
      status: "scheduled" as const,
      seatsRemaining: 2456,
      maxSeats: 3000,
      startTime: "23:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Brooklyn_Nets_newlogo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg",
    },
    {
      id: "14",
      homeTeam: "Minas",
      awayTeam: "Osasco",
      league: "Superliga de Vôlei",
      status: "scheduled" as const,
      seatsRemaining: 1834,
      maxSeats: 3000,
      startTime: "20:30",
      homeTeamLogo: "https://static.wixstatic.com/media/4c0d33_3d3f3e0b8b8d4c3c8f3f3e0b8b8d4c3c~mv2.png",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sesi_logo.svg/800px-Sesi_logo.svg.png",
    },
    {
      id: "15",
      homeTeam: "Bahia",
      awayTeam: "Athletico-PR",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 2567,
      maxSeats: 3000,
      startTime: "18:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/4/43/EC_Bahia_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/53/Atletico_Paranaense.svg",
    },
    {
      id: "16",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      league: "Champions League",
      status: "scheduled" as const,
      seatsRemaining: 890,
      maxSeats: 3000,
      startTime: "17:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    },
    {
      id: "17",
      homeTeam: "76ers",
      awayTeam: "Knicks",
      league: "NBA",
      status: "scheduled" as const,
      seatsRemaining: 2134,
      maxSeats: 3000,
      startTime: "22:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/0/0e/Philadelphia_76ers_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg",
    },
    {
      id: "18",
      homeTeam: "Santos",
      awayTeam: "Vitória",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 1923,
      maxSeats: 3000,
      startTime: "19:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/3/32/Santos_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/9/95/ECVitoria.svg",
    },
    {
      id: "19",
      homeTeam: "Nacional",
      awayTeam: "Peñarol",
      league: "Copa Libertadores",
      status: "scheduled" as const,
      seatsRemaining: 1456,
      maxSeats: 3000,
      startTime: "20:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/8/88/Escudo_del_Club_Nacional_de_Football.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Escudo_del_Club_Atlético_Peñarol.svg",
    },
    {
      id: "20",
      homeTeam: "Manchester City",
      awayTeam: "Liverpool",
      league: "Champions League",
      status: "almost-full" as const,
      seatsRemaining: 123,
      maxSeats: 3000,
      startTime: "17:30",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    },
    {
      id: "21",
      homeTeam: "Suns",
      awayTeam: "Mavericks",
      league: "NBA",
      status: "scheduled" as const,
      seatsRemaining: 2678,
      maxSeats: 3000,
      startTime: "23:30",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg",
    },
    {
      id: "22",
      homeTeam: "Praia Clube",
      awayTeam: "Dentil",
      league: "Superliga de Vôlei",
      status: "scheduled" as const,
      seatsRemaining: 2234,
      maxSeats: 3000,
      startTime: "19:30",
      homeTeamLogo: "https://static.wixstatic.com/media/4c0d33_3d3f3e0b8b8d4c3c8f3f3e0b8b8d4c3c~mv2.png",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sesi_logo.svg/800px-Sesi_logo.svg.png",
    },
    {
      id: "23",
      homeTeam: "Red Bull Bragantino",
      awayTeam: "Cuiabá",
      league: "Brasileirão Série A",
      status: "scheduled" as const,
      seatsRemaining: 2890,
      maxSeats: 3000,
      startTime: "16:30",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/en/9/9e/Red_Bull_Bragantino_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/en/b/bf/Cuiabá_Esporte_Clube_logo.svg",
    },
    {
      id: "24",
      homeTeam: "Estudiantes",
      awayTeam: "Cerro Porteño",
      league: "Copa Libertadores",
      status: "scheduled" as const,
      seatsRemaining: 1567,
      maxSeats: 3000,
      startTime: "21:00",
      homeTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Estudiantes_de_La_Plata_logo.svg",
      awayTeamLogo: "https://upload.wikimedia.org/wikipedia/commons/8/83/CCP1912.png",
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

      <Footer />
    </div>
  );
};

export default Index;
