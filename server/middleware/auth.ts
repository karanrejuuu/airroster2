import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtUser } from '../types.js';

const cookieName = 'airroster_token';
const jwtSecret = process.env.JWT_SECRET || 'airroster-dev-secret';

export function signUser(user: JwtUser) {
  return jwt.sign(user, jwtSecret, { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(cookieName);
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  const token = (req.cookies[cookieName] as string | undefined) || bearerToken;
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  try {
    req.user = jwt.verify(token, jwtSecret) as JwtUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
