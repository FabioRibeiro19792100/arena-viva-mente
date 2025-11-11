import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              ⚽ Futebol
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              🏀 Basquete
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              🏐 Vôlei
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              🇧🇷 Brasileirão
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              🏆 Libertadores
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              🌍 Champions League
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Palmeiras
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Flamengo
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Lakers
            </Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumos.map((resumo) => (
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
    </div>
  );
};

export default Galeria;
