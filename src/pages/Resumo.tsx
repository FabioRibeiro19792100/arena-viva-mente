import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

  // Função para quebrar texto em parágrafos por ponto final
  const splitIntoParagraphs = (text: string) => {
    // Quebra por ponto final seguido de espaço e letra maiúscula
    // Regex: ponto final, um ou mais espaços, seguido de letra maiúscula
    const regex = /\.\s+(?=[A-Z])/g;
    const parts = text.split(regex);
    
    // Adiciona o ponto final de volta a cada parte (exceto a última)
    const paragraphs = parts.map((part, index) => {
      const trimmed = part.trim();
      if (trimmed.length === 0) return '';
      // Se não for a última parte, adiciona o ponto final
      if (index < parts.length - 1) {
        return trimmed.endsWith('.') ? trimmed : trimmed + '.';
      }
      return trimmed;
    });
    
    return paragraphs.filter(p => p.length > 0);
  };

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
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/galeria")}
          className="mb-6 text-white/60 hover:text-white"
        >
          ← Back to gallery
        </Button>

        {/* Cabeçalho */}
        <div className="relative h-64 overflow-hidden mb-8">
          <img
            src={resumo.game.image}
            alt="Game"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <p className="text-sm text-white/60 mb-2">{resumo.game.league} • {resumo.game.date}</p>
            <h1 className="text-4xl font-bold mb-2 text-white">
              {resumo.game.homeTeam} {resumo.game.homeScore} <span className="text-white/40">x</span> {resumo.game.awayScore} {resumo.game.awayTeam}
            </h1>
            <p className="text-lg text-white/60">
              {resumo.stats.totalMessages.toLocaleString()} messages analyzed in {resumo.stats.duration}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={handleShare} className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90">
            <Share2 className="mr-2 h-4 w-4" />
            Share summary
          </Button>
          <Badge variant="secondary" className="text-sm px-4 bg-white/10 text-white border-white/20">
            <Clock className="mr-2 h-4 w-4" />
            Available for 24h
          </Badge>
        </div>

        {/* Sinopse Narrativa */}
        <Card className="mb-6 bg-white/5 border border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5 text-white" />
              Stadium Synopsis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {splitIntoParagraphs(
                `An epic night at Allianz Parque. The team started slow, but the fans kept the faith. At 23', a stunning goal silenced the critics - the stadium exploded. Tension returned at 67' when the referee sent off our defender in a controversial play: words of outrage echoed through the timeline. In stoppage time, fans held their breath with every ball, every "HOLD ON" plea to the goalkeeper. Final whistle, 2x1. Heart, passion and stadium on fire. A spectacle on and off the field.`
              ).map((paragraph, index) => {
                // Processa o parágrafo para destacar "Heart, passion and stadium on fire"
                const parts = paragraph.split('Heart, passion and stadium on fire');
                return (
                  <p key={index} className="text-base leading-relaxed text-white/80">
                    {parts.length > 1 ? (
                      <>
                        {parts[0]}
                        <strong className="text-white">Heart, passion and stadium on fire</strong>
                        {parts[1]}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Humor Dominante */}
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-4xl">{resumo.mood.emoji}</span>
                Dominant Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2 text-white">{resumo.mood.dominant}</p>
              <p className="text-white/60">
                {resumo.mood.percentage}% of messages expressed this emotion
              </p>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-white" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Total messages</span>
                <span className="font-bold text-white">{resumo.stats.totalMessages.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Peak viewers</span>
                <span className="font-bold text-white">{resumo.stats.peakUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg response time</span>
                <span className="font-bold text-white">{resumo.stats.avgResponseTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Duration</span>
                <span className="font-bold text-white">{resumo.stats.duration}</span>
              </div>
            </CardContent>
          </Card>

          {/* Lances Mais Citados */}
          <Card className="md:col-span-2 bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Flame className="h-5 w-5 text-white" />
                Most Mentioned Moments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumo.topMoments.map((moment, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-4 bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <Badge variant="live" className="mb-1">{moment.time}</Badge>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <MessageSquare className="h-3 w-3" />
                      {moment.reactions}
                    </div>
                  </div>
                  <p className="text-sm font-medium flex-1 text-white">{moment.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Frases Emblemáticas */}
          <Card className="md:col-span-2 bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="h-5 w-5 text-white" />
                Emblematic Phrases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {resumo.phrases.map((phrase, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-white/5 border border-white/10 text-center"
                  >
                    <p className="font-bold text-lg text-white">&ldquo;{phrase}&rdquo;</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Picos de Atividade */}
          <Card className="md:col-span-2 bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Activity Peaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-32">
                {resumo.activityPeaks.map((peak, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-white rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${peak.intensity}%` }}
                    />
                    <span className="text-xs font-medium text-white">{peak.time}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/60 text-center mt-4">
                Moments where fans interacted the most
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Resumo;
