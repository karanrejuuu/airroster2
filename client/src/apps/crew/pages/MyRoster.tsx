import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/Badge';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { greeting, todayIso } from '../../../lib/dateUtils';
import type { FlightRoute } from '../../../types';

export function MyRoster() {
  const profile = useAuth((state) => state.profile);
  const today = todayIso();
  const to = format(addDays(new Date(), 6), 'yyyy-MM-dd');
  const roster = useQuery({ queryKey: ['myRoster', profile?.id], enabled: Boolean(profile), queryFn: () => api<Array<FlightRoute & { role_on_flight: string }>>(`/api/assignments?crewId=${profile!.id}&from=${today}&to=${to}`) });
  const todayFlights = (roster.data ?? []).filter((route) => route.departure_date === today);
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>{greeting()}, {profile?.rank === 'Captain' ? 'Capt.' : profile?.rank} {profile?.full_name.split(' ')[0]}.</h1>
          <p>You have {todayFlights.length} flights today.</p>
        </div>
      </div>
      <div className="roster-cards">
        {todayFlights.map((route) => <Link className="card flight-card" to={`/crew/briefing/${route.id}`} key={route.id}><h3>{route.flight_number}</h3><p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{route.from_airport} {'->'} {route.to_airport}</p><span className="time">{route.departure_time}</span><div className="overline">{route.role_on_flight}</div></Link>)}
      </div>
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panel-head"><h2>This week</h2></div>
        <table><tbody>{Array.from({ length: 7 }, (_, index) => format(addDays(new Date(), index), 'yyyy-MM-dd')).map((day) => {
          const dayRoutes = (roster.data ?? []).filter((route) => route.departure_date === day);
          return dayRoutes.length ? dayRoutes.map((route) => <tr key={route.id}><td>{format(new Date(`${day}T00:00:00`), 'EEE d MMM')}</td><td>{route.flight_number}</td><td>{route.from_airport} {'->'} {route.to_airport}</td><td>{route.departure_time}</td><td><Badge>{route.role_on_flight}</Badge></td></tr>) : <tr key={day}><td>{format(new Date(`${day}T00:00:00`), 'EEE d MMM')}</td><td colSpan={4} style={{ color: 'var(--text-tertiary)' }}>Off</td></tr>;
        })}</tbody></table>
      </section>
    </>
  );
}
