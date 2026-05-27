import { CalendarDays, Gauge, LayoutDashboard, Plane, Route, Settings, UserRoundCheck, Users } from 'lucide-react';
import { Navigate, Route as RouterRoute, Routes, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { AirlineMaster } from './pages/AirlineMaster';
import { CrewMaster } from './pages/CrewMaster';
import { Dashboard } from './pages/Dashboard';
import { FlightBoard } from './pages/FlightBoard';
import { FlightMaster } from './pages/FlightMaster';
import { FlightRoutes } from './pages/FlightRoutes';
import { LeaveManagement } from './pages/LeaveManagement';
import { SettingsPage } from './pages/Settings';

export function OpsApp() {
  const { user, profile } = useAuth();
  const admin = user?.role === 'admin';
  const navigate = useNavigate();
  const nav = [
    { label: 'Dashboard', to: '/ops/dashboard', icon: LayoutDashboard },
    { label: 'Flight Board', to: '/ops/flights', icon: Gauge },
    { label: 'Crew', to: '/ops/crew', icon: Users, hidden: !admin },
    { label: 'Airlines', to: '/ops/airlines', icon: Plane, hidden: !admin },
    { label: 'Flights', to: '/ops/flight-master', icon: CalendarDays, hidden: !admin },
    { label: 'Flight Routes', to: '/ops/routes', icon: Route },
    { label: 'Leave', to: '/ops/leave', icon: UserRoundCheck },
    { label: 'Settings', to: '/ops/settings', icon: Settings, hidden: !admin }
  ];

  return (
    <div className="app-shell ops-shell">
      <Sidebar
        mode="OPS"
        nav={nav}
        footer={profile ? { initials: profile.initials, name: profile.full_name, sub: profile.role.replace('_', ' ') } : undefined}
      />
      <div className="desktop-guard">AirRoster Ops is designed for desktop.</div>
      <main className="app-main">
        <Routes>
          <RouterRoute path="/" element={<Navigate to="/ops/flights" replace />} />
          <RouterRoute path="/dashboard" element={<Dashboard />} />
          <RouterRoute path="/flights" element={<FlightBoard />} />
          <RouterRoute path="/crew" element={admin ? <CrewMaster /> : <Navigate to="/ops/flights" replace />} />
          <RouterRoute path="/airlines" element={admin ? <AirlineMaster /> : <Navigate to="/ops/flights" replace />} />
          <RouterRoute path="/flight-master" element={admin ? <FlightMaster /> : <Navigate to="/ops/flights" replace />} />
          <RouterRoute path="/routes" element={<FlightRoutes />} />
          <RouterRoute path="/leave" element={<LeaveManagement />} />
          <RouterRoute path="/settings" element={admin ? <SettingsPage onSignedOut={() => navigate('/')} /> : <Navigate to="/ops/flights" replace />} />
        </Routes>
      </main>
    </div>
  );
}
