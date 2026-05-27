import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Drawer } from '../../../components/Drawer';
import { Input, Select } from '../../../components/Input';
import { useToast } from '../../../hooks/useToast';
import { api, post, put } from '../../../lib/api';
import type { Airline } from '../../../types';

export function AirlineMaster() {
  const queryClient = useQueryClient();
  const toast = useToast((state) => state.push);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Airline | null>(null);
  const airlines = useQuery({ queryKey: ['airlines'], queryFn: () => api<Airline[]>('/api/airlines') });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => selected ? put<Airline>(`/api/airlines/${selected.id}`, payload) : post<Airline>('/api/airlines', payload),
    onSuccess: async () => { toast({ kind: 'success', message: 'Airline saved' }); setOpen(false); setSelected(null); await queryClient.invalidateQueries({ queryKey: ['airlines'] }); }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save.mutate(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }
  return (
    <>
      <div className="page-head"><div className="page-title"><div className="overline">MASTER</div><h1>Airlines</h1><p>Reusable airline records</p></div><Button variant="primary" icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => { setSelected(null); setOpen(true); }}>Add Airline</Button></div>
      <div className="cards-grid">
        {(airlines.data ?? []).map((airline) => (
          <article className="card airline-card" key={airline.id} onClick={() => { setSelected(airline); setOpen(true); }} style={{ cursor: 'pointer' }}>
            <div className="airline-logo">{airline.iata_code}</div>
            <h3>{airline.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 14px' }}>{airline.iata_code} · {airline.icao_code} · Hub {airline.hub_airport}</p>
            <div className="toolbar"><Badge>{airline.active_flight_count ?? 0} flights</Badge><Badge>{airline.active_crew_count ?? 0} crew</Badge><Badge tone={airline.status === 'active' ? 'ok' : 'warn'}>{airline.status}</Badge></div>
          </article>
        ))}
      </div>
      <Drawer title={selected ? 'Edit airline' : 'Add airline'} open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <Field name="name" label="Name" defaultValue={selected?.name} />
          <Field name="iata_code" label="IATA" defaultValue={selected?.iata_code} />
          <Field name="icao_code" label="ICAO" defaultValue={selected?.icao_code} />
          <Field name="country" label="Country" defaultValue={selected?.country ?? 'India'} />
          <Field name="hub_airport" label="Hub airport" defaultValue={selected?.hub_airport ?? 'DEL'} />
          <label className="form-field"><span>Status</span><Select name="status" defaultValue={selected?.status ?? 'active'}><option value="active">active</option><option value="inactive">inactive</option></Select></label>
          <div className="wide"><Button variant="primary" loading={save.isPending}>Save</Button></div>
        </form>
      </Drawer>
    </>
  );
}

function Field({ label, ...props }: { label: string; name: string; defaultValue?: string }) {
  return <label className="form-field"><span>{label}</span><Input {...props} /></label>;
}
