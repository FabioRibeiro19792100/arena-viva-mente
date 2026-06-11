import { Button } from "@/components/ui/button";
import { Heart, LogOut, Menu, Moon, Sun, Ticket, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

interface HeaderProps {
  roomMode?: boolean;
  onRoomMenuClick?: () => void;
}

export const Header = ({ roomMode = false, onRoomMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useMockAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigateFromMenu = (path: string) => {
    setShowMobileMenu(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-20 items-center justify-between px-6">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <h1 className="min-w-0 text-2xl font-bold tracking-tight text-foreground">Bancada</h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {!roomMode && (
            <>
              {isAuthenticated && (
                <button
                  onClick={() => navigate("/bolao")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Bolão
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => navigate("/reservas")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  Reservas
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => navigate("/favoritos")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Favoritos
                </button>
              )}
            </>
          )}
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
              {!roomMode && (
                <button
                  onClick={() => navigate("/perfil")}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  {user?.name || "Conta"}
                </button>
              )}
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
          {roomMode ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground"
              onClick={onRoomMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {!roomMode && (
        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetContent side="right" className="border-border bg-background px-5 py-16">
            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <button
                  onClick={() => navigateFromMenu("/")}
                  className="flex w-full items-center justify-between text-left text-base text-foreground"
                >
                  Todos
                </button>
                <button
                  onClick={() => navigateFromMenu("/?quick=live")}
                  className="flex w-full items-center justify-between text-left text-base text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Ao vivo agora
                  </span>
                </button>
                <button
                  onClick={() => navigateFromMenu("/?quick=soon")}
                  className="flex w-full items-center justify-between text-left text-base text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Em breve
                  </span>
                </button>
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => navigateFromMenu("/bolao")}
                      className="flex w-full items-center justify-between text-left text-base text-foreground"
                    >
                      Bolão
                    </button>
                    <button
                      onClick={() => navigateFromMenu("/reservas")}
                      className="flex w-full items-center justify-between text-left text-base text-foreground"
                    >
                      Minhas reservas
                    </button>
                    <button
                      onClick={() => navigateFromMenu("/favoritos")}
                      className="flex w-full items-center justify-between text-left text-base text-foreground"
                    >
                      Favoritos
                    </button>
                  </>
                )}
              </div>

              <div className="border-t border-border pt-6">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigateFromMenu("/perfil")}
                      className="flex w-full items-center gap-2 text-left text-sm text-muted-foreground"
                    >
                      <User className="h-4 w-4" />
                      {user?.name || "Minha conta"}
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        logout();
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-2 text-left text-sm text-muted-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigateFromMenu("/login")}
                    className="text-sm text-foreground"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
};
