import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@/store/useSessionStore';
import type { Role } from '@/shared/config/roles';

type Props = {
  allow: Role | Role[];
  redirectTo?: string;
};

export default function RoleRoute({ allow, redirectTo = '/ops' }: Props) {
  const role = useSessionStore((s) => s.user?.role);
  const allowed = Array.isArray(allow) ? allow : [allow];

  if (!role || !allowed.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
