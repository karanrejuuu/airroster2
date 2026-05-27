import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { DutyBar } from '../../../components/DutyBar';
import { useAuth } from '../../../hooks/useAuth';

function warning(date?: string, limit = 90) {
  if (!date) return 'neutral';
  return (new Date(date).getTime() - Date.now()) / 86_400_000 < limit ? 'warn' : 'neutral';
}

export function Profile() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  async function signOut() {
    await logout();
    navigate('/');
  }
  if (!profile) return null;
  return (
    <>
      <div className="page-head"><div className="page-title"><h1>{profile.full_name}</h1><p>{profile.rank} · {profile.employee_id}</p></div></div>
      <section className="panel"><div className="panel-body detail-grid">
        <div className="kv"><small>Airline</small><strong>{profile.airline_name}</strong></div>
        <div className="kv"><small>Base</small><strong>{profile.base_airport}</strong></div>
        <div className="kv"><small>Monthly hours</small><DutyBar used={profile.monthly_hours_used} max={profile.monthly_hours_max} /><strong>{profile.monthly_hours_used} / {profile.monthly_hours_max} hrs</strong></div>
        <div className="kv"><small>Leave balance</small><strong>{profile.leave_balance} days remaining</strong></div>
        <div className="kv"><small>License expiry</small><strong>{profile.license_expiry}</strong> <Badge tone={warning(profile.license_expiry, 90)}>track</Badge></div>
        <div className="kv"><small>Medical expiry</small><strong>{profile.medical_expiry}</strong> <Badge tone={warning(profile.medical_expiry, 30)}>track</Badge></div>
        <div className="wide"><Button variant="danger" icon={<LogOut size={16} strokeWidth={1.5} />} onClick={() => void signOut()}>Sign out</Button></div>
      </div></section>
    </>
  );
}
