import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");

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
    { label: "Mais comentado", value: "Palmeiras x Grêmio", emoji: "💬" },
    { label: "Maior euforia", value: "Lakers x Celtics", emoji: "🔥" },
    { label: "Momento mais tenso", value: "Real x Barcelona", emoji: "😤" },
  ];

  // Filtros simplificados
  const filteredResumos = resumos.filter((resumo) => {
    const searchMatch = searchQuery === "" ||
      resumo.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resumo.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resumo.league.toLowerCase().includes(searchQuery.toLowerCase());

    const sportMatch = selectedSport === "all" || 
      (selectedSport === "futebol" && (resumo.league.includes("Brasileirão") || resumo.league.includes("Libertadores") || resumo.league.includes("Champions"))) ||
      (selectedSport === "basquete" && resumo.league.includes("NBA")) ||
      (selectedSport === "volei" && resumo.league.includes("Superliga"));
    
    const sentimentMatch = selectedSentiment === "all" || resumo.sentiment === selectedSentiment;
    
    return searchMatch && sportMatch && sentimentMatch;
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

        {/* Search and Filters - Simplificados */}
        <div className="max-w-4xl mx-auto mb-12 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por time, liga ou competição..."
              className="pl-12 h-14 text-lg rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="Esporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos esportes</SelectItem>
                <SelectItem value="futebol">⚽ Futebol</SelectItem>
                <SelectItem value="basquete">🏀 Basquete</SelectItem>
                <SelectItem value="volei">🏐 Vôlei</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="Sentimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos sentimentos</SelectItem>
                <SelectItem value="euforia">🔥 Euforia</SelectItem>
                <SelectItem value="tensao">😤 Tensão</SelectItem>
                <SelectItem value="frustracao">😓 Frustração</SelectItem>
                <SelectItem value="neutro">😐 Neutro</SelectItem>
              </SelectContent>
            </Select>

            {(selectedSport !== "all" || selectedSentiment !== "all" || searchQuery) && (
              <button 
                onClick={() => {
                  setSelectedSport("all");
                  setSelectedSentiment("all");
                  setSearchQuery("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Trending */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
          {trending.map((item, idx) => (
            <Card key={idx} className="bg-card/50 border-border hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-semibold">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumos Grid */}
        <div className="mb-4 text-sm text-muted-foreground max-w-4xl mx-auto">
          {filteredResumos.length === 0 ? (
            <p>Nenhum resumo encontrado</p>
          ) : (
            <p>Mostrando {filteredResumos.length} resumo{filteredResumos.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredResumos.map((resumo) => (
            <Card 
              key={resumo.id} 
              className="bg-card border-border overflow-hidden hover:shadow-[0_8px_32px_hsl(var(--card-foreground)/0.2)] transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              onClick={() => navigate(`/resumo/${resumo.id}`)}
            >
              <div className={`${getSentimentColor(resumo.sentiment)} p-6 text-center transition-transform group-hover:scale-105`}>
                <span className="text-5xl">{getSentimentEmoji(resumo.sentiment)}</span>
                <p className="text-sm font-semibold mt-3 capitalize">{resumo.sentiment}</p>
              </div>
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{resumo.league}</p>
                  <h3 className="font-bold text-lg">
                    {resumo.homeTeam} <span className="text-primary">{resumo.score}</span> {resumo.awayTeam}
                  </h3>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Frase emblemática</p>
                  <p className="font-semibold text-sm">{resumo.topPhrase}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
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