import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CrewApp } from './apps/crew/CrewApp';
import { LandingPage } from './apps/landing/LandingPage';
import { OpsApp } from './apps/ops/OpsApp';
import { useAuth } from './hooks/useAuth';
import type { UserRole } from './types';

function landingForRole(role: UserRole) {
  if (role === 'admin') return '/ops/dashboard';
  if (role === 'dispatcher') return '/ops/flights';
  return '/crew/roster';
}

function RequireAuth({ area, children }: { area: 'ops' | 'crew'; children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="screen-center">Restoring session...</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  if (area === 'ops' && user.role !== 'admin' && user.role !== 'dispatcher') return <Navigate to="/crew/roster" replace />;
  if (area === 'crew' && (user.role === 'admin' || user.role === 'dispatcher')) return <Navigate to={landingForRole(user.role)} replace />;
  return children;
}

export function App() {
  const restore = useAuth((state) => state.restore);
  const loading = useAuth((state) => state.loading);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (loading) return <div className="screen-center">Loading AirRoster...</div>;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ops/*" element={<RequireAuth area="ops"><OpsApp /></RequireAuth>} />
      <Route path="/crew/*" element={<RequireAuth area="crew"><CrewApp /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
