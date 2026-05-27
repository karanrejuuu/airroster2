import { Router } from 'express';
import { db } from '../database.js';
import { verifyJWT } from '../middleware/auth.js';

export const assignmentsRouter = Router();
assignmentsRouter.use(verifyJWT);

assignmentsRouter.get('/', (req, res) => {
  const query = req.query as { crewId?: string; from?: string; to?: string };
  const requestedCrewId = query.crewId ? Number(query.crewId) : req.user?.id;
  if (!requestedCrewId) return res.status(400).json({ error: 'crewId is required' });
  if ((req.user?.role === 'pilot' || req.user?.role === 'cabin_crew') && req.user.id !== requestedCrewId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const clauses = ['ca.crew_id = ?'];
  const params: unknown[] = [requestedCrewId];
  if (query.from) {
    clauses.push('fr.departure_date >= ?');
    params.push(query.from);
  }
  if (query.to) {
    clauses.push('fr.departure_date <= ?');
    params.push(query.to);
  }
  res.json(db.prepare(`
    SELECT ca.role_on_flight, fr.*, f.flight_number, f.aircraft_type, f.aircraft_reg,
      a.name AS airline_name, a.iata_code AS airline_iata
    FROM crew_assignments ca
    JOIN flight_routes fr ON fr.id = ca.flight_route_id
    JOIN flights f ON f.id = fr.flight_id
    JOIN airlines a ON a.id = f.airline_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY fr.departure_date, fr.departure_time
  `).all(...params));
});
