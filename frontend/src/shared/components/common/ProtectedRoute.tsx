// ============================================================
//  shared/components/common/ProtectedRoute.tsx
// ============================================================

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@features/auth/context/AuthContext';
import { PageLoader } from '@shared/components/ui';
import type { Rol } from '@shared/types';

interface Props {
  roles?: Rol[];
}

export function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
