import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, publicCrewSelect, runUpdate } from '../database.js';
import { requireRole, verifyJWT } from '../middleware/auth.js';

export const crewRouter = Router();
crewRouter.use(verifyJWT);

crewRouter.get('/', requireRole('admin', 'dispatcher'), (_req, res) => {
  const rows = db.prepare(`
    SELECT ${publicCrewSelect('c')}, a.name AS airline_name, a.iata_code AS airline_iata
    FROM crew c LEFT JOIN airlines a ON a.id = c.airline_id
    ORDER BY c.status = 'active' DESC, c.full_name
  `).all();
  res.json(rows);
});

crewRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.user.id !== id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const row = db.prepare(`
    SELECT ${publicCrewSelect('c')}, a.name AS airline_name, a.iata_code AS airline_iata
    FROM crew c LEFT JOIN airlines a ON a.id = c.airline_id
    WHERE c.id = ?
  `).get(id);
  if (!row) return res.status(404).json({ error: 'Crew member not found' });
  res.json(row);
});

crewRouter.post('/', requireRole('admin'), (req, res) => {
  const body = req.body as Record<string, unknown> & { password?: string; full_name?: string };
  const fullName = String(body.full_name ?? '');
  const initials = fullName.split(' ').filter(Boolean).map((part) => part[0]?.toUpperCase()).join('').slice(0, 3);
  const passwordHash = bcrypt.hashSync(body.password || 'crew123', 10);
  const info = db.prepare(`
    INSERT INTO crew (
      employee_id, full_name, initials, email, password_hash, role, rank, crew_type, airline_id,
      base_airport, monthly_hours_used, monthly_hours_max, leave_balance, phone, license_number,
      license_expiry, medical_expiry, status
    )
    VALUES (
      @employee_id, @full_name, @initials, @email, @password_hash, @role, @rank, @crew_type, @airline_id,
      @base_airport, COALESCE(@monthly_hours_used, 0), COALESCE(@monthly_hours_max, 90),
      COALESCE(@leave_balance, 21), @phone, @license_number, @license_expiry, @medical_expiry,
      COALESCE(@status, 'active')
    )
  `).run({ ...body, initials, password_hash: passwordHash });
  res.status(201).json(db.prepare(`SELECT ${publicCrewSelect('c')} FROM crew c WHERE c.id = ?`).get(info.lastInsertRowid));
});

crewRouter.put('/:id', requireRole('admin'), (req, res) => {
  const body = { ...(req.body as Record<string, unknown>) };
  if (body.password) {
    body.password_hash = bcrypt.hashSync(String(body.password), 10);
    delete body.password;
  }
  if (body.full_name) {
    body.initials = String(body.full_name).split(' ').filter(Boolean).map((part) => part[0]?.toUpperCase()).join('').slice(0, 3);
  }
  runUpdate('crew', Number(req.params.id), [
    'employee_id', 'full_name', 'initials', 'email', 'password_hash', 'role', 'rank', 'crew_type',
    'airline_id', 'base_airport', 'monthly_hours_used', 'monthly_hours_max', 'leave_balance',
    'phone', 'license_number', 'license_expiry', 'medical_expiry', 'status'
  ], body);
  res.json(db.prepare(`SELECT ${publicCrewSelect('c')} FROM crew c WHERE c.id = ?`).get(Number(req.params.id)));
});

crewRouter.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE crew SET status = 'inactive' WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});

crewRouter.get('/:id/assignments', (req, res) => {
  const id = Number(req.params.id);
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.user.id !== id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`
    SELECT ca.*, fr.*, f.flight_number, f.aircraft_type, f.aircraft_reg, a.name AS airline_name
    FROM crew_assignments ca
    JOIN flight_routes fr ON fr.id = ca.flight_route_id
    JOIN flights f ON f.id = fr.flight_id
    JOIN airlines a ON a.id = f.airline_id
    WHERE ca.crew_id = ?
    ORDER BY fr.departure_date, fr.departure_time
  `).all(id);
  res.json(rows);
});

crewRouter.get('/:id/leave', (req, res) => {
  const id = Number(req.params.id);
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.user.id !== id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(db.prepare('SELECT * FROM leave_requests WHERE crew_id = ? ORDER BY from_date DESC').all(id));
});
