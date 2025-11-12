import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Star, Zap, Shield, Check, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [name, setName] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setShowWelcomeDialog(true);
  };

  const handleContinue = () => {
    setShowWelcomeDialog(false);
    navigate("/arquibancada/1");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-6xl py-16 px-4">
        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-stadium">
            Entre para a Arquibancada Digital
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Faça login e escolha o plano ideal para você
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Login Card */}
          <Card className="bg-card border-border h-fit">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Faça Login</CardTitle>
              <CardDescription className="text-center">
                Escolha sua rede social preferida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" size="lg" onClick={handleLogin}>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Entrar com Google
              </Button>
              
              <Button variant="outline" className="w-full" size="lg" onClick={handleLogin}>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"/>
                </svg>
                Entrar com GitHub
              </Button>
              
              <Button variant="outline" className="w-full" size="lg" onClick={handleLogin}>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Entrar com X
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Opcional</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome / Apelido</Label>
                  <Input
                    id="name"
                    placeholder="Como quer ser chamado?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team">Time do coração</Label>
                  <Input
                    id="team"
                    placeholder="Seu time favorito"
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                Sua Experiência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Após o Login
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">1.</span>
                      <span className="text-foreground/90">Escolha seu jogo favorito</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">2.</span>
                      <span className="text-foreground/90">Reserve seu assento na arquibancada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      <span className="text-foreground/90">Selecione seu time (casa/fora/neutro)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">4.</span>
                      <span className="text-foreground/90">Vibre em tempo real com a torcida!</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    Início Gratuito
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">50 interações por jogo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">Acesso a jogos disponíveis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">Resumos e galeria completa</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planos em Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Compare os Planos</h2>
            <p className="text-muted-foreground">Escolha a melhor experiência para você</p>
          </div>

          <Tabs defaultValue="free" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="free">Plano Gratuito</TabsTrigger>
              <TabsTrigger value="premium" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Crown className="h-4 w-4 mr-1" />
                Plano Premium
              </TabsTrigger>
            </TabsList>

            <TabsContent value="free">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Plano Gratuito</CardTitle>
                    <Badge variant="outline" className="text-muted-foreground">R$ 0/mês</Badge>
                  </div>
                  <CardDescription>
                    Perfeito para começar a vivenciar os jogos ao vivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Até 50 interações por jogo</p>
                        <p className="text-sm text-muted-foreground">Comente e reaja durante as partidas</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Acesso a jogos com vagas disponíveis</p>
                        <p className="text-sm text-muted-foreground">Entre em qualquer jogo que tenha lugares</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Visualizar resumos pós-jogo</p>
                        <p className="text-sm text-muted-foreground">Reviva os melhores momentos na galeria</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="premium">
              <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-card border-accent/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-6 w-6 text-accent" />
                      <CardTitle className="text-2xl">Plano Premium</CardTitle>
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
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Interações ilimitadas em todos os jogos</p>
                        <p className="text-sm text-muted-foreground">Sem limites de comentários e reações</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Cadeira cativa - acesso garantido</p>
                        <p className="text-sm text-muted-foreground">Entre em qualquer jogo, mesmo quando lotado</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Fixar comentários de perfis favoritos</p>
                        <p className="text-sm text-muted-foreground">Destaque seus amigos na arquibancada</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Badge exclusivo PRO visível para todos</p>
                        <p className="text-sm text-muted-foreground">Seja reconhecido na torcida digital</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Acesso prioritário a novas funcionalidades</p>
                        <p className="text-sm text-muted-foreground">Seja o primeiro a testar recursos novos</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Estatísticas avançadas de participação</p>
                        <p className="text-sm text-muted-foreground">Acompanhe suas métricas e engajamento</p>
                      </div>
                    </li>
                  </ul>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)] transition-all" size="lg">
                    <Crown className="mr-2 h-4 w-4" />
                    Assinar Premium
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Bem-vindo à Arquibancada! 🎉
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Você está pronto para vivenciar os jogos em tempo real
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Seu Plano Gratuito inclui:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>50 interações por jogo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Acesso a todos os jogos disponíveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Galeria completa de resumos</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Próximos passos:</p>
              <ol className="text-left space-y-1 max-w-xs mx-auto">
                <li>1. Escolha um jogo ao vivo ou próximo</li>
                <li>2. Reserve seu assento</li>
                <li>3. Selecione seu time preferido</li>
                <li>4. Vibre com a torcida digital! ⚽</li>
              </ol>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              Ir para a Arquibancada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Login;
