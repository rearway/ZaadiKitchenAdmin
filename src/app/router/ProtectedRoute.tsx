import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@/store/useSessionStore';

export default function ProtectedRoute() {
  const user = useSessionStore((s) => s.user);
  const refreshToken = useSessionStore((s) => s.refreshToken);

  // Allow through if we have a persisted user + refresh token (access token will be
  // refreshed automatically on the first 401 by the axios interceptor)
  if (!user && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
