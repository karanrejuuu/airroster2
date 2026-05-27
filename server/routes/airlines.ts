import { Router } from 'express';
import { db, runUpdate } from '../database.js';
import { requireRole, verifyJWT } from '../middleware/auth.js';

export const airlinesRouter = Router();
airlinesRouter.use(verifyJWT);

airlinesRouter.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM flights f WHERE f.airline_id = a.id AND f.status = 'active') AS active_flight_count,
      (SELECT COUNT(*) FROM crew c WHERE c.airline_id = a.id AND c.status = 'active') AS active_crew_count
    FROM airlines a
    ORDER BY a.name
  `).all();
  res.json(rows);
});

airlinesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM airlines WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Airline not found' });
  res.json(row);
});

airlinesRouter.post('/', requireRole('admin'), (req, res) => {
  const body = req.body as Record<string, unknown>;
  const info = db.prepare(`
    INSERT INTO airlines (iata_code, icao_code, name, country, hub_airport, status)
    VALUES (@iata_code, @icao_code, @name, @country, @hub_airport, COALESCE(@status, 'active'))
  `).run(body);
  res.status(201).json(db.prepare('SELECT * FROM airlines WHERE id = ?').get(info.lastInsertRowid));
});

airlinesRouter.put('/:id', requireRole('admin'), (req, res) => {
  runUpdate('airlines', Number(req.params.id), ['iata_code', 'icao_code', 'name', 'country', 'hub_airport', 'status'], req.body);
  res.json(db.prepare('SELECT * FROM airlines WHERE id = ?').get(Number(req.params.id)));
});

airlinesRouter.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE airlines SET status = 'inactive' WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});
