import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumFeatures } from "@/components/PremiumFeatures";
import { Crown, Star, Zap, Shield, Pin, MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [name, setName] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simula login e redireciona para um jogo
    navigate("/arquibancada/1");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-5xl py-16 px-4">
        {/* Hero explicativo */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-stadium">
            Sua jornada na Arquibancada Digital
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Do login ao grito de gol: veja como funciona
          </p>
          
          {/* Fluxo visual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold text-lg">1</div>
                <h3 className="font-semibold text-sm mb-1">Entre</h3>
                <p className="text-xs text-muted-foreground">Login rápido com Google ou GitHub</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold text-lg">2</div>
                <h3 className="font-semibold text-sm mb-1">Escolha</h3>
                <p className="text-xs text-muted-foreground">Selecione seu time e reserve seu lugar</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold text-lg">3</div>
                <h3 className="font-semibold text-sm mb-1">Vibre</h3>
                <p className="text-xs text-muted-foreground">Comente e reaja com a torcida</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold text-lg">4</div>
                <h3 className="font-semibold text-sm mb-1">Reviva</h3>
                <p className="text-xs text-muted-foreground">Veja resumos emocionais pós-jogo</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Login Card */}
          <Card className="bg-card border-border h-fit">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Entre para a arquibancada</CardTitle>
            <CardDescription className="text-center">
              Um só login, milhares de emoções ao vivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full" size="lg" onClick={handleLogin}>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
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
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Informações opcionais</span>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome / Apelido</Label>
                <Input
                  id="name"
                  placeholder="Como você quer ser chamado?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team">Time do coração</Label>
                <Input
                  id="team"
                  placeholder="Qual time você torce?"
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                />
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 space-y-3 border border-primary/20">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                Com o login você pode:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/90">Reservar assentos antecipadamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/90">Receber alertas de partidas do seu time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/90">Salvar e explorar resumos pós-jogo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">⚡</span>
                  <span className="text-foreground/90"><strong>50 interações por jogo</strong> no plano gratuito</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-accent" />
              <h2 className="text-2xl font-bold">Quer a experiência completa?</h2>
            </div>
            <p className="text-muted-foreground">
              Com o Premium, você vive cada jogo sem limites:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                <CardContent className="p-4 space-y-2">
                  <MessageSquare className="h-8 w-8 text-accent" />
                  <h3 className="font-semibold text-sm">Interações ilimitadas</h3>
                  <p className="text-xs text-muted-foreground">Participe sem restrições em todos os jogos</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                <CardContent className="p-4 space-y-2">
                  <Shield className="h-8 w-8 text-accent" />
                  <h3 className="font-semibold text-sm">Cadeira cativa</h3>
                  <p className="text-xs text-muted-foreground">Acesso garantido mesmo quando lotado</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                <CardContent className="p-4 space-y-2">
                  <Pin className="h-8 w-8 text-accent" />
                  <h3 className="font-semibold text-sm">Fixar comentários</h3>
                  <p className="text-xs text-muted-foreground">Destaque perfis favoritos na arquibancada</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                <CardContent className="p-4 space-y-2">
                  <Zap className="h-8 w-8 text-accent" />
                  <h3 className="font-semibold text-sm">Badge PRO exclusivo</h3>
                  <p className="text-xs text-muted-foreground">Seja reconhecido na torcida digital</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <PremiumFeatures />
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
