import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-20 items-center justify-between px-6">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <h1 className="text-2xl font-bold text-white tracking-tight">Arena Viva Mente</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => navigate("/")}
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Games
          </button>
          <button 
            onClick={() => navigate("/galeria")}
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Galeria
          </button>
          <button 
            onClick={() => navigate("/perfil")}
            className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Perfil
          </button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate("/login")}
            className="bg-white text-black hover:bg-white/90 font-semibold"
          >
            Login
          </Button>
        </nav>

        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
