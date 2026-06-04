import { Instagram, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/80 bg-background/70">
      <div className="container px-6 py-8">
        <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">© 2026 Bancada. Todos os direitos reservados.</p>

          <div className="flex items-center gap-5">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
