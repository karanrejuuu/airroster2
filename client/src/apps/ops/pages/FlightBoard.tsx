import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { DutyBar } from '../../../components/DutyBar';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { useKeyboard } from '../../../hooks/useKeyboard';
import { useToast } from '../../../hooks/useToast';
import { api, del, post } from '../../../lib/api';
import { checkAllConflicts } from '../../../lib/conflictEngine';
import { dateShift, dayPart, todayIso } from '../../../lib/dateUtils';
import type { Assignment, CrewMember, CrewRank, FlightRoute, LeaveRequest } from '../../../types';

type BoardMode = 'day' | 'week';
type CrewFilter = 'All' | 'Pilots' | 'Cabin' | 'Available' | 'On Duty' | 'Leave';

const filters: CrewFilter[] = ['All', 'Pilots', 'Cabin', 'Available', 'On Duty', 'Leave'];

function routeSlots(route: FlightRoute): CrewRank[] {
  const slots: CrewRank[] = [];
  for (let i = 0; i < route.required_captains; i += 1) slots.push('Captain');
  for (let i = 0; i < route.required_fos; i += 1) slots.push('First Officer');
  if (route.required_cabin > 0) slots.push('Purser');
  if (route.required_cabin > 1) slots.push('Senior Flight Attendant');
  for (let i = 2; i < route.required_cabin; i += 1) slots.push('Flight Attendant');
  return slots;
}

function routeState(route: FlightRoute) {
  if (route.status === 'cancelled') return 'cancelled';
  const required = route.required_captains + route.required_fos + route.required_cabin;
  const open = Math.max(0, required - route.assignments.length);
  const dep = new Date(`${route.departure_date}T${route.departure_time}:00`).getTime();
  const withinTwoHours = dep - Date.now() < 2 * 60 * 60 * 1000 && dep > Date.now();
  if (open > 0 && withinTwoHours) return 'critical';
  if (open > 0) return 'warn';
  return '';
}

function rankCompatible(crew: CrewMember | null, rank: CrewRank) {
  return Boolean(crew && crew.rank === rank);
}

export function FlightBoard() {
  const queryClient = useQueryClient();
  const toast = useToast((state) => state.push);
  const [mode, setMode] = useState<BoardMode>('day');
  const [date, setDate] = useState(todayIso());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CrewFilter>('Available');
  const [dragCrew, setDragCrew] = useState<CrewMember | null>(null);
  const [shake, setShake] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [help, setHelp] = useState(false);
  const [popover, setPopover] = useState<{ route: FlightRoute; rank: CrewRank; left: number; top: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const routes = useQuery({ queryKey: ['routes', mode, date], queryFn: () => api<FlightRoute[]>(mode === 'day' ? `/api/routes?date=${date}` : '/api/routes') });
  const crew = useQuery({ queryKey: ['crew'], queryFn: () => api<CrewMember[]>('/api/crew') });
  const leave = useQuery({ queryKey: ['leave'], queryFn: () => api<LeaveRequest[]>('/api/leave') });

  const assign = useMutation({
    mutationFn: ({ routeId, crewId, rank }: { routeId: number; crewId: number; rank: CrewRank }) => post<Assignment[]>(`/api/routes/${routeId}/assign`, { crewId, roleOnFlight: rank }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routes'] });
    }
  });
  const unassign = useMutation({
    mutationFn: ({ routeId, crewId }: { routeId: number; crewId: number }) => del(`/api/routes/${routeId}/assign/${crewId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routes'] });
    }
  });

  const onDutyIds = useMemo(() => new Set((routes.data ?? []).flatMap((route) => route.assignments.map((assignment) => assignment.id))), [routes.data]);
  const leaveIds = useMemo(() => new Set((leave.data ?? []).filter((item) => item.status === 'approved' && item.from_date <= date && item.to_date >= date).map((item) => item.crew_id)), [leave.data, date]);
  const allAssignments = useMemo(() => (routes.data ?? []).flatMap((route) => route.assignments.map((assignment) => ({
    ...assignment,
    departure_date: route.departure_date,
    departure_time: route.departure_time,
    arrival_time: route.arrival_time,
    duration_mins: route.duration_mins
  }))), [routes.data]);

  const crewList = useMemo(() => {
    const term = search.toLowerCase();
    return (crew.data ?? [])
      .filter((member) => member.status === 'active')
      .filter((member) => member.role === 'pilot' || member.role === 'cabin_crew')
      .filter((member) => member.full_name.toLowerCase().includes(term) || member.rank.toLowerCase().includes(term) || member.base_airport.toLowerCase().includes(term))
      .filter((member) => {
        if (filter === 'Pilots') return member.crew_type === 'pilot';
        if (filter === 'Cabin') return member.crew_type === 'cabin';
        if (filter === 'Available') return !onDutyIds.has(member.id) && !leaveIds.has(member.id);
        if (filter === 'On Duty') return onDutyIds.has(member.id);
        if (filter === 'Leave') return leaveIds.has(member.id);
        return true;
      })
      .sort((a, b) => a.monthly_hours_used - b.monthly_hours_used);
  }, [crew.data, filter, leaveIds, onDutyIds, search]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(parseISO(date), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => format(addDays(start, index), 'yyyy-MM-dd'));
  }, [date]);

  useKeyboard({
    '/': (event) => { event.preventDefault(); searchRef.current?.focus(); },
    D: () => setMode('day'),
    d: () => setMode('day'),
    W: () => setMode('week'),
    w: () => setMode('week'),
    ArrowLeft: () => setDate((value) => dateShift(value, mode === 'day' ? -1 : -7)),
    ArrowRight: () => setDate((value) => dateShift(value, mode === 'day' ? 1 : 7)),
    T: () => setDate(todayIso()),
    t: () => setDate(todayIso()),
    '?': () => setHelp(true),
    Escape: () => setPopover(null)
  });

  function canAssign(member: CrewMember, route: FlightRoute, rank: CrewRank) {
    const conflicts = checkAllConflicts(member, route, rank, { allAssignments, leaveRequests: leave.data ?? [] });
    return conflicts;
  }

  async function doAssign(member: CrewMember, route: FlightRoute, rank: CrewRank) {
    const conflicts = canAssign(member, route, rank);
    const blocking = conflicts.find((conflict) => conflict.severity === 'block');
    if (blocking) {
      setShake(`${route.id}-${rank}`);
      window.setTimeout(() => setShake(''), 350);
      toast({ kind: 'error', message: blocking.message });
      return;
    }
    await assign.mutateAsync({ routeId: route.id, crewId: member.id, rank });
    toast({
      kind: conflicts.length ? 'warning' : 'success',
      message: conflicts[0]?.message ?? `${member.full_name} assigned to ${route.flight_number}`,
      undo: () => void unassign.mutate({ routeId: route.id, crewId: member.id })
    });
    setPopover(null);
  }

  function assignedByRank(route: FlightRoute, rank: CrewRank) {
    const matches = route.assignments.filter((assignment) => assignment.role_on_flight === rank);
    return matches;
  }

  const grouped = useMemo(() => {
    const groups: Record<string, FlightRoute[]> = { MORNING: [], AFTERNOON: [], EVENING: [] };
    (routes.data ?? []).forEach((route) => groups[dayPart(route.departure_time)].push(route));
    return groups;
  }, [routes.data]);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <div className="overline">DISPATCHER PRIMARY VIEW</div>
          <h1>Flight Board</h1>
          <p>{mode === 'day' ? date : `Week of ${weekDays[0]}`}</p>
        </div>
        <div className="toolbar">
          <div className="segmented"><button className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>Day</button><button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>Week</button></div>
          <Button icon={<ChevronLeft size={16} strokeWidth={1.5} />} onClick={() => setDate((value) => dateShift(value, mode === 'day' ? -1 : -7))}>Prev</Button>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={{ width: 150 }} />
          <Button icon={<ChevronRight size={16} strokeWidth={1.5} />} onClick={() => setDate((value) => dateShift(value, mode === 'day' ? 1 : 7))}>Next</Button>
          <Badge tone={(routes.data ?? []).some((route) => routeState(route) === 'critical') ? 'danger' : 'warn'}>{(routes.data ?? []).reduce((sum, route) => sum + Math.max(0, route.required_captains + route.required_fos + route.required_cabin - route.assignments.length), 0)} open slots</Badge>
        </div>
      </div>
      {mode === 'day' ? (
        <div className="flight-board">
          <aside className="panel crew-panel">
            <div className="panel-head"><h2>Crew panel</h2><Search size={16} strokeWidth={1.5} /></div>
            <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
              <Input ref={searchRef} placeholder="Filter crew" value={search} onChange={(event) => setSearch(event.target.value)} />
              <div className="toolbar">
                {filters.map((item) => <button key={item} className={`badge ${filter === item ? 'badge-ok' : 'badge-neutral'}`} onClick={() => setFilter(item)}>{item}</button>)}
              </div>
              <div className="crew-list">
                {crewList.map((member) => {
                  const unavailable = onDutyIds.has(member.id) || leaveIds.has(member.id);
                  return (
                    <div
                      className={`crew-card ${unavailable ? 'unavailable' : ''}`}
                      draggable={!leaveIds.has(member.id)}
                      key={member.id}
                      onDragStart={() => setDragCrew(member)}
                      onDragEnd={() => setDragCrew(null)}
                    >
                      <Avatar initials={member.initials} />
                      <div className="crew-meta">
                        <strong><span className="status-dot" />{member.full_name}</strong>
                        <small>{member.rank} · {member.base_airport}</small>
                        <DutyBar used={member.monthly_hours_used} max={member.monthly_hours_max} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
          <section>
            {Object.entries(grouped).map(([group, groupRoutes]) => (
              <div className="board-group" key={group}>
                <button onClick={() => setCollapsed((state) => ({ ...state, [group]: !state[group] }))}>{collapsed[group] ? '+' : '-'} {group}</button>
                {!collapsed[group] && groupRoutes.map((route) => <RouteRow key={route.id} route={route} dragCrew={dragCrew} shake={shake} assignedByRank={assignedByRank} onAssign={doAssign} onRemove={(assignment) => unassign.mutate({ routeId: route.id, crewId: assignment.id })} onQuick={(rank, rect) => setPopover({ route, rank, left: rect.left, top: rect.bottom + 6 })} />)}
              </div>
            ))}
          </section>
        </div>
      ) : (
        <WeekBoard routes={routes.data ?? []} days={weekDays} onPick={(picked) => { setDate(picked); setMode('day'); }} />
      )}
      {popover && <QuickAssignPopover popover={popover} crew={crewList.filter((member) => member.rank === popover.rank)} context={{ allAssignments, leaveRequests: leave.data ?? [] }} onClose={() => setPopover(null)} onAssign={doAssign} />}
      <Modal title="Keyboard shortcuts" open={help} onClose={() => setHelp(false)}>
        <div className="detail-grid">
          {['/ Focus crew search', 'D Day mode', 'W Week mode', '←→ Previous / next', 'T Today', 'Esc Close'].map((shortcut) => <div className="kv" key={shortcut}><strong>{shortcut}</strong></div>)}
        </div>
      </Modal>
      <div className="hint-bar">Press ? for keyboard shortcuts · / to search crew</div>
    </>
  );
}

function RouteRow({ route, dragCrew, shake, assignedByRank, onAssign, onRemove, onQuick }: {
  route: FlightRoute;
  dragCrew: CrewMember | null;
  shake: string;
  assignedByRank: (route: FlightRoute, rank: CrewRank) => Assignment[];
  onAssign: (member: CrewMember, route: FlightRoute, rank: CrewRank) => void;
  onRemove: (assignment: Assignment) => void;
  onQuick: (rank: CrewRank, rect: DOMRect) => void;
}) {
  const slots = routeSlots(route);
  const used: Record<string, number> = {};
  return (
    <div className={`route-row ${routeState(route)}`}>
      <div className="route-cell"><strong>{route.departure_time}</strong><small>DEP</small></div>
      <div className="route-cell"><strong>{route.flight_number}</strong><small>{route.airline_iata}</small></div>
      <div className="route-cell"><strong>{route.from_airport} {'->'} {route.to_airport}</strong><small>Sector</small></div>
      <div className="route-cell"><strong>{route.aircraft_type}</strong><small>{route.aircraft_reg}</small></div>
      <div className="slots">
        {slots.map((rank, index) => {
          const rankMatches = assignedByRank(route, rank);
          const offset = used[rank] ?? 0;
          const assignment = rankMatches[offset];
          used[rank] = offset + 1;
          const key = `${route.id}-${rank}-${index}`;
          return (
            <button
              className={`slot ${assignment ? 'filled' : ''} ${rankCompatible(dragCrew, rank) ? 'compatible' : ''} ${shake === `${route.id}-${rank}` ? 'shake' : ''}`}
              key={key}
              onClick={(event) => !assignment && onQuick(rank, event.currentTarget.getBoundingClientRect())}
              onDragOver={(event) => { if (!assignment && rankCompatible(dragCrew, rank)) event.preventDefault(); }}
              onDrop={(event) => { event.preventDefault(); if (dragCrew) void onAssign(dragCrew, route, rank); }}
            >
              {assignment ? <><Avatar initials={assignment.initials} size={22} />{assignment.full_name}<span className="remove" onClick={(event) => { event.stopPropagation(); onRemove(assignment); }}><X size={13} strokeWidth={1.5} /></span></> : <>+ {rank}</>}
            </button>
          );
        })}
      </div>
      <div className="route-cell"><Badge tone={routeState(route) === 'critical' ? 'danger' : routeState(route) === 'warn' ? 'warn' : 'ok'}>{route.status}</Badge></div>
    </div>
  );
}

function QuickAssignPopover({ popover, crew, context, onClose, onAssign }: {
  popover: { route: FlightRoute; rank: CrewRank; left: number; top: number };
  crew: CrewMember[];
  context: { allAssignments: Array<Assignment & Pick<FlightRoute, 'departure_date' | 'departure_time' | 'arrival_time' | 'duration_mins'>>; leaveRequests: LeaveRequest[] };
  onClose: () => void;
  onAssign: (member: CrewMember, route: FlightRoute, rank: CrewRank) => void;
}) {
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const candidates = crew.filter((member) => member.full_name.toLowerCase().includes(term.toLowerCase())).sort((a, b) => a.monthly_hours_used - b.monthly_hours_used);
  useKeyboard({
    ArrowDown: () => setActive((value) => Math.min(candidates.length - 1, value + 1)),
    ArrowUp: () => setActive((value) => Math.max(0, value - 1)),
    Enter: () => { const member = candidates[active]; if (member) void onAssign(member, popover.route, popover.rank); },
    Escape: onClose
  }, true);

  return (
    <div className="popover" style={{ left: Math.min(popover.left, window.innerWidth - 320), top: popover.top }}>
      <h3>{popover.rank} · {popover.route.flight_number}</h3>
      <Input autoFocus placeholder="Search eligible crew" value={term} onChange={(event) => setTerm(event.target.value)} />
      <div style={{ marginTop: 8 }}>
        {candidates.map((member, index) => {
          const conflicts = checkAllConflicts(member, popover.route, popover.rank, context);
          return (
            <button className={`candidate ${index === active ? 'active' : ''}`} key={member.id} onClick={() => void onAssign(member, popover.route, popover.rank)}>
              <Avatar initials={member.initials} size={28} />
              <span><strong style={{ display: 'block', fontSize: 13 }}>{member.full_name}</strong><small style={{ color: 'var(--text-tertiary)' }}>{member.monthly_hours_used} hrs</small></span>
              {conflicts.length ? <AlertTriangle size={15} strokeWidth={1.5} color="var(--status-warn)" /> : <Calendar size={15} strokeWidth={1.5} color="var(--status-ok)" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekBoard({ routes, days, onPick }: { routes: FlightRoute[]; days: string[]; onPick: (date: string) => void }) {
  const flightNumbers = Array.from(new Set(routes.map((route) => route.flight_number)));
  return (
    <div className="week-grid">
      <div className="week-cell"><strong>Flight</strong></div>
      {days.map((day) => <div className="week-cell" key={day}><strong>{format(parseISO(day), 'EEE')}</strong><small style={{ display: 'block', color: 'var(--text-tertiary)' }}>{format(parseISO(day), 'd MMM')}</small></div>)}
      {flightNumbers.map((flight) => (
        <>
          <div className="week-cell" key={`${flight}-label`}><strong>{flight}</strong></div>
          {days.map((day) => {
            const dayRoutes = routes.filter((route) => route.flight_number === flight && route.departure_date === day);
            const open = dayRoutes.reduce((sum, route) => sum + Math.max(0, route.required_captains + route.required_fos + route.required_cabin - route.assignments.length), 0);
            return (
              <div className={`week-cell ${dayRoutes.length ? '' : 'hatched'}`} key={`${flight}-${day}`}>
                <button onClick={() => onPick(day)}>
                  {dayRoutes.length === 0 ? <small>No flight</small> : open ? <Badge tone="warn">{open} open</Badge> : <span><span className="green-dot" /> staffed</span>}
                </button>
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
}
