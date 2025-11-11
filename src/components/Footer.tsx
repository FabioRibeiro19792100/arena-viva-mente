import { Heart, Mail, Twitter, Github, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-16 bg-card/50">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gradient-stadium">
              Arquibancada Digital
            </h3>
            <p className="text-sm text-muted-foreground">
              O estádio digital onde torcedores se encontram, vibram e deixam rastros emocionais em cada jogo.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="font-semibold mb-3">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">Início</a></li>
              <li><a href="/galeria" className="text-muted-foreground hover:text-primary transition-colors">Galeria de Resumos</a></li>
              <li><a href="/perfil" className="text-muted-foreground hover:text-primary transition-colors">Meu Perfil</a></li>
              <li><a href="/login" className="text-muted-foreground hover:text-primary transition-colors">Entrar</a></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-semibold mb-3">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/login" className="text-muted-foreground hover:text-primary transition-colors">Planos Premium</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Como funciona</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Moderação por IA</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Regras da arquibancada</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold mb-3">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Central de ajuda</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de uso</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacidade</a></li>
              <li>
                <a href="mailto:contato@arquibancada.com" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 Arquibancada Digital. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito com <Heart className="h-4 w-4 text-destructive fill-destructive" /> por quem ama ver o jogo junto
          </p>
        </div>
      </div>
    </footer>
  );
};
