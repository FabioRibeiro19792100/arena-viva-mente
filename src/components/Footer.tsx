import { Heart, Mail, Twitter, Github, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="container max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">
              Arena Viva Mente
            </h3>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Games</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="text-white/60 hover:text-white transition-colors">Live Games</a></li>
              <li><a href="/galeria" className="text-white/60 hover:text-white transition-colors">Gallery</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Info</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6 mb-8">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
            <Github className="h-5 w-5" />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 text-sm text-white/60">
          <p>© 2024 Arena Viva Mente. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
