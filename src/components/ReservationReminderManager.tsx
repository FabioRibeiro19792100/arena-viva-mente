import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMockAuth } from "@/contexts/MockAuthContext";
import {
  formatBrasiliaTime,
  getCurrentMatchStatus,
  parseWorldCupMatchDate,
} from "@/data/worldCup2026";
import { getProductState } from "@/lib/productState";
import { getMatchById, hydrateRuntimeMatchesByIds } from "@/lib/runtimeMatches";

const ALERT_WINDOW_MS = 15 * 60 * 1000;
const ALERT_STORAGE_KEY = "bancada.reservation-reminders.sent";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readSentAlerts = () => {
  if (!canUseStorage()) return {} as Record<string, true>;

  try {
    const raw = window.localStorage.getItem(ALERT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, true>) : {};
  } catch {
    return {};
  }
};

const saveSentAlerts = (value: Record<string, true>) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(value));
};

export const ReservationReminderManager = () => {
  const { user } = useMockAuth();
  const { toast } = useToast();
  const [reservedMatchIds, setReservedMatchIds] = useState<string[]>([]);
  const [reservedMatches, setReservedMatches] = useState<NonNullable<ReturnType<typeof getMatchById>>[]>([]);
  const sentAlertsRef = useRef<Record<string, true>>(readSentAlerts());

  useEffect(() => {
    if (!user) {
      setReservedMatchIds([]);
      return;
    }

    let isActive = true;

    const loadReservations = async () => {
      const state = await getProductState(user.id);
      if (isActive) {
        setReservedMatchIds(state.reservations.map((reservation) => reservation.matchId));
      }
    };

    void loadReservations();
    const intervalId = window.setInterval(() => {
      void loadReservations();
    }, 60_000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    if (reservedMatchIds.length === 0) {
      setReservedMatches([]);
      return;
    }

    let isActive = true;

    void (async () => {
      await hydrateRuntimeMatchesByIds(reservedMatchIds);
      if (isActive) {
        setReservedMatches(
          reservedMatchIds.map((matchId) => getMatchById(matchId)).filter(Boolean),
        );
      }
    })();

    return () => {
      isActive = false;
    };
  }, [reservedMatchIds]);

  useEffect(() => {
    if (!user || reservedMatches.length === 0 || typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [reservedMatches, user]);

  useEffect(() => {
    if (!user || reservedMatches.length === 0) {
      return;
    }

    const maybeSendAlerts = () => {
      reservedMatches.forEach((match) => {
        const kickoff = parseWorldCupMatchDate(match);
        if (!kickoff) return;

        const status = getCurrentMatchStatus(match);
        if (status !== "scheduled") return;

        const diff = kickoff.getTime() - Date.now();
        if (diff <= 0 || diff > ALERT_WINDOW_MS) return;

        const alertKey = `${match.id}:${kickoff.toISOString()}`;
        if (sentAlertsRef.current[alertKey]) return;

        const title = `${match.homeTeam} x ${match.awayTeam}`;
        const body = `A sala abre às ${formatBrasiliaTime(match.startTime)}.`;

        toast({
          title: "Sala abrindo em 15 minutos",
          description: `${title} começa às ${formatBrasiliaTime(match.startTime)}.`,
        });

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Bancada", {
            body: `${title} abre em 15 minutos.`,
          });
        }

        sentAlertsRef.current = {
          ...sentAlertsRef.current,
          [alertKey]: true,
        };
        saveSentAlerts(sentAlertsRef.current);
      });
    };

    maybeSendAlerts();
    const intervalId = window.setInterval(maybeSendAlerts, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reservedMatches, toast, user]);

  return null;
};
