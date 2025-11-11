import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface ResumoCard {
  id: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  league: string;
  date: string;
  sentiment: "euforia" | "tensao" | "frustracao" | "neutro";
  messagesCount: number;
  topPhrase: string;
}

const Galeria = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [selectedClub, setSelectedClub] = useState<string>("all");

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "euforia": return "🔥";
      case "tensao": return "😤";
      case "frustracao": return "😓";
      default: return "😐";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "euforia": return "bg-primary text-primary-foreground";
      case "tensao": return "bg-accent text-accent-foreground";
      case "frustracao": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Mock data
  const resumos: ResumoCard[] = [
    {
      id: "1",
      homeTeam: "Palmeiras",
      awayTeam: "Grêmio",
      score: "2 x 1",
      league: "🇧🇷 Brasileirão",
      date: "Ontem, 21:30",
      sentiment: "euforia",
      messagesCount: 4128,
      topPhrase: '"É CAMPEÃO!"',
    },
    {
      id: "2",
      homeTeam: "Lakers",
      awayTeam: "Celtics",
      score: "98 x 102",
      league: "🏀 NBA",
      date: "Hoje, 02:00",
      sentiment: "tensao",
      messagesCount: 3542,
      topPhrase: '"Que defesa insana!"',
    },
    {
      id: "3",
      homeTeam: "Flamengo",
      awayTeam: "Botafogo",
      score: "0 x 2",
      league: "🇧🇷 Brasileirão",
      date: "Há 2 dias",
      sentiment: "frustracao",
      messagesCount: 5234,
      topPhrase: '"Vergonhoso..."',
    },
    {
      id: "4",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      score: "3 x 2",
      league: "🌍 Champions League",
      date: "Há 3 dias",
      sentiment: "euforia",
      messagesCount: 7892,
      topPhrase: '"GOLAÇO DE VINÍCIUS!"',
    },
    {
      id: "5",
      homeTeam: "Sesi",
      awayTeam: "Minas",
      score: "3 x 1",
      league: "🏐 Superliga",
      date: "Ontem, 19:00",
      sentiment: "euforia",
      messagesCount: 1843,
      topPhrase: '"Que ataque perfeito!"',
    },
    {
      id: "6",
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      score: "1 x 1",
      league: "🇧🇷 Brasileirão",
      date: "Há 4 dias",
      sentiment: "tensao",
      messagesCount: 6234,
      topPhrase: '"Clássico é clássico"',
    },
    {
      id: "7",
      homeTeam: "Internacional",
      awayTeam: "Fluminense",
      score: "2 x 0",
      league: "🏆 Libertadores",
      date: "Há 5 dias",
      sentiment: "euforia",
      messagesCount: 4567,
      topPhrase: '"Vamos pra final!"',
    },
    {
      id: "8",
      homeTeam: "Warriors",
      awayTeam: "Bucks",
      score: "115 x 118",
      league: "🏀 NBA",
      date: "Há 1 dia",
      sentiment: "tensao",
      messagesCount: 3821,
      topPhrase: '"Curry quase fez milagre"',
    },
    {
      id: "9",
      homeTeam: "Atlético-MG",
      awayTeam: "Cruzeiro",
      score: "1 x 3",
      league: "🇧🇷 Brasileirão",
      date: "Há 6 dias",
      sentiment: "frustracao",
      messagesCount: 5678,
      topPhrase: '"Time sem vontade"',
    },
    {
      id: "10",
      homeTeam: "Vasco",
      awayTeam: "Santos",
      score: "2 x 2",
      league: "🇧🇷 Brasileirão",
      date: "Há 1 semana",
      sentiment: "neutro",
      messagesCount: 3456,
      topPhrase: '"Jogo equilibrado"',
    },
    {
      id: "11",
      homeTeam: "PSG",
      awayTeam: "Manchester City",
      score: "1 x 2",
      league: "🌍 Champions League",
      date: "Há 1 semana",
      sentiment: "tensao",
      messagesCount: 8234,
      topPhrase: '"Mbappé não deu conta"',
    },
    {
      id: "12",
      homeTeam: "Praia Clube",
      awayTeam: "Osasco",
      score: "3 x 2",
      league: "🏐 Superliga",
      date: "Há 2 dias",
      sentiment: "euforia",
      messagesCount: 2134,
      topPhrase: '"Virada épica!"',
    },
  ];

  const trending = [
    { label: "Mais comentado", value: "Palmeiras x Grêmio" },
    { label: "Maior euforia", value: "Lakers x Celtics" },
    { label: "Momento mais tenso", value: "Real x Barcelona" },
  ];

  // Filtros
  const filteredResumos = resumos.filter((resumo) => {
    const sportMatch = selectedSport === "all" || 
      (selectedSport === "futebol" && (resumo.league.includes("Brasileirão") || resumo.league.includes("Libertadores") || resumo.league.includes("Champions"))) ||
      (selectedSport === "basquete" && resumo.league.includes("NBA")) ||
      (selectedSport === "volei" && resumo.league.includes("Superliga"));
    
    const tournamentMatch = selectedTournament === "all" ||
      (selectedTournament === "brasileirao" && resumo.league.includes("Brasileirão")) ||
      (selectedTournament === "libertadores" && resumo.league.includes("Libertadores")) ||
      (selectedTournament === "champions" && resumo.league.includes("Champions"));
    
    const clubMatch = selectedClub === "all" ||
      resumo.homeTeam.includes(selectedClub) ||
      resumo.awayTeam.includes(selectedClub);
    
    return sportMatch && tournamentMatch && clubMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12 px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-stadium">
            Galeria de Resumos
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            A emoção de cada jogo, contada pela torcida
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por esporte, liga, clube ou emoção..."
              className="pl-10 h-12 text-base"
            />
          </div>
          
          <div className="space-y-3 mt-4">
            {/* Esportes */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground font-semibold mr-2">Esportes:</span>
              <Badge 
                variant={selectedSport === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedSport("all")}
              >
                Todos
              </Badge>
              <Badge 
                variant={selectedSport === "futebol" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedSport("futebol")}
              >
                ⚽ Futebol
              </Badge>
              <Badge 
                variant={selectedSport === "basquete" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedSport("basquete")}
              >
                🏀 Basquete
              </Badge>
              <Badge 
                variant={selectedSport === "volei" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedSport("volei")}
              >
                🏐 Vôlei
              </Badge>
            </div>

            {/* Torneios */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground font-semibold mr-2">Torneios:</span>
              <Badge 
                variant={selectedTournament === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedTournament("all")}
              >
                Todos
              </Badge>
              <Badge 
                variant={selectedTournament === "brasileirao" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedTournament("brasileirao")}
              >
                🇧🇷 Brasileirão
              </Badge>
              <Badge 
                variant={selectedTournament === "libertadores" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedTournament("libertadores")}
              >
                🏆 Libertadores
              </Badge>
              <Badge 
                variant={selectedTournament === "champions" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedTournament("champions")}
              >
                🌍 Champions League
              </Badge>
            </div>

            {/* Clubes */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground font-semibold mr-2">Clubes:</span>
              <Badge 
                variant={selectedClub === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedClub("all")}
              >
                Todos
              </Badge>
              <Badge 
                variant={selectedClub === "Palmeiras" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedClub("Palmeiras")}
              >
                Palmeiras
              </Badge>
              <Badge 
                variant={selectedClub === "Flamengo" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedClub("Flamengo")}
              >
                Flamengo
              </Badge>
              <Badge 
                variant={selectedClub === "Lakers" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedClub("Lakers")}
              >
                Lakers
              </Badge>
            </div>
          </div>
        </div>

        {/* Trending */}
        <Card className="bg-card border-border p-6 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Tendências desta semana</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trending.map((item, idx) => (
              <div key={idx} className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="font-semibold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumos Grid */}
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredResumos.length} de {resumos.length} resumos
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumos.map((resumo) => (
            <Card 
              key={resumo.id} 
              className="bg-card border-border overflow-hidden hover:shadow-[0_8px_32px_hsl(var(--card-foreground)/0.2)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              onClick={() => navigate(`/resumo/${resumo.id}`)}
            >
              <div className={`${getSentimentColor(resumo.sentiment)} p-4 text-center`}>
                <span className="text-4xl">{getSentimentEmoji(resumo.sentiment)}</span>
                <p className="text-sm font-semibold mt-2 capitalize">{resumo.sentiment}</p>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{resumo.league}</p>
                  <h3 className="font-bold text-lg">
                    {resumo.homeTeam} <span className="text-primary">{resumo.score}</span> {resumo.awayTeam}
                  </h3>
                </div>
                
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Frase emblemática</p>
                  <p className="font-semibold text-sm">{resumo.topPhrase}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{resumo.messagesCount.toLocaleString()} mensagens</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{resumo.date}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Galeria;
