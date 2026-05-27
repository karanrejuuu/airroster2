import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Drawer } from '../../../components/Drawer';
import { Input, Select } from '../../../components/Input';
import { useToast } from '../../../hooks/useToast';
import { api, post, put } from '../../../lib/api';
import type { Airline, Flight, FlightRoute } from '../../../types';

export function FlightMaster() {
  const queryClient = useQueryClient();
  const toast = useToast((state) => state.push);
  const [selected, setSelected] = useState<Flight | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(false);
  const flights = useQuery({ queryKey: ['flights'], queryFn: () => api<Flight[]>('/api/flights') });
  const airlines = useQuery({ queryKey: ['airlines'], queryFn: () => api<Airline[]>('/api/airlines') });
  const routeHistory = useQuery({ queryKey: ['flightRoutes', selected?.id], enabled: Boolean(selected?.id && detail), queryFn: () => api<FlightRoute[]>(`/api/flights/${selected!.id}/routes`) });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => selected && open ? put<Flight>(`/api/flights/${selected.id}`, payload) : post<Flight>('/api/flights', payload),
    onSuccess: async () => { toast({ kind: 'success', message: 'Flight master saved' }); setOpen(false); setSelected(null); await queryClient.invalidateQueries({ queryKey: ['flights'] }); }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    void save.mutate({ ...data, airline_id: Number(data.airline_id), required_captains: Number(data.required_captains), required_fos: Number(data.required_fos), required_cabin: Number(data.required_cabin), total_seats: Number(data.total_seats || 180) });
  }
  return (
    <>
      <div className="page-head"><div className="page-title"><div className="overline">MASTER</div><h1>Flights</h1><p>Reusable flight numbers and aircraft</p></div><Button variant="primary" icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => { setSelected(null); setOpen(true); }}>Add Flight</Button></div>
      <section className="panel">
        <table>
          <thead><tr><th>Flight</th><th>Airline</th><th>Aircraft</th><th>Registration</th><th>Required crew</th><th>Status</th></tr></thead>
          <tbody>{(flights.data ?? []).map((flight) => <tr key={flight.id} style={{ cursor: 'pointer' }} onClick={() => { setSelected(flight); setDetail(true); }}><td>{flight.flight_number}</td><td>{flight.airline_name}</td><td>{flight.aircraft_type}</td><td>{flight.aircraft_reg}</td><td>{flight.required_captains}C {flight.required_fos}FO {flight.required_cabin}FA</td><td><Badge tone={flight.status === 'active' ? 'ok' : 'warn'}>{flight.status}</Badge></td></tr>)}</tbody>
        </table>
      </section>
      <Drawer title={selected ? 'Edit flight' : 'Add flight'} open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <Field name="flight_number" label="Flight number" defaultValue={selected?.flight_number} />
          <label className="form-field"><span>Airline</span><Select name="airline_id" defaultValue={selected?.airline_id}>{(airlines.data ?? []).map((airline) => <option value={airline.id} key={airline.id}>{airline.name}</option>)}</Select></label>
          <Field name="aircraft_type" label="Aircraft type" defaultValue={selected?.aircraft_type} />
          <Field name="aircraft_reg" label="Registration" defaultValue={selected?.aircraft_reg} />
          <Field name="total_seats" label="Seats" type="number" defaultValue={selected?.total_seats ?? 180} />
          <Field name="required_captains" label="Captains" type="number" defaultValue={selected?.required_captains ?? 1} />
          <Field name="required_fos" label="FOs" type="number" defaultValue={selected?.required_fos ?? 1} />
          <Field name="required_cabin" label="Cabin" type="number" defaultValue={selected?.required_cabin ?? 3} />
          <div className="wide"><Button variant="primary" loading={save.isPending}>Save</Button></div>
        </form>
      </Drawer>
      <Drawer title="Flight detail" width={420} open={detail && Boolean(selected)} onClose={() => setDetail(false)}>
        {selected && <><div className="detail-grid"><div className="kv"><small>Aircraft</small><strong>{selected.aircraft_type} · {selected.aircraft_reg}</strong></div><div className="kv"><small>Crew</small><strong>{selected.required_captains}C {selected.required_fos}FO {selected.required_cabin}FA</strong></div></div><div className="toolbar" style={{ margin: '16px 0' }}><Button onClick={() => { setDetail(false); setOpen(true); }}>Edit</Button></div><table><tbody>{(routeHistory.data ?? []).map((route) => <tr key={route.id}><td>{route.departure_date}</td><td>{route.from_airport} {'->'} {route.to_airport}</td><td>{route.departure_time}</td></tr>)}</tbody></table></>}
      </Drawer>
    </>
  );
}

function Field({ label, ...props }: { label: string; name: string; type?: string; defaultValue?: string | number }) {
  return <label className="form-field"><span>{label}</span><Input {...props} /></label>;
}
