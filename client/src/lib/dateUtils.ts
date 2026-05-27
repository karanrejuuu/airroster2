import { addDays, differenceInCalendarDays, format, isToday, parseISO } from 'date-fns';

export function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function readableDate(date: string) {
  return format(parseISO(date), 'EEE, d MMM');
}

export function daysBetween(from: string, to: string) {
  return differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
}

export function routeDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function dayPart(time: string) {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

export function dateShift(date: string, days: number) {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd');
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function isDateToday(date: string) {
  return isToday(parseISO(date));
}
