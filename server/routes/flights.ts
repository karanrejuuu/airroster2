import { Router } from 'express';
import { db, runUpdate } from '../database.js';
import { requireRole, verifyJWT } from '../middleware/auth.js';

export const flightsRouter = Router();
flightsRouter.use(verifyJWT);

flightsRouter.get('/', (_req, res) => {
  res.json(db.prepare(`
    SELECT f.*, a.name AS airline_name, a.iata_code AS airline_iata
    FROM flights f JOIN airlines a ON a.id = f.airline_id
    ORDER BY f.flight_number
  `).all());
});

flightsRouter.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT f.*, a.name AS airline_name, a.iata_code AS airline_iata
    FROM flights f JOIN airlines a ON a.id = f.airline_id
    WHERE f.id = ?
  `).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Flight not found' });
  res.json(row);
});

flightsRouter.post('/', requireRole('admin'), (req, res) => {
  const body = req.body as Record<string, unknown>;
  const info = db.prepare(`
    INSERT INTO flights (
      flight_number, airline_id, aircraft_type, aircraft_reg, total_seats,
      required_captains, required_fos, required_cabin, status
    )
    VALUES (
      @flight_number, @airline_id, @aircraft_type, @aircraft_reg, @total_seats,
      COALESCE(@required_captains, 1), COALESCE(@required_fos, 1), COALESCE(@required_cabin, 3),
      COALESCE(@status, 'active')
    )
  `).run(body);
  res.status(201).json(db.prepare('SELECT * FROM flights WHERE id = ?').get(info.lastInsertRowid));
});

flightsRouter.put('/:id', requireRole('admin'), (req, res) => {
  runUpdate('flights', Number(req.params.id), [
    'flight_number', 'airline_id', 'aircraft_type', 'aircraft_reg', 'total_seats',
    'required_captains', 'required_fos', 'required_cabin', 'status'
  ], req.body);
  res.json(db.prepare('SELECT * FROM flights WHERE id = ?').get(Number(req.params.id)));
});

flightsRouter.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE flights SET status = 'inactive' WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});

flightsRouter.get('/:id/routes', (req, res) => {
  res.json(db.prepare('SELECT * FROM flight_routes WHERE flight_id = ? ORDER BY departure_date DESC, departure_time').all(Number(req.params.id)));
});
