import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Crown, Shield, Star, Users, Zap } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMockAuth, type MockPlan } from "@/contexts/MockAuthContext";
import { worldCup2026Matches } from "@/data/worldCup2026";

const freeFeatures = [
  {
    title: "Acesso a todas as salas disponíveis",
    description: "Navegue pelos jogos da Copa de 2026 com uma única conta.",
  },
  {
    title: "Highlights empacotados por IA no pós-jogo",
    description: "Abra os resumos depois que cada partida terminar.",
  },
  {
    title: "Favoritos, reservas e histórico",
    description: "Sua atividade fica sincronizada com a sua conta.",
  },
];

const premiumFeatures = [
  {
    title: "Acesso prioritário quando a sala lotar",
    description: "Entre nas partidas mais disputadas com menos atrito.",
  },
  {
    title: "Ferramentas ampliadas de arquibancada",
    description: "Fixe vozes favoritas e tenha uma experiência social mais completa.",
  },
  {
    title: "Experiência premium da arquibancada",
    description: "Ganhe uma camada mais completa de presença e participação.",
  },
];

const planStyles: Record<MockPlan, string> = {
  free: "border-border bg-card text-card-foreground",
  premium: "border-primary/25 bg-gradient-to-br from-card to-primary/5 text-card-foreground",
};

const Login = () => {
  const [name, setName] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<MockPlan>("free");
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, mode, user } = useMockAuth();
  const redirectTo = location.state?.from || `/arquibancada/${worldCup2026Matches[0].id}`;

  useEffect(() => {
    if (isAuthenticated && !showWelcomeDialog) {
      setName(user?.name || "");
      setFavoriteTeam(user?.favoriteTeam || "");
      setSelectedPlan(user?.plan || "free");
    }
  }, [isAuthenticated, showWelcomeDialog, user]);

  useEffect(() => {
    if (mode === "supabase" && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, mode, navigate, redirectTo]);

  const handleLogin = () => {
    login({
      provider: "google",
      name,
      favoriteTeam,
      plan: selectedPlan,
    });

    if (mode === "mock") {
      setShowWelcomeDialog(true);
    }
  };

  const handleContinue = () => {
    setShowWelcomeDialog(false);
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="container mx-auto max-w-7xl px-6 py-20 md:py-24">
        <div className="mb-12 max-w-4xl space-y-4">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 px-3 py-1 text-primary">
            Arena Tikitaka
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Sua arquibancada para a Copa do Mundo de 2026.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Reserve seu lugar, acompanhe cada partida ao vivo e volte para os highlights depois do jogo.
          </p>
        </div>

        <div className="mb-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>Use sua conta para salvar salas, reservas e histórico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center border-border bg-background text-foreground hover:bg-muted"
                onClick={handleLogin}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Entrar com Google
              </Button>

              <div className="rounded-2xl border border-border bg-muted/45 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Configuração opcional do perfil
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome / apelido</Label>
                    <Input
                      id="name"
                      placeholder="Como a arquibancada deve te ver?"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="border-border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team">Time favorito</Label>
                    <Input
                      id="team"
                      placeholder="Time favorito opcional"
                      value={favoriteTeam}
                      onChange={(event) => setFavoriteTeam(event.target.value)}
                      className="border-border bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  O que acontece depois do login
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-semibold text-foreground">1.</span>
                    Abra qualquer sala de partida da agenda oficial de 2026.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-semibold text-foreground">2.</span>
                    Reserve acesso, favorite jogos e mantenha sua atividade sincronizada.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-semibold text-foreground">3.</span>
                    Escolha um lado na arquibancada e entre na conversa ao vivo.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Star className="h-5 w-5 text-primary" />
                Compare os planos
              </CardTitle>
              <CardDescription>Veja os dois lados da experiência antes de entrar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-3xl border p-5 transition-colors ${planStyles.free}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Gratuito</p>
                    <h3 className="mt-2 text-2xl font-bold">$0</h3>
                    <p className="text-sm text-muted-foreground">Uma forma simples de entrar e acompanhar os jogos.</p>
                  </div>
                  {selectedPlan === "free" && (
                    <Badge className="bg-primary text-primary-foreground">Selecionado</Badge>
                  )}
                </div>
                <ul className="space-y-4">
                  {freeFeatures.map((feature) => (
                    <li key={feature.title} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{feature.title}</p>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={selectedPlan === "free" ? "default" : "outline"}
                  className="mt-6 w-full"
                  onClick={() => setSelectedPlan("free")}
                >
                  Usar gratuito
                </Button>
              </div>

              <div className={`rounded-3xl border p-5 transition-colors ${planStyles.premium}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Premium</p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-2xl font-bold">$19.90</span>
                      <span className="pb-0.5 text-sm text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Mais presença, mais prioridade e mais ferramentas na sala.</p>
                  </div>
                  <Badge className="gap-1 bg-accent text-accent-foreground">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                </div>
                <ul className="space-y-4">
                  {premiumFeatures.map((feature) => (
                    <li key={feature.title} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{feature.title}</p>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={selectedPlan === "premium" ? "default" : "outline"}
                  className="mt-6 w-full"
                  onClick={() => setSelectedPlan("premium")}
                >
                  Escolher premium
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-[var(--shadow-card)]">
          <CardContent className="grid gap-6 p-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Como funciona
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-semibold text-foreground">1.</span>
                  Escolha o jogo e entre na sala sem excesso de provedores.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-semibold text-foreground">2.</span>
                  Salve favoritos, reservas e atividade recente automaticamente.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-semibold text-foreground">3.</span>
                  Veja os resumos depois do jogo terminar, nunca antes de começar.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                O que está disponível
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Catálogo completo de jogos da Copa de 2026.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Reservas, favoritos e histórico ligados à sua conta.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Highlights pós-jogo e salas de conversa por partida.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Bem-vindo à Arena Tikitaka</DialogTitle>
            <DialogDescription className="pt-2 text-center">
              Sua conta está pronta. Vamos entrar na sala.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/45 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <Star className="h-4 w-4 text-primary" />
                Sua conta
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Login: Google</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Plano: {selectedPlan === "premium" ? "Premium" : "Gratuito"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Perfil: {user?.name || name || "Torcedor 2026"}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Suas salas, reservas e highlights agora ficam ligados a esta conta.
            </div>

            <Button className="w-full" onClick={handleContinue}>
              Continuar para a arquibancada
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Login;
