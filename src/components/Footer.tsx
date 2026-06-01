import { Instagram, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/80 bg-background/70">
      <div className="container max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-4 text-xl font-bold text-foreground">Arena Tikitaka</h3>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Salas ao vivo, reservas e highlights pós-jogo para a Copa do Mundo de 2026.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Jogos</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="text-muted-foreground transition-colors hover:text-foreground">Salas da Copa</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Suporte</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground transition-colors hover:text-foreground">Informações</a></li>
              <li><a href="#" className="text-muted-foreground transition-colors hover:text-foreground">Atendimento</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground transition-colors hover:text-foreground">Privacidade</a></li>
              <li><a href="#" className="text-muted-foreground transition-colors hover:text-foreground">Termos</a></li>
            </ul>
          </div>
        </div>

        <div className="flex gap-6 mb-8">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
            <Instagram className="h-5 w-5" />
          </a>
        </div>

        <div className="border-t border-border pt-8 text-sm text-muted-foreground">
          <p>© 2026 Arena Tikitaka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
