import { Button } from "@/components/ui/button";
import { LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { useTheme } from "next-themes";

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useMockAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-20 items-center justify-between px-6">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-lg font-black tracking-tight">AT</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Arena Tikitaka</h1>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Salas da Copa do Mundo 2026</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Jogos
          </button>
          <button
            onClick={() => navigate("/perfil")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            {isAuthenticated ? "Minha conta" : "Perfil"}
          </button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-10 w-10 rounded-full border-border bg-background/80"
          >
            {isDark ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
          </Button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/perfil")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {user?.name}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate("/login")}
              className="font-semibold"
            >
              Login
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-10 w-10 rounded-full border-border bg-background/80"
          >
            {isDark ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
