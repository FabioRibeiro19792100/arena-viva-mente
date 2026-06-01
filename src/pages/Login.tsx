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
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMockAuth, type MockAuthProvider, type MockPlan } from "@/contexts/MockAuthContext";
import { worldCup2026Matches } from "@/data/worldCup2026";

const Login = () => {
  const [name, setName] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<MockAuthProvider>("google");
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

  const handleLogin = (provider: MockAuthProvider) => {
    setSelectedProvider(provider);
    login({
      provider,
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
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container max-w-7xl mx-auto py-32 px-6">
        {/* Hero */}
        <div className="mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white">
            Join Arena Viva Mente
          </h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Sign in and choose the perfect plan for you
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Login Card */}
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm h-fit">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-white">Sign In</CardTitle>
              <CardDescription className="text-center text-white/60">
                Choose your preferred social network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10" size="lg" onClick={() => handleLogin("google")}>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
              
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10" size="lg" onClick={() => handleLogin("github")}>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"/>
                </svg>
                Sign in with GitHub
              </Button>
              
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10" size="lg" onClick={() => handleLogin("x")}>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Sign in with X
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-white/60">Optional</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Name / Nickname</Label>
                  <Input
                    id="name"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-white">Favorite Team</Label>
                  <Input
                    id="team"
                    placeholder="Your favorite team"
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="h-5 w-5 text-white" />
                Your Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Users className="h-4 w-4 text-white" />
                    After Login
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-white">1.</span>
                      <span className="text-white/80">Choose your favorite game</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white">2.</span>
                      <span className="text-white/80">Reserve your stadium seat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white">3.</span>
                      <span className="text-white/80">Select your team (home/away/neutral)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white">4.</span>
                      <span className="text-white/80">Cheer in real-time with the fans!</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Zap className="h-4 w-4 text-white" />
                    Free Start
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                      <span className="text-white/80">50 interactions per game</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                      <span className="text-white/80">Access to available games</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                      <span className="text-white/80">Resumos anexados a cada jogo</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planos em Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-white">Compare Plans</h2>
            <p className="text-white/60">Choose the best experience for you</p>
          </div>

          <Tabs
            defaultValue="free"
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as MockPlan)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="free">Plano Gratuito</TabsTrigger>
              <TabsTrigger value="premium" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Crown className="h-4 w-4 mr-1" />
                Plano Premium
              </TabsTrigger>
            </TabsList>

            <TabsContent value="free">
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-white">Free Plan</CardTitle>
                    <Badge variant="outline" className="text-white/60 border-white/20">$0/month</Badge>
                  </div>
                  <CardDescription className="text-white/60">
                    Perfect to start experiencing live games
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Up to 50 interactions per game</p>
                        <p className="text-sm text-white/60">Comment and react during matches</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Access to games with available seats</p>
                        <p className="text-sm text-white/60">Join any game that has spots</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">View post-game summaries</p>
                        <p className="text-sm text-white/60">Veja os highlights empacotados por IA depois do jogo</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="premium">
              <Card className="bg-white/5 border border-white/20 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-6 w-6 text-white" />
                      <CardTitle className="text-2xl text-white">Premium Plan</CardTitle>
                    </div>
                    <Badge className="bg-white text-black flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      PRO
                    </Badge>
                  </div>
                  <CardDescription className="text-white/60">
                    Complete unlimited experience
                  </CardDescription>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">$19.90</span>
                      <span className="text-sm text-white/60">/month</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Unlimited interactions in all games</p>
                        <p className="text-sm text-white/60">No limits on comments and reactions</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Reserved seat - guaranteed access</p>
                        <p className="text-sm text-white/60">Join any game, even when full</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Pin comments from favorite profiles</p>
                        <p className="text-sm text-white/60">Highlight your friends in the stadium</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Exclusive PRO badge visible to all</p>
                        <p className="text-sm text-white/60">Be recognized in the digital crowd</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Priority access to new features</p>
                        <p className="text-sm text-white/60">Be the first to test new resources</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Advanced participation statistics</p>
                        <p className="text-sm text-white/60">Track your metrics and engagement</p>
                      </div>
                    </li>
                  </ul>
                  <Button className="w-full bg-white text-black hover:bg-white/90" size="lg" onClick={() => setSelectedPlan("premium")}>
                    <Crown className="mr-2 h-4 w-4" />
                    Subscribe Premium
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-white">
              Welcome to Arena Viva Mente! 🎉
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-white/60">
              You're ready to experience games in real-time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-white/5 border border-white/10 p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                <Star className="h-4 w-4 text-white" />
                Seu acesso mock ativo:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span className="text-white/80">Provider: {selectedProvider}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span className="text-white/80">Plano: {selectedPlan === "premium" ? "Premium" : "Free"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span className="text-white/80">Perfil: {user?.name || name || "Torcedor 2026"}</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-sm text-white/60">
              <p className="mb-2">Next steps:</p>
              <ol className="text-left space-y-1 max-w-xs mx-auto">
                <li>1. Choose a live or upcoming game</li>
                <li>2. Reserve your seat</li>
                <li>3. Select your preferred team</li>
                <li>4. Cheer with the digital crowd! ⚽</li>
              </ol>
            </div>

            <Button onClick={handleContinue} className="w-full bg-white text-black hover:bg-white/90" size="lg">
              Go to Stadium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Login;
