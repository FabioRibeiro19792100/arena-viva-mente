import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow">
            <span className="text-2xl">🏟️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-stadium">Arquibancada.Live</h1>
            <p className="text-xs text-muted-foreground">O jogo começa. A arquibancada abre.</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => navigate("/")}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Jogos
          </button>
          <button 
            onClick={() => navigate("/galeria")}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Galeria de Resumos
          </button>
          <Button 
            variant="stadium" 
            size="sm"
            onClick={() => navigate("/login")}
          >
            <User className="h-4 w-4" />
            Entrar
          </Button>
        </nav>

        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
