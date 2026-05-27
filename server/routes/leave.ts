import { Router } from 'express';
import { db } from '../database.js';
import { requireRole, verifyJWT } from '../middleware/auth.js';

export const leaveRouter = Router();
leaveRouter.use(verifyJWT);

leaveRouter.get('/', (req, res) => {
  if (req.user?.role === 'admin' || req.user?.role === 'dispatcher') {
    res.json(db.prepare(`
      SELECT lr.*, c.full_name, c.rank, c.crew_type
      FROM leave_requests lr JOIN crew c ON c.id = lr.crew_id
      ORDER BY lr.created_at DESC
    `).all());
    return;
  }
  res.json(db.prepare('SELECT * FROM leave_requests WHERE crew_id = ? ORDER BY created_at DESC').all(req.user?.id));
});

leaveRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(Number(req.params.id)) as { crew_id: number } | undefined;
  if (!row) return res.status(404).json({ error: 'Leave request not found' });
  if ((req.user?.role === 'pilot' || req.user?.role === 'cabin_crew') && row.crew_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(row);
});

leaveRouter.post('/', (req, res) => {
  const body = req.body as Record<string, unknown> & { crew_id?: number };
  const crewId = Number(body.crew_id ?? req.user?.id);
  if ((req.user?.role === 'pilot' || req.user?.role === 'cabin_crew') && crewId !== req.user.id) {
    return res.status(403).json({ error: 'Crew can only request own leave' });
  }
  const info = db.prepare(`
    INSERT INTO leave_requests (crew_id, from_date, to_date, leave_type, note)
    VALUES (?, @from_date, @to_date, @leave_type, @note)
  `).run(crewId, body);
  res.status(201).json(db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(info.lastInsertRowid));
});

leaveRouter.put('/:id/review', requireRole('admin', 'dispatcher'), (req, res) => {
  const { status } = req.body as { status?: string };
  if (status !== 'approved' && status !== 'rejected') return res.status(400).json({ error: 'Invalid status' });
  db.prepare(`
    UPDATE leave_requests
    SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).run(status, req.user?.id, Number(req.params.id));
  res.json(db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(Number(req.params.id)));
});
