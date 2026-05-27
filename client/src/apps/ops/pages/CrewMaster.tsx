import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Drawer } from '../../../components/Drawer';
import { DutyBar } from '../../../components/DutyBar';
import { Input, Select } from '../../../components/Input';
import { useToast } from '../../../hooks/useToast';
import { api, del, post, put } from '../../../lib/api';
import type { Airline, CrewMember, CrewRank, CrewType, UserRole } from '../../../types';

const roles: UserRole[] = ['admin', 'dispatcher', 'pilot', 'cabin_crew'];
const ranks: CrewRank[] = ['Captain', 'First Officer', 'Purser', 'Senior Flight Attendant', 'Flight Attendant'];
const types: CrewType[] = ['pilot', 'cabin'];

function formObject(form: HTMLFormElement) {
  const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
  return {
    ...data,
    airline_id: Number(data.airline_id),
    monthly_hours_max: Number(data.monthly_hours_max || 90),
    monthly_hours_used: Number(data.monthly_hours_used || 0)
  };
}

function expiryTone(date?: string, days = 90) {
  if (!date) return 'neutral';
  const diff = (new Date(date).getTime() - Date.now()) / 86_400_000;
  return diff < days ? (days <= 30 ? 'danger' : 'warn') : 'neutral';
}

export function CrewMaster() {
  const queryClient = useQueryClient();
  const toast = useToast((state) => state.push);
  const [drawer, setDrawer] = useState<'form' | 'detail' | null>(null);
  const [selected, setSelected] = useState<CrewMember | null>(null);
  const crew = useQuery({ queryKey: ['crew'], queryFn: () => api<CrewMember[]>('/api/crew') });
  const airlines = useQuery({ queryKey: ['airlines'], queryFn: () => api<Airline[]>('/api/airlines') });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => selected ? put<CrewMember>(`/api/crew/${selected.id}`, payload) : post<CrewMember>('/api/crew', payload),
    onSuccess: async () => {
      toast({ kind: 'success', message: 'Crew record saved' });
      setDrawer(null);
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ['crew'] });
    }
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => del(`/api/crew/${id}`),
    onSuccess: async () => {
      toast({ kind: 'warning', message: 'Crew member deactivated' });
      await queryClient.invalidateQueries({ queryKey: ['crew'] });
    }
  });

  function openCreate() {
    setSelected(null);
    setDrawer('form');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save.mutate(formObject(event.currentTarget));
  }

  return (
    <>
      <div className="page-head">
        <div className="page-title"><div className="overline">MASTER</div><h1>Crew</h1><p>{crew.data?.length ?? 0} crew profiles</p></div>
        <Button variant="primary" icon={<Plus size={16} strokeWidth={1.5} />} onClick={openCreate}>Add Crew</Button>
      </div>
      <section className="panel">
        <table>
          <thead><tr><th>Employee</th><th>Name</th><th>Rank</th><th>Airline</th><th>Base</th><th>Duty</th><th>Status</th></tr></thead>
          <tbody>
            {(crew.data ?? []).map((member) => (
              <tr key={member.id} onClick={() => { setSelected(member); setDrawer('detail'); }} style={{ cursor: 'pointer' }}>
                <td>{member.employee_id}</td>
                <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><Avatar initials={member.initials} size={28} />{member.full_name}</span></td>
                <td>{member.rank}</td><td>{member.airline_name}</td><td>{member.base_airport}</td>
                <td><DutyBar used={member.monthly_hours_used} max={member.monthly_hours_max} /></td>
                <td><Badge tone={member.status === 'active' ? 'ok' : 'warn'}>{member.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Drawer title={selected ? 'Edit crew' : 'Add crew'} open={drawer === 'form'} onClose={() => setDrawer(null)}>
        <form className="form-grid" onSubmit={submit}>
          <Field name="full_name" label="Full name" defaultValue={selected?.full_name} />
          <Field name="employee_id" label="Employee ID" defaultValue={selected?.employee_id} />
          <Field name="email" label="Email" type="email" defaultValue={selected?.email} />
          {!selected && <Field name="password" label="Password" type="password" defaultValue="crew123" />}
          <Pick name="role" label="Role" options={roles} defaultValue={selected?.role} />
          <Pick name="rank" label="Rank" options={ranks} defaultValue={selected?.rank} />
          <Pick name="crew_type" label="Crew type" options={types} defaultValue={selected?.crew_type} />
          <label className="form-field"><span>Airline</span><Select name="airline_id" defaultValue={selected?.airline_id}>{(airlines.data ?? []).map((airline) => <option value={airline.id} key={airline.id}>{airline.name}</option>)}</Select></label>
          <Field name="base_airport" label="Base airport" defaultValue={selected?.base_airport ?? 'DEL'} />
          <Field name="phone" label="Phone" defaultValue={selected?.phone} />
          <Field name="license_number" label="License number" defaultValue={selected?.license_number} />
          <Field name="license_expiry" label="License expiry" type="date" defaultValue={selected?.license_expiry} />
          <Field name="medical_expiry" label="Medical expiry" type="date" defaultValue={selected?.medical_expiry} />
          <Field name="monthly_hours_max" label="Monthly max" type="number" defaultValue={selected?.monthly_hours_max ?? 90} />
          <div className="wide toolbar"><Button variant="primary" loading={save.isPending}>Save</Button></div>
        </form>
      </Drawer>
      <Drawer title="Crew detail" width={360} open={drawer === 'detail' && Boolean(selected)} onClose={() => setDrawer(null)}>
        {selected && <div className="detail-grid">
          <div className="wide" style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar initials={selected.initials} /><div><h2>{selected.full_name}</h2><p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{selected.rank}</p></div></div>
          <div className="kv"><small>License</small><strong>{selected.license_number}</strong> <Badge tone={expiryTone(selected.license_expiry, 90)}>expiry</Badge></div>
          <div className="kv"><small>Medical</small><strong>{selected.medical_expiry}</strong> <Badge tone={expiryTone(selected.medical_expiry, 30)}>expiry</Badge></div>
          <div className="kv"><small>Monthly hours</small><DutyBar used={selected.monthly_hours_used} max={selected.monthly_hours_max} /></div>
          <div className="toolbar wide"><Button onClick={() => setDrawer('form')}>Edit inline</Button><Button variant="danger" onClick={() => void deactivate.mutate(selected.id)}>Deactivate</Button></div>
        </div>}
      </Drawer>
    </>
  );
}

function Field({ label, ...props }: { label: string; name: string; type?: string; defaultValue?: string | number }) {
  return <label className="form-field"><span>{label}</span><Input {...props} /></label>;
}

function Pick({ label, options, ...props }: { label: string; name: string; options: string[]; defaultValue?: string }) {
  return <label className="form-field"><span>{label}</span><Select {...props}>{options.map((option) => <option value={option} key={option}>{option}</option>)}</Select></label>;
}
