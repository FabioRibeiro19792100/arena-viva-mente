import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, Heart, Shield } from "lucide-react";

interface TeamOnboardingProps {
  open: boolean;
  onComplete: (team: "home" | "away" | "neutral") => void;
  homeTeam: string;
  awayTeam: string;
}

export const TeamOnboarding = ({ open, onComplete, homeTeam, awayTeam }: TeamOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | "neutral" | null>(null);

  const handleTeamSelect = (team: "home" | "away" | "neutral") => {
    setSelectedTeam(team);
    setStep(2);
  };

  const handleComplete = () => {
    if (selectedTeam) {
      onComplete(selectedTeam);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Escolha sua torcida
              </DialogTitle>
              <p className="text-center text-muted-foreground mt-2">
                Para melhor experiência, selecione seu time do coração nesta partida
              </p>
            </DialogHeader>

            <div className="space-y-3 py-6">
              <button
                onClick={() => handleTeamSelect("home")}
                className="w-full p-6 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-lg">{homeTeam}</p>
                    <p className="text-sm text-muted-foreground">Time da casa</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTeamSelect("away")}
                className="w-full p-6 border-2 border-border hover:border-accent hover:bg-accent/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-lg">{awayTeam}</p>
                    <p className="text-sm text-muted-foreground">Time visitante</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTeamSelect("neutral")}
                className="w-full p-6 border-2 border-border hover:border-muted-foreground hover:bg-muted transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted flex items-center justify-center group-hover:bg-muted-foreground/20 transition-colors">
                    <Heart className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-lg">Neutro</p>
                    <p className="text-sm text-muted-foreground">Sem torcida específica</p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Bem-vindo à Arquibancada! 🎉
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {selectedTeam === "home" && homeTeam}
                  {selectedTeam === "away" && awayTeam}
                  {selectedTeam === "neutral" && "Neutro"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Comente em tempo real</p>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe suas reações com outros torcedores durante o jogo
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Respeite as regras</p>
                    <p className="text-sm text-muted-foreground">
                      IA moderadora mantém ambiente saudável para todos
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">Recursos PRO</p>
                    <p className="text-sm text-muted-foreground">
                      Fixe comentários e filtre por torcida com plano PRO
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleComplete} 
                className="w-full h-12 text-base"
                size="lg"
              >
                Entrar na Arquibancada
              </Button>
            </div>
          </>
        )}

        <div className="flex justify-center gap-2 pb-2">
          <div className={`w-2 h-2 transition-colors ${step === 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-2 h-2 transition-colors ${step === 2 ? "bg-primary" : "bg-muted"}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
