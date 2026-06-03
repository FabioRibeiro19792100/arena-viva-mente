import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, TrendingUp, MessageSquare, Clock, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import matchLive from "@/assets/match-live.jpg";
import { isSummaryAvailableForMatch, worldCupMatchMap, worldCupSummaries } from "@/data/worldCup2026";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { addHistoryEntry } from "@/lib/productState";
import { getMatchById } from "@/lib/runtimeMatches";

const Resumo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useMockAuth();
  const runtimeMatch = getMatchById(id);
  const selectedSummary =
    worldCupSummaries.find((item) => item.id === id) ||
    (runtimeMatch
      ? {
          id: runtimeMatch.id,
          homeTeam: runtimeMatch.homeTeam,
          awayTeam: runtimeMatch.awayTeam,
          score: "vs",
          league: `${runtimeMatch.stage} • ${runtimeMatch.league}`,
          date: `${runtimeMatch.date} • ${runtimeMatch.venue}`,
          sentiment: "neutro" as const,
          messagesCount: 0,
          topPhrase: `"${runtimeMatch.homeTeam} x ${runtimeMatch.awayTeam} em ${runtimeMatch.venue}"`,
        }
      : worldCupSummaries[0]);
  const selectedMatch = runtimeMatch || worldCupMatchMap[selectedSummary.id] || worldCupMatchMap["wc2026-07"];
  const isSummaryAvailable = isSummaryAvailableForMatch(selectedMatch);

  useEffect(() => {
    if (!user || !isSummaryAvailable) return;
    void addHistoryEntry(user.id, selectedMatch.id, "resumo");
  }, [isSummaryAvailable, selectedMatch.id, user]);

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

  const resumoMoodLabel = (sentiment: string) => {
    if (sentiment === "euforia") return "euforia";
    if (sentiment === "tensao") return "tensão";
    if (sentiment === "frustracao") return "frustração";
    return "neutralidade";
  };

  // Mock data
  const resumo = {
    game: {
      homeTeam: selectedMatch.homeTeam,
      awayTeam: selectedMatch.awayTeam,
      homeScore: "",
      awayScore: "",
      league: `${selectedMatch.league} • ${selectedMatch.stage}`,
      date: `${selectedMatch.date} • ${selectedMatch.venue}`,
      image: matchLive,
    },
    stats: {
      source: "Tabela oficial da FIFA 2026",
      mode: "Highlights empacotados por IA",
      validation: "Timeline pos-jogo",
      duration: "Pos-jogo",
    },
    mood: {
      dominant: selectedSummary.sentiment === "euforia" ? "Euforia" : selectedSummary.sentiment === "tensao" ? "Tensão" : selectedSummary.sentiment === "frustracao" ? "Frustração" : "Neutro",
      emoji: selectedSummary.sentiment === "euforia" ? "🔥" : selectedSummary.sentiment === "tensao" ? "😤" : selectedSummary.sentiment === "frustracao" ? "😓" : "😐",
      percentage: 0,
    },
    topMoments: [
      { time: "12'", text: `${selectedMatch.homeTeam} x ${selectedMatch.awayTeam} concentrou os picos de reacao da sala logo no inicio.`, reactions: 847 },
      { time: "54'", text: `A conversa subiu quando o jogo virou o foco principal da comunidade em ${selectedMatch.venue}.`, reactions: 623 },
      { time: "88'", text: selectedSummary.topPhrase.replaceAll('"', ""), reactions: 591 },
    ],
    phrases: [
      selectedSummary.topPhrase.replaceAll('"', ""),
      `Clima de ${resumoMoodLabel(selectedSummary.sentiment)}`,
      `${selectedMatch.stage} em ${selectedMatch.date}`,
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

  if (!isSummaryAvailable) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <div className="container max-w-4xl mx-auto py-32 px-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/booking/${selectedMatch.id}`)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            ← Voltar para o jogo
          </Button>

          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardContent className="p-8 md:p-10 space-y-4">
              <Badge variant="outline" className="border-border bg-muted/45 text-muted-foreground">
                Highlights com IA
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Esse resumo so entra depois do fim do jogo
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Os highlights aparecem só depois do apito final e entram no fluxo da própria partida.
              </p>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/booking/${selectedMatch.id}`)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          ← Voltar para o jogo
        </Button>

        {/* Cabeçalho */}
        <div className="relative h-64 overflow-hidden mb-8">
          <img
            src={resumo.game.image}
            alt="Game"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <p className="mb-2 text-sm text-muted-foreground">{resumo.game.league} • {resumo.game.date}</p>
            <h1 className="mb-2 text-4xl font-bold text-foreground">
              {resumo.game.homeTeam} <span className="text-muted-foreground">vs</span> {resumo.game.awayTeam}
            </h1>
            <p className="text-lg text-muted-foreground">
              Leitura da conversa, clima da sala e momentos que marcaram o jogo.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={handleShare} className="flex-1 sm:flex-none">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar resumo
          </Button>
          <Badge variant="secondary" className="px-4 text-sm bg-primary/10 text-primary">
            <Clock className="mr-2 h-4 w-4" />
            Disponível por 24h
          </Badge>
        </div>

        <Card className="mb-6 border-border/80 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Síntese da arquibancada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {splitIntoParagraphs(
                `Este resumo aparece como uma camada de highlights empacotada por IA depois que o evento termina. ${selectedMatch.homeTeam} e ${selectedMatch.awayTeam} entram aqui como uma partida ja consumida pela comunidade, com leitura do clima da sala, momentos mais citados e frases que marcaram a conversa. A ideia nao e abrir uma secao paralela, mas registrar o que ficou daquele jogo dentro do proprio fluxo do produto. Heart, passion and stadium on fire.`
              ).map((paragraph, index) => {
                // Processa o parágrafo para destacar "Heart, passion and stadium on fire"
                const parts = paragraph.split('Heart, passion and stadium on fire');
                return (
                  <p key={index} className="text-base leading-relaxed text-muted-foreground">
                    {parts.length > 1 ? (
                      <>
                        {parts[0]}
                        <strong className="text-foreground">Heart, passion and stadium on fire</strong>
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
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-4xl">{resumo.mood.emoji}</span>
                Humor dominante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-3xl font-bold text-foreground">{resumo.mood.dominant}</p>
              <p className="text-muted-foreground">
                Leitura qualitativa do clima que ficou do evento
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fonte</span>
                <span className="font-bold text-foreground">{resumo.stats.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modo</span>
                <span className="font-bold text-foreground">{resumo.stats.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validação</span>
                <span className="font-bold text-foreground">{resumo.stats.validation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-bold text-foreground">{resumo.stats.duration}</span>
              </div>
            </CardContent>
          </Card>

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
                    <div className="flex items-center gap-1 text-xs text-white/60">Marco</div>
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
