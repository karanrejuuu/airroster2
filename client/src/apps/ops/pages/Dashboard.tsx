import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../../components/Badge';
import { DutyBar } from '../../../components/DutyBar';
import { api } from '../../../lib/api';
import { todayIso } from '../../../lib/dateUtils';
import type { CrewMember, FlightRoute, LeaveRequest } from '../../../types';

export function Dashboard() {
  const today = todayIso();
  const routes = useQuery({ queryKey: ['routes', today], queryFn: () => api<FlightRoute[]>(`/api/routes?date=${today}`) });
  const crew = useQuery({ queryKey: ['crew'], queryFn: () => api<CrewMember[]>('/api/crew') });
  const leave = useQuery({ queryKey: ['leave'], queryFn: () => api<LeaveRequest[]>('/api/leave') });
  const openSlots = (routes.data ?? []).reduce((sum, route) => {
    const required = route.required_captains + route.required_fos + route.required_cabin;
    return sum + Math.max(0, required - route.assignments.length);
  }, 0);
  const crewOnDuty = new Set((routes.data ?? []).flatMap((route) => route.assignments.map((assignment) => assignment.id))).size;
  const alerts = (crew.data ?? []).filter((member) => member.monthly_hours_used / member.monthly_hours_max >= 0.8).sort((a, b) => (b.monthly_hours_used / b.monthly_hours_max) - (a.monthly_hours_used / a.monthly_hours_max));

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <div className="overline">OPS CONTROL</div>
          <h1>Dashboard</h1>
          <p>{today}</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat"><small>Today's routes</small><strong>{routes.data?.length ?? 0}</strong></div>
        <div className="stat"><small>Open crew slots</small><strong>{openSlots}</strong></div>
        <div className="stat"><small>Crew on duty</small><strong>{crewOnDuty}</strong></div>
        <div className="stat"><small>Pending leave</small><strong>{(leave.data ?? []).filter((item) => item.status === 'pending').length}</strong></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <section className="panel">
          <div className="panel-head"><h2>Today's flight routes</h2></div>
          <table>
            <thead><tr><th>Route</th><th>Sector</th><th>Dep</th><th>Staffing</th></tr></thead>
            <tbody>
              {(routes.data ?? []).map((route) => {
                const required = route.required_captains + route.required_fos + route.required_cabin;
                const staffed = route.assignments.length >= required;
                return <tr key={route.id}><td>{route.flight_number}</td><td>{route.from_airport} {'->'} {route.to_airport}</td><td>{route.departure_time}</td><td><Badge tone={staffed ? 'ok' : 'warn'}>{staffed ? 'Staffed' : `${required - route.assignments.length} open`}</Badge></td></tr>;
              })}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Duty alerts</h2></div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            {alerts.map((member) => <div key={member.id}><strong style={{ fontSize: 13 }}>{member.full_name}</strong><DutyBar used={member.monthly_hours_used} max={member.monthly_hours_max} /></div>)}
          </div>
        </section>
      </div>
    </>
  );
}
