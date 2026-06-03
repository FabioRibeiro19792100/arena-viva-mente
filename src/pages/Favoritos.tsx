import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/contexts/MockAuthContext";
import { getProductState, toggleFavoriteMatch, addReservation, type ProductState } from "@/lib/productState";
import { getMatchById } from "@/lib/runtimeMatches";

const Favoritos = () => {
  const navigate = useNavigate();
  const { user } = useMockAuth();
  const [productState, setProductState] = useState<ProductState>({
    favorites: [],
    reservations: [],
    history: [],
  });

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setProductState(await getProductState(user.id));
    })();
  }, [user]);

  if (!user) return null;

  const favoriteMatches = productState.favorites
    .map((matchId) => getMatchById(matchId))
    .filter(Boolean);

  const refreshState = async () => {
    setProductState(await getProductState(user.id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">Favoritos</h1>
              <p className="text-sm text-muted-foreground">
                Jogos que você marcou para voltar rápido depois.
              </p>
            </div>
            <Button variant="outline" className="rounded-none" onClick={() => navigate("/")}>
              Ver todos os jogos
            </Button>
          </div>

          {favoriteMatches.length === 0 ? (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Você ainda não marcou nenhum jogo como favorito.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {favoriteMatches.map((game) => (
                <GameCard
                  key={game.id}
                  {...game}
                  startTime={game.startTime}
                  hasRoom={game.id.startsWith("wc2026")}
                  isFavorite={productState.favorites.includes(game.id)}
                  isReserved={productState.reservations.some((reservation) => reservation.matchId === game.id)}
                  onToggleFavorite={async (matchId) => {
                    await toggleFavoriteMatch(user.id, matchId);
                    await refreshState();
                  }}
                  onReserveMatch={async (matchId) => {
                    await addReservation(user.id, matchId);
                    await refreshState();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Favoritos;
