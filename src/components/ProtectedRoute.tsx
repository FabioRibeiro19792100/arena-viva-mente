import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMockAuth } from "@/contexts/MockAuthContext";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useMockAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Carregando sessão...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
