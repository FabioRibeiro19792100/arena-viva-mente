import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MessageCircle, Mail, Twitter } from "lucide-react";

interface InviteFriendsProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
}

export const InviteFriends = ({ gameId, homeTeam, awayTeam }: InviteFriendsProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const shareUrl = `${window.location.origin}/arquibancada/${gameId}`;
  const shareText = `🏟️ Vem assistir ${homeTeam} x ${awayTeam} comigo na arquibancada digital!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast({
      title: "✅ Link copiado!",
      description: "Compartilhe com seus amigos",
    });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Assista ${homeTeam} x ${awayTeam} comigo!`);
    const body = encodeURIComponent(`${shareText}\n\nClique aqui para entrar: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Convidar amigos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Convide amigos
          </DialogTitle>
          <DialogDescription>
            Compartilhe este jogo e assistam juntos na arquibancada digital!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Link de compartilhamento */}
          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Botões de compartilhamento social */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-4"
              onClick={shareWhatsApp}
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-4"
              onClick={shareTwitter}
            >
              <Twitter className="h-5 w-5 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-4"
              onClick={shareEmail}
            >
              <Mail className="h-5 w-5 text-orange-500" />
              <span className="text-xs">Email</span>
            </Button>
          </div>

          {/* Benefício de convidar */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs text-foreground font-medium">
              💡 <span className="font-bold">Dica:</span> Quanto mais amigos na arquibancada, mais animado fica o jogo!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
