import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  likes: number;
  dislikes: number;
}

const Arquibancada = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(false);

  // Mock data
  const [messages] = useState<Message[]>([
    {
      id: "1",
      user: "João Torcedor",
      content: "QUE GOLAÇO!!! VAMOS PALMEIRAS!!!",
      timestamp: new Date(Date.now() - 30000),
      likes: 45,
      dislikes: 2,
    },
    {
      id: "2",
      user: "Maria Silva",
      content: "Juiz tá roubando demais, absurdo esse lance",
      timestamp: new Date(Date.now() - 25000),
      likes: 28,
      dislikes: 15,
    },
    {
      id: "3",
      user: "Pedro Santos",
      content: "Vai dar tempo de virar ainda, FÉ NO PAI",
      timestamp: new Date(Date.now() - 15000),
      likes: 67,
      dislikes: 3,
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim() && !cooldown) {
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl py-6 px-4">
        {/* Match Header */}
        <Card className="bg-card border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge variant="live" className="mb-2">🟢 Ao vivo - 78'</Badge>
              <h1 className="text-2xl font-bold">Palmeiras 2 x 1 Grêmio</h1>
              <p className="text-sm text-muted-foreground">Brasileirão Série A - Allianz Parque</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">2.984 torcedores</span>
              </div>
              <Badge variant="outline" className="gap-2">
                <Brain className="h-3 w-3" />
                <span className="text-xs">IA moderando</span>
              </Badge>
            </div>
          </div>

          {/* Sponsor Banner */}
          <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold">🍺 Arena Brahma — 20% off até o apito final</p>
          </div>
        </Card>

        {/* Messages Timeline */}
        <div className="space-y-3 mb-6">
          {messages.map((msg) => (
            <Card key={msg.id} className="bg-card border-border p-4 hover:bg-card/80 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{msg.user}</p>
                  <p className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs">{msg.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs">{msg.dislikes}</span>
                  </button>
                </div>
              </div>
              <p className="text-foreground">{msg.content}</p>
            </Card>
          ))}
        </div>

        {/* Message Input */}
        <Card className="bg-card border-border p-4 sticky bottom-6">
          <div className="flex gap-2">
            <Input
              placeholder="Escreva seu grito de arquibancada… (máx. 180 caracteres)"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 180))}
              maxLength={180}
              disabled={cooldown}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              variant="stadium" 
              size="icon"
              onClick={handleSendMessage}
              disabled={cooldown || !message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{message.length}/180</span>
            {cooldown && (
              <span className="text-accent">⏱️ Respira, torcida! Espere um pouco antes de enviar de novo.</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Arquibancada;
