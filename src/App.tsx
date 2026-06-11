import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MockAuthProvider } from "./contexts/MockAuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Arquibancada from "./pages/Arquibancada";
import Booking from "./pages/Booking";
import Resumo from "./pages/Resumo";
import Perfil from "./pages/Perfil";
import Favoritos from "./pages/Favoritos";
import Reservas from "./pages/Reservas";
import Bolao from "./pages/Bolao";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./components/theme-provider";
import { ReservationReminderManager } from "./components/ReservationReminderManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <MockAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ReservationReminderManager />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/galeria" element={<Navigate to="/" replace />} />
              <Route path="/resumo/:id" element={<Resumo />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/arquibancada/:id" element={<Arquibancada />} />
                <Route path="/booking/:id" element={<Booking />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/reservas" element={<Reservas />} />
                <Route path="/bolao" element={<Bolao />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MockAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
