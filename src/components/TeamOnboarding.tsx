import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, MessageSquare, Shield } from "lucide-react";

interface TeamOnboardingProps {
  open: boolean;
  onComplete: (team: "home" | "away" | "neutral") => void;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

export const TeamOnboarding = ({
  open,
  onComplete,
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
}: TeamOnboardingProps) => {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | "neutral" | null>(null);

  const handleComplete = (team: "home" | "away" | "neutral" | null = selectedTeam) => {
    onComplete(team || "neutral");
  };

  const teamOptions = [
    { value: "home" as const, label: homeTeam, logo: homeTeamLogo, icon: Shield },
    { value: "away" as const, label: awayTeam, logo: awayTeamLogo, icon: Shield },
    { value: "neutral" as const, label: "Neutro", logo: null, icon: null },
  ];

  const infoRows = [
    {
      icon: MessageSquare,
      title: "Comente em tempo real",
      description: "Compartilhe reações com outros torcedores",
    },
    {
      icon: Shield,
      title: "Respeite as regras",
      description: "A moderação mantém a conversa saudável",
    },
    {
      icon: CheckCircle2,
      title: "Recursos da sala",
      description: "Filtre por torcida e acompanhe o fluxo ao vivo",
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleComplete("neutral");
        }
      }}
    >
      <DialogContent
        className="w-[min(92vw,420px)] border-border bg-background p-5 shadow-[var(--shadow-card)]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {teamOptions.map((option) => {
              const isActive = selectedTeam === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedTeam(option.value)}
                  className={`flex min-h-[84px] flex-col items-center justify-center gap-3 px-2 py-2 text-center transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.logo ? (
                    <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-all">
                      <img
                        src={option.logo}
                        alt={option.label}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                        isActive ? "bg-foreground/10" : "bg-muted/50"
                      }`}
                    >
                      <span className="relative block h-6 w-6 rounded-full bg-slate-500/70">
                        <span className="absolute left-1/2 top-1/2 h-[2px] w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-background/90" />
                      </span>
                    </span>
                  )}
                  <span className="text-sm font-medium leading-tight">{option.label}</span>
                  <span
                    className={`h-px w-10 transition-colors ${
                      isActive ? "bg-foreground/70" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {infoRows.map((row) => {
              const Icon = row.icon;

              return (
                <div key={row.title} className="grid min-h-[64px] grid-cols-[32px_minmax(0,1fr)] items-start gap-3 border border-border/70 px-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-border bg-muted/35">
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-1">
            <Button
              type="button"
              onClick={() => handleComplete()}
              variant="outline"
              size="icon"
              disabled={!selectedTeam}
              className="flex h-10 w-10 items-center justify-center border-border bg-background text-foreground hover:bg-muted"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
