import { CalendarCheck, FileText, LogOut, PlaneTakeoff, User } from 'lucide-react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { FlightBriefing } from './pages/FlightBriefing';
import { LeaveRequest } from './pages/LeaveRequest';
import { MyRoster } from './pages/MyRoster';
import { Profile } from './pages/Profile';

export function CrewApp() {
  const profile = useAuth((state) => state.profile);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const nav = [
    { label: 'My Roster', to: '/crew/roster', icon: CalendarCheck },
    { label: "Today's Flight", to: '/crew/briefing', icon: PlaneTakeoff },
    { label: 'Leave', to: '/crew/leave', icon: FileText },
    { label: 'Profile', to: '/crew/profile', icon: User }
  ];
  async function signOut() {
    await logout();
    navigate('/');
  }
  return (
    <div className="app-shell">
      <Sidebar
        mode="CREW PORTAL"
        nav={nav}
        footer={profile ? { initials: profile.initials, name: profile.full_name, sub: profile.rank, actions: <button className="icon-btn" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={15} strokeWidth={1.5} /></button> } : undefined}
      />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/crew/roster" replace />} />
          <Route path="/roster" element={<MyRoster />} />
          <Route path="/briefing" element={<FlightBriefing />} />
          <Route path="/briefing/:routeId" element={<FlightBriefing />} />
          <Route path="/leave" element={<LeaveRequest />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}
