import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMockAuth } from "@/contexts/MockAuthContext";

const PENDING_REDIRECT_KEY = "arena-viva-mente.pending-auth-redirect";
const isLocalDevHost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const Login = () => {
  const [name, setName] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginDevBypass, isAuthenticated, mode, user } = useMockAuth();
  const showLocalBypass = isLocalDevHost();
  const queryRedirect = new URLSearchParams(location.search).get("next");
  const storedRedirect = typeof window !== "undefined" ? localStorage.getItem(PENDING_REDIRECT_KEY) : null;
  const redirectTo =
    queryRedirect ||
    storedRedirect ||
    location.state?.from ||
    "/";

  useEffect(() => {
    if (isAuthenticated && !showWelcomeDialog) {
      setName(user?.name || "");
      setFavoriteTeam(user?.favoriteTeam || "");
    }
  }, [isAuthenticated, showWelcomeDialog, user]);

  useEffect(() => {
    if (mode === "supabase" && isAuthenticated) {
      localStorage.removeItem(PENDING_REDIRECT_KEY);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, mode, navigate, redirectTo]);

  const handleLogin = () => {
    login({
      provider: "google",
      name,
      favoriteTeam,
      plan: "free",
    });

    if (mode === "mock") {
      setShowWelcomeDialog(true);
    }
  };

  const handleContinue = () => {
    setShowWelcomeDialog(false);
    localStorage.removeItem(PENDING_REDIRECT_KEY);
    navigate(redirectTo);
  };

  const handleLocalBypass = () => {
    loginDevBypass({
      name,
      favoriteTeam,
    });
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="container mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl items-center px-6 py-16 md:py-20">
        <div className="mx-auto w-full max-w-md">
          <Card className="border-border/80 shadow-[var(--shadow-card)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>Use sua conta para acessar sua agenda e suas salas.</CardDescription>
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

              {showLocalBypass && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-center border border-dashed border-border text-foreground hover:bg-muted"
                  onClick={handleLocalBypass}
                >
                  Entrar localmente
                </Button>
              )}

              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Como você quer aparecer?"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Time favorito</Label>
                  <Input
                    id="team"
                    placeholder="Opcional"
                    value={favoriteTeam}
                    onChange={(event) => setFavoriteTeam(event.target.value)}
                    className="border-border bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Conta pronta</DialogTitle>
            <DialogDescription className="pt-2 text-center">
              Você já pode seguir para a partida.
            </DialogDescription>
          </DialogHeader>

          <Button className="w-full" onClick={handleContinue}>
            Continuar
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Login;
