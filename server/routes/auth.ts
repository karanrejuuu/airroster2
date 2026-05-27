import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, getProfile, publicCrewSelect } from '../database.js';
import { clearAuthCookie, setAuthCookie, signUser, verifyJWT } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare(`SELECT id, email, role, password_hash FROM crew WHERE email = ? AND status = 'active'`).get(email) as
    | { id: number; email: string; role: 'admin' | 'dispatcher' | 'pilot' | 'cabin_crew'; password_hash: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signUser({ id: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);
  const profile = getProfile(user.id);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role }, profile });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', verifyJWT, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorised' });
  const profile = getProfile(req.user.id);
  if (!profile) return res.status(401).json({ error: 'Profile not found' });
  const user = db.prepare(`SELECT ${publicCrewSelect('c')} FROM crew c WHERE c.id = ?`).get(req.user.id);
  res.json({ user, profile });
});
