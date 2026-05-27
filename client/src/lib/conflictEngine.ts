import { differenceInMinutes } from 'date-fns';
import type { Assignment, CrewMember, CrewRank, FlightRoute, LeaveRequest } from '../types';
import { routeDateTime } from './dateUtils';

export type ConflictResult = {
  rule: 'rest' | 'limit' | 'double_booking' | 'rank' | 'leave';
  severity: 'block' | 'warn';
  message: string;
};

export type ConflictContext = {
  allAssignments: Array<Assignment & Pick<FlightRoute, 'departure_date' | 'departure_time' | 'arrival_time' | 'duration_mins'>>;
  leaveRequests: LeaveRequest[];
};

function dutyStart(route: FlightRoute) {
  return routeDateTime(route.departure_date, route.departure_time);
}

function dutyEnd(route: Pick<FlightRoute, 'departure_date' | 'arrival_time' | 'duration_mins' | 'departure_time'>) {
  return new Date(routeDateTime(route.departure_date, route.departure_time).getTime() + route.duration_mins * 60_000);
}

export function checkRestPeriod(crew: CrewMember, route: FlightRoute, allAssignments: ConflictContext['allAssignments']): ConflictResult | null {
  const nextStart = dutyStart(route);
  const prior = allAssignments
    .filter((assignment) => assignment.id === crew.id)
    .map((assignment) => dutyEnd(assignment))
    .filter((end) => end <= nextStart)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  if (!prior) return null;
  const hours = differenceInMinutes(nextStart, prior) / 60;
  return hours < 10 ? { rule: 'rest', severity: 'block', message: `Rest is ${hours.toFixed(1)}h, below DGCA 10h minimum.` } : null;
}

export function checkDutyLimit(crew: CrewMember, route: FlightRoute): ConflictResult | null {
  const next = crew.monthly_hours_used + route.duration_mins / 60;
  if (next > crew.monthly_hours_max) return { rule: 'limit', severity: 'block', message: 'Monthly duty limit would be exceeded.' };
  if (next / crew.monthly_hours_max >= 0.95) return { rule: 'limit', severity: 'warn', message: 'Crew will be near monthly duty limit.' };
  return null;
}

export function checkDoubleBooking(crew: CrewMember, route: FlightRoute, allAssignments: ConflictContext['allAssignments']): ConflictResult | null {
  const start = dutyStart(route).getTime();
  const end = dutyEnd(route).getTime();
  const overlap = allAssignments.some((assignment) => {
    if (assignment.id !== crew.id || assignment.flight_route_id === route.id) return false;
    const otherStart = routeDateTime(assignment.departure_date, assignment.departure_time).getTime();
    const otherEnd = dutyEnd(assignment).getTime();
    return start < otherEnd && otherStart < end;
  });
  return overlap ? { rule: 'double_booking', severity: 'block', message: 'Crew is already assigned to an overlapping route.' } : null;
}

export function checkRankMatch(crew: CrewMember, slotType: CrewRank): ConflictResult | null {
  return crew.rank === slotType ? null : { rule: 'rank', severity: 'block', message: `${slotType} slot requires matching rank.` };
}

export function checkLeaveConflict(crew: CrewMember, route: FlightRoute, leaveRequests: LeaveRequest[]): ConflictResult | null {
  const hit = leaveRequests.some((leave) => leave.crew_id === crew.id && leave.status === 'approved' && leave.from_date <= route.departure_date && leave.to_date >= route.departure_date);
  return hit ? { rule: 'leave', severity: 'warn', message: 'Crew has approved leave on this date.' } : null;
}

export function checkAllConflicts(crew: CrewMember, route: FlightRoute, slotType: CrewRank, context: ConflictContext): ConflictResult[] {
  return [
    checkRankMatch(crew, slotType),
    checkDutyLimit(crew, route),
    checkDoubleBooking(crew, route, context.allAssignments),
    checkRestPeriod(crew, route, context.allAssignments),
    checkLeaveConflict(crew, route, context.leaveRequests)
  ].filter((result): result is ConflictResult => Boolean(result));
}
