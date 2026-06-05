import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/contexts/MockAuthContext";
import {
  addReservation,
  getMatchReservationCounts,
  getProductState,
  toggleFavoriteMatch,
  type ProductState,
} from "@/lib/productState";
import { getMatchById, hydrateRuntimeMatchesByIds } from "@/lib/runtimeMatches";

const Reservas = () => {
  const navigate = useNavigate();
  const { user } = useMockAuth();
  const [productState, setProductState] = useState<ProductState>({
    favorites: [],
    reservations: [],
    history: [],
  });
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [resolvedMatches, setResolvedMatches] = useState(() => [] as NonNullable<ReturnType<typeof getMatchById>>[]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setProductState(await getProductState(user.id));
    })();
  }, [user]);

  useEffect(() => {
    const reservedIds = productState.reservations.map((reservation) => reservation.matchId);
    if (reservedIds.length === 0) {
      setReservationCounts({});
      setResolvedMatches([]);
      return;
    }

    let isActive = true;

    void (async () => {
      await hydrateRuntimeMatchesByIds(reservedIds);
      const counts = await getMatchReservationCounts(reservedIds);
      const matches = reservedIds
        .map((matchId) => getMatchById(matchId))
        .filter(Boolean);
      if (isActive) {
        setReservationCounts(counts);
        setResolvedMatches(matches);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [productState.reservations]);

  if (!user) return null;

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
              <h1 className="text-2xl font-semibold text-foreground">Minhas reservas</h1>
              <p className="text-sm text-muted-foreground">
                Jogos que você guardou para entrar mais rápido depois.
              </p>
            </div>
            <Button variant="outline" className="rounded-none" onClick={() => navigate("/")}>
              Ver todos os jogos
            </Button>
          </div>

          {resolvedMatches.length === 0 ? (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Você ainda não reservou nenhuma sala.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {resolvedMatches.map((game) => (
                <GameCard
                  key={game.id}
                  {...game}
                  startTime={game.startTime}
                  hasRoom={true}
                  isFavorite={productState.favorites.includes(game.id)}
                  isReserved={productState.reservations.some((reservation) => reservation.matchId === game.id)}
                  reservationCount={reservationCounts[game.id] || 0}
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

export default Reservas;
