import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { api, put } from '../../../lib/api';
import { daysBetween } from '../../../lib/dateUtils';
import type { LeaveRequest } from '../../../types';

const filters = ['all', 'pending', 'approved', 'rejected'] as const;

export function LeaveManagement() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');
  const leave = useQuery({ queryKey: ['leave'], queryFn: () => api<LeaveRequest[]>('/api/leave') });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => put(`/api/leave/${id}/review`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leave'] });
    }
  });
  const visible = (leave.data ?? []).filter((item) => filter === 'all' || item.status === filter);
  return (
    <>
      <div className="page-head"><div className="page-title"><div className="overline">OPS</div><h1>Leave</h1><p>Review crew availability blocks</p></div></div>
      <div className="toolbar" style={{ marginBottom: 14 }}>{filters.map((item) => <button className={`badge ${filter === item ? 'badge-ok' : 'badge-neutral'}`} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="panel">
        <table>
          <thead><tr><th>Crew</th><th>Rank</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Leave</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visible.map((item) => <tr key={item.id}><td>{item.full_name ?? item.crew_id}</td><td>{item.rank}</td><td>{item.crew_type}</td><td>{item.from_date}</td><td>{item.to_date}</td><td>{daysBetween(item.from_date, item.to_date)}</td><td>{item.leave_type}</td><td><Badge tone={item.status === 'approved' ? 'ok' : item.status === 'rejected' ? 'danger' : 'warn'}>{item.status}</Badge></td><td><div className="toolbar">{item.status === 'pending' && <><Button onClick={() => review.mutate({ id: item.id, status: 'approved' })}>Approve</Button><Button variant="danger" onClick={() => review.mutate({ id: item.id, status: 'rejected' })}>Reject</Button></>}</div></td></tr>)}</tbody>
        </table>
      </section>
    </>
  );
}
