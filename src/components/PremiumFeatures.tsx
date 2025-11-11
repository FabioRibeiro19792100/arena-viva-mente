import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap } from "lucide-react";

export const PremiumFeatures = () => {
  const freeFeatures = [
    "Até 50 interações por jogo",
    "Acesso a jogos com vagas disponíveis",
    "Visualizar resumos pós-jogo",
  ];

  const premiumFeatures = [
    "Interações ilimitadas em todos os jogos",
    "Cadeira cativa - acesso garantido mesmo quando lotado",
    "Fixar comentários de perfis favoritos",
    "Badge exclusivo PRO visível para todos",
    "Acesso prioritário a novas funcionalidades",
    "Estatísticas avançadas de participação",
  ];

  return (
    <div className="space-y-6">
      {/* Free Plan */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Plano Gratuito</CardTitle>
            <Badge variant="outline" className="text-muted-foreground">Atual</Badge>
          </div>
          <CardDescription>
            Perfeito para começar a vivenciar os jogos ao vivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {freeFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Premium Plan */}
      <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-card border-accent/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-accent" />
              <CardTitle className="text-xl">Plano Premium</CardTitle>
            </div>
            <Badge className="bg-accent text-accent-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              PRO
            </Badge>
          </div>
          <CardDescription>
            Experiência completa sem limites
          </CardDescription>
          <div className="pt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">R$ 19,90</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)] transition-all">
            <Crown className="mr-2 h-4 w-4" />
            Assinar Premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
