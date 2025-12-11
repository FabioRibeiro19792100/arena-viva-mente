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
      case "euforia": return "bg-white/10 text-white";
      case "tensao": return "bg-white/10 text-white";
      case "frustracao": return "bg-white/10 text-white";
      default: return "bg-white/10 text-white";
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
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white">
            Game Gallery
          </h1>
          <p className="text-xl text-white/60 max-w-2xl">
            The emotion of each game, told by the fans
          </p>
        </div>

        {/* Search and Filters - Simplificados */}
        <div className="max-w-4xl mx-auto mb-12 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
            <Input
              placeholder="Search by team, league or competition..."
              className="pl-12 h-14 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40"
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
                className="text-sm text-white/60 hover:text-white transition-colors px-3"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Trending */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
          {trending.map((item, idx) => (
            <Card key={idx} className="bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-xs text-white/60">{item.label}</p>
                  <p className="font-semibold text-white">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumos Grid */}
        <div className="mb-4 text-sm text-white/60 max-w-4xl mx-auto">
          {filteredResumos.length === 0 ? (
            <p>No summaries found</p>
          ) : (
            <p>Showing {filteredResumos.length} summar{filteredResumos.length !== 1 ? "ies" : "y"}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredResumos.map((resumo) => (
            <Card 
              key={resumo.id} 
              className="bg-white/5 border border-white/10 overflow-hidden hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)] transition-all duration-300 hover:scale-[1.02] cursor-pointer group backdrop-blur-sm"
              onClick={() => navigate(`/resumo/${resumo.id}`)}
            >
              <div className={`${getSentimentColor(resumo.sentiment)} p-6 text-center transition-transform group-hover:scale-105 bg-white/10`}>
                <span className="text-5xl">{getSentimentEmoji(resumo.sentiment)}</span>
                <p className="text-sm font-semibold mt-3 capitalize text-white">{resumo.sentiment}</p>
              </div>
              <CardContent className="p-5 space-y-4 bg-black/30">
                <div>
                  <p className="text-xs text-white/60 mb-1">{resumo.league}</p>
                  <h3 className="font-bold text-lg text-white">
                    {resumo.homeTeam} <span className="text-white">{resumo.score}</span> {resumo.awayTeam}
                  </h3>
                </div>
                
                <div className="bg-white/5 p-3 border border-white/10">
                  <p className="text-xs text-white/60 mb-1">Emblematic phrase</p>
                  <p className="font-semibold text-sm text-white">{resumo.topPhrase}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
                  <span>{resumo.messagesCount.toLocaleString()} messages</span>
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