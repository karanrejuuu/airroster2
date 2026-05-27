import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Drawer } from '../../../components/Drawer';
import { Input, Select } from '../../../components/Input';
import { useToast } from '../../../hooks/useToast';
import { api, post, put } from '../../../lib/api';
import { todayIso } from '../../../lib/dateUtils';
import type { Airport, Flight, FlightRoute } from '../../../types';

export function FlightRoutes() {
  const queryClient = useQueryClient();
  const toast = useToast((state) => state.push);
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FlightRoute | null>(null);
  const routes = useQuery({ queryKey: ['routes', date], queryFn: () => api<FlightRoute[]>(`/api/routes?date=${date}`) });
  const flights = useQuery({ queryKey: ['flights'], queryFn: () => api<Flight[]>('/api/flights') });
  const airports = useQuery({ queryKey: ['airports'], queryFn: () => api<Airport[]>('/api/airports') });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => selected ? put<FlightRoute>(`/api/routes/${selected.id}`, payload) : post<FlightRoute>('/api/routes', payload),
    onSuccess: async () => { toast({ kind: 'success', message: 'Flight route saved' }); setOpen(false); setSelected(null); await queryClient.invalidateQueries({ queryKey: ['routes'] }); }
  });
  const visible = (routes.data ?? []).filter((route) => !status || route.status === status);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    void save.mutate({ ...data, flight_id: Number(data.flight_id), duration_mins: Number(data.duration_mins), distance_km: Number(data.distance_km || 0) });
  }
  return (
    <>
      <div className="page-head"><div className="page-title"><div className="overline">SCHEDULING</div><h1>Flight Routes</h1><p>Actual scheduled sectors</p></div><Button variant="primary" icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => { setSelected(null); setOpen(true); }}>Add Route</Button></div>
      <div className="toolbar" style={{ marginBottom: 14 }}><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={{ width: 160 }} /><Select value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: 160 }}><option value="">All status</option><option value="scheduled">scheduled</option><option value="boarding">boarding</option><option value="departed">departed</option><option value="arrived">arrived</option><option value="cancelled">cancelled</option><option value="delayed">delayed</option></Select></div>
      <section className="panel"><table><thead><tr><th>Date</th><th>Flight</th><th>Sector</th><th>Dep</th><th>Arr</th><th>Duration</th><th>Crew</th><th>Status</th></tr></thead><tbody>{visible.map((route) => <tr key={route.id} onClick={() => { setSelected(route); setOpen(true); }} style={{ cursor: 'pointer' }}><td>{route.departure_date}</td><td>{route.flight_number}</td><td>{route.from_airport} {'->'} {route.to_airport}</td><td>{route.departure_time}</td><td>{route.arrival_time}</td><td>{route.duration_mins}m</td><td>{route.assignments.length}</td><td><Badge>{route.status}</Badge></td></tr>)}</tbody></table></section>
      <Drawer title={selected ? 'Edit route' : 'Add route'} open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label className="form-field wide"><span>Flight master</span><Select name="flight_id" defaultValue={selected?.flight_id}>{(flights.data ?? []).map((flight) => <option value={flight.id} key={flight.id}>{flight.flight_number} · {flight.airline_iata}</option>)}</Select></label>
          <AirportSelect name="from_airport" label="From" airports={airports.data ?? []} defaultValue={selected?.from_airport ?? 'DEL'} />
          <AirportSelect name="to_airport" label="To" airports={airports.data ?? []} defaultValue={selected?.to_airport ?? 'BOM'} />
          <Field name="departure_date" label="Date" type="date" defaultValue={selected?.departure_date ?? date} />
          <Field name="departure_time" label="Dep time" type="time" defaultValue={selected?.departure_time ?? '08:00'} />
          <Field name="arrival_time" label="Arr time" type="time" defaultValue={selected?.arrival_time ?? '10:00'} />
          <Field name="duration_mins" label="Duration mins" type="number" defaultValue={selected?.duration_mins ?? 120} />
          <Field name="distance_km" label="Distance km" type="number" defaultValue={selected?.distance_km ?? 0} />
          <label className="form-field"><span>Status</span><Select name="status" defaultValue={selected?.status ?? 'scheduled'}><option value="scheduled">scheduled</option><option value="boarding">boarding</option><option value="departed">departed</option><option value="arrived">arrived</option><option value="cancelled">cancelled</option><option value="delayed">delayed</option></Select></label>
          <div className="wide"><Button variant="primary" loading={save.isPending}>Save</Button></div>
        </form>
      </Drawer>
    </>
  );
}

function Field({ label, ...props }: { label: string; name: string; type?: string; defaultValue?: string | number }) {
  return <label className="form-field"><span>{label}</span><Input {...props} /></label>;
}
function AirportSelect({ label, airports, ...props }: { label: string; name: string; airports: Airport[]; defaultValue?: string }) {
  return <label className="form-field"><span>{label}</span><Select {...props}>{airports.map((airport) => <option value={airport.iata} key={airport.iata}>{airport.iata} · {airport.city}</option>)}</Select></label>;
}
