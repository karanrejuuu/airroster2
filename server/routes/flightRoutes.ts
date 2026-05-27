import { Router } from 'express';
import { db, publicCrewSelect, runUpdate } from '../database.js';
import { requireRole, verifyJWT } from '../middleware/auth.js';

export const flightRoutesRouter = Router();
flightRoutesRouter.use(verifyJWT);

const routeSelect = `
  fr.*, f.flight_number, f.aircraft_type, f.aircraft_reg, f.required_captains,
  f.required_fos, f.required_cabin, a.name AS airline_name, a.iata_code AS airline_iata,
  dep.name AS from_name, dep.city AS from_city, dep.lat AS from_lat, dep.lng AS from_lng,
  arr.name AS to_name, arr.city AS to_city, arr.lat AS to_lat, arr.lng AS to_lng
`;

function routeBase(where = '') {
  return `
    SELECT ${routeSelect}
    FROM flight_routes fr
    JOIN flights f ON f.id = fr.flight_id
    JOIN airlines a ON a.id = f.airline_id
    LEFT JOIN airports dep ON dep.iata = fr.from_airport
    LEFT JOIN airports arr ON arr.iata = fr.to_airport
    ${where}
  `;
}

function routeAssignments(routeId: number) {
  return db.prepare(`
    SELECT ca.id AS assignment_id, ca.flight_route_id, ca.role_on_flight,
      ${publicCrewSelect('c')}, a.name AS airline_name
    FROM crew_assignments ca
    JOIN crew c ON c.id = ca.crew_id
    LEFT JOIN airlines a ON a.id = c.airline_id
    WHERE ca.flight_route_id = ?
    ORDER BY ca.role_on_flight, c.full_name
  `).all(routeId);
}

flightRoutesRouter.get('/', (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const params = req.query as { date?: string; week?: string };
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (params.date) {
    clauses.push('fr.departure_date = ?');
    values.push(params.date);
  }
  if (user.role === 'pilot' || user.role === 'cabin_crew') {
    clauses.push('fr.id IN (SELECT flight_route_id FROM crew_assignments WHERE crew_id = ?)');
    values.push(user.id);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const routes = db.prepare(`${routeBase(where)} ORDER BY fr.departure_date, fr.departure_time`).all(...values) as Array<{ id: number }>;
  res.json(routes.map((route) => ({ ...route, assignments: routeAssignments(route.id) })));
});

flightRoutesRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const route = db.prepare(routeBase('WHERE fr.id = ?')).get(id) as { id: number } | undefined;
  if (!route) return res.status(404).json({ error: 'Route not found' });
  if (req.user?.role === 'pilot' || req.user?.role === 'cabin_crew') {
    const assigned = db.prepare('SELECT 1 FROM crew_assignments WHERE flight_route_id = ? AND crew_id = ?').get(id, req.user.id);
    if (!assigned) return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ ...route, assignments: routeAssignments(id) });
});

flightRoutesRouter.post('/', requireRole('admin', 'dispatcher'), (req, res) => {
  const body = req.body as Record<string, unknown>;
  const info = db.prepare(`
    INSERT INTO flight_routes (
      flight_id, from_airport, to_airport, departure_date, departure_time, arrival_time,
      duration_mins, distance_km, cruising_alt, status
    )
    VALUES (
      @flight_id, @from_airport, @to_airport, @departure_date, @departure_time, @arrival_time,
      @duration_mins, @distance_km, COALESCE(@cruising_alt, 'FL350'), COALESCE(@status, 'scheduled')
    )
  `).run(body);
  res.status(201).json(db.prepare(routeBase('WHERE fr.id = ?')).get(info.lastInsertRowid));
});

flightRoutesRouter.put('/:id', requireRole('admin', 'dispatcher'), (req, res) => {
  runUpdate('flight_routes', Number(req.params.id), [
    'flight_id', 'from_airport', 'to_airport', 'departure_date', 'departure_time',
    'arrival_time', 'duration_mins', 'distance_km', 'cruising_alt', 'status'
  ], req.body);
  res.json(db.prepare(routeBase('WHERE fr.id = ?')).get(Number(req.params.id)));
});

flightRoutesRouter.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM flight_routes WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

flightRoutesRouter.get('/:id/crew', (req, res) => {
  res.json(routeAssignments(Number(req.params.id)));
});

flightRoutesRouter.post('/:id/assign', requireRole('admin', 'dispatcher'), (req, res) => {
  const { crewId, roleOnFlight } = req.body as { crewId?: number; roleOnFlight?: string };
  if (!crewId || !roleOnFlight) return res.status(400).json({ error: 'crewId and roleOnFlight are required' });
  const crew = db.prepare('SELECT rank, status FROM crew WHERE id = ?').get(crewId) as { rank: string; status: string } | undefined;
  if (!crew || crew.status !== 'active') return res.status(400).json({ error: 'Crew member is not active' });
  if (crew.rank !== roleOnFlight) return res.status(409).json({ error: 'Rank mismatch' });
  db.prepare(`
    INSERT OR REPLACE INTO crew_assignments (flight_route_id, crew_id, role_on_flight, assigned_by)
    VALUES (?, ?, ?, ?)
  `).run(Number(req.params.id), crewId, roleOnFlight, req.user?.id);
  res.status(201).json(routeAssignments(Number(req.params.id)));
});

flightRoutesRouter.delete('/:id/assign/:crewId', requireRole('admin', 'dispatcher'), (req, res) => {
  db.prepare('DELETE FROM crew_assignments WHERE flight_route_id = ? AND crew_id = ?').run(Number(req.params.id), Number(req.params.crewId));
  res.json({ ok: true });
});
