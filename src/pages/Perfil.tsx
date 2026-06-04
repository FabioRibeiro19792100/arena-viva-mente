import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { Pencil } from "lucide-react";

const Perfil = () => {
  const { user, updateUser } = useMockAuth();
  const [nickname, setNickname] = useState(user?.username || "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  useEffect(() => {
    setNickname(user?.username || "");
  }, [user?.username]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container max-w-4xl px-6 py-16 md:py-20">
        <Card className="border-border/80 bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <CardContent className="space-y-8 p-6 md:p-8">
            <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-2">
                <p className="text-sm text-muted-foreground">{user.email || "Conta Google conectada"}</p>

                <div className="flex items-center gap-2">
                  {isEditingNickname ? (
                    <>
                      <Input
                        value={nickname}
                        onChange={(event) => setNickname(event.target.value)}
                        className="h-10 max-w-xs border-border bg-background"
                        autoFocus
                      />
                      <Button
                        className="h-10 px-4"
                        onClick={() => {
                          updateUser({ username: nickname });
                          setIsEditingNickname(false);
                        }}
                      >
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-semibold tracking-tight text-foreground">{user.username}</p>
                      <button
                        type="button"
                        onClick={() => setIsEditingNickname(true)}
                        className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Editar apelido"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Perfil;
