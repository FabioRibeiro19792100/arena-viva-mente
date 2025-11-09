import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, TrendingUp, MessageSquare, Clock, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import matchLive from "@/assets/match-live.jpg";

const Resumo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data
  const resumo = {
    game: {
      homeTeam: "Palmeiras",
      awayTeam: "Grêmio",
      homeScore: 2,
      awayScore: 1,
      league: "Brasileirão Série A",
      date: "08 Jan 2025",
      image: matchLive,
    },
    stats: {
      totalMessages: 4128,
      peakUsers: 2847,
      avgResponseTime: "12s",
      duration: "90min",
    },
    mood: {
      dominant: "Euforia",
      emoji: "🔥",
      percentage: 68,
    },
    topMoments: [
      { time: "23'", text: "GOL DO VERDÃO! RONY RÚSTICO CALOU O ESTÁDIO!", reactions: 847 },
      { time: "67'", text: "EXPULSÃO! JUIZ MALUCO, ISSO É ROUBO!", reactions: 623 },
      { time: "89'", text: "SEGURA ESSA BOLA GOLEIRO, PELO AMOR DE DEUS", reactions: 591 },
    ],
    phrases: [
      "VERDÃO IMPARÁVEL HOJE",
      "Esse time tem raça demais",
      "ABEL FERREIRA GENIAL",
    ],
    activityPeaks: [
      { time: "23'", intensity: 95 },
      { time: "45'", intensity: 72 },
      { time: "67'", intensity: 88 },
      { time: "89'", intensity: 91 },
    ],
  };

  const handleShare = () => {
    toast({
      title: "Link copiado!",
      description: "Compartilhe esse resumo com sua torcida.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-5xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/galeria")}
          className="mb-6"
        >
          ← Voltar para galeria
        </Button>

        {/* Cabeçalho */}
        <div className="relative h-64 rounded-lg overflow-hidden mb-8">
          <img
            src={resumo.game.image}
            alt="Game"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <p className="text-sm text-muted-foreground mb-2">{resumo.game.league} • {resumo.game.date}</p>
            <h1 className="text-4xl font-bold mb-2">
              {resumo.game.homeTeam} {resumo.game.homeScore} <span className="text-muted-foreground">x</span> {resumo.game.awayScore} {resumo.game.awayTeam}
            </h1>
            <p className="text-lg text-muted-foreground">
              {resumo.stats.totalMessages.toLocaleString()} mensagens analisadas em {resumo.stats.duration}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={handleShare} className="flex-1 sm:flex-none">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar resumo
          </Button>
          <Badge variant="secondary" className="text-sm px-4">
            <Clock className="mr-2 h-4 w-4" />
            Disponível por 24h
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Humor Dominante */}
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-4xl">{resumo.mood.emoji}</span>
                Humor Dominante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{resumo.mood.dominant}</p>
              <p className="text-muted-foreground">
                {resumo.mood.percentage}% das mensagens expressaram essa emoção
              </p>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensagens totais</span>
                <span className="font-bold">{resumo.stats.totalMessages.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pico de torcedores</span>
                <span className="font-bold">{resumo.stats.peakUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo médio de resposta</span>
                <span className="font-bold">{resumo.stats.avgResponseTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-bold">{resumo.stats.duration}</span>
              </div>
            </CardContent>
          </Card>

          {/* Lances Mais Citados */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Lances Mais Citados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumo.topMoments.map((moment, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-4 rounded-lg bg-card-hover border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <Badge variant="live" className="mb-1">{moment.time}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {moment.reactions}
                    </div>
                  </div>
                  <p className="text-sm font-medium flex-1">{moment.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Frases Emblemáticas */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Frases Emblemáticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {resumo.phrases.map((phrase, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center"
                  >
                    <p className="font-bold text-lg">&ldquo;{phrase}&rdquo;</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Picos de Atividade */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Picos de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-32">
                {resumo.activityPeaks.map((peak, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-primary-glow rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${peak.intensity}%` }}
                    />
                    <span className="text-xs font-medium">{peak.time}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Momentos onde a torcida mais interagiu
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Resumo;
