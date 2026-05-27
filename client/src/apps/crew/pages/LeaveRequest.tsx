import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent } from 'react';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Input, Select, Textarea } from '../../../components/Input';
import { useAuth } from '../../../hooks/useAuth';
import { api, post } from '../../../lib/api';
import { daysBetween } from '../../../lib/dateUtils';
import type { LeaveRequest as Leave } from '../../../types';

export function LeaveRequest() {
  const profile = useAuth((state) => state.profile);
  const queryClient = useQueryClient();
  const leave = useQuery({ queryKey: ['myLeave'], queryFn: () => api<Leave[]>('/api/leave') });
  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => post<Leave>('/api/leave', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myLeave'] });
    }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void create.mutate({ ...Object.fromEntries(new FormData(event.currentTarget).entries()), crew_id: profile?.id });
    event.currentTarget.reset();
  }
  return (
    <>
      <div className="page-head"><div className="page-title"><div className="overline">CREW</div><h1>Leave Request</h1><p>{profile?.leave_balance} days remaining</p></div></div>
      <section className="panel" style={{ marginBottom: 18 }}><div className="panel-body"><form className="form-grid" onSubmit={submit}><label className="form-field"><span>From</span><Input name="from_date" type="date" required /></label><label className="form-field"><span>To</span><Input name="to_date" type="date" required /></label><label className="form-field"><span>Type</span><Select name="leave_type"><option value="annual">annual</option><option value="sick">sick</option><option value="training">training</option><option value="emergency">emergency</option></Select></label><label className="form-field wide"><span>Note</span><Textarea name="note" /></label><div className="wide"><Button variant="primary" loading={create.isPending}>Submit</Button></div></form></div></section>
      <section className="panel"><table><thead><tr><th>From</th><th>To</th><th>Days</th><th>Type</th><th>Status</th></tr></thead><tbody>{(leave.data ?? []).map((item) => <tr key={item.id}><td>{item.from_date}</td><td>{item.to_date}</td><td>{daysBetween(item.from_date, item.to_date)}</td><td>{item.leave_type}</td><td><Badge tone={item.status === 'approved' ? 'ok' : item.status === 'rejected' ? 'danger' : 'warn'}>{item.status}</Badge></td></tr>)}</tbody></table></section>
    </>
  );
}
