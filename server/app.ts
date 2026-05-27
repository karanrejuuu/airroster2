/// <reference path="./express.d.ts" />

import cookieParser from 'cookie-parser';
import express from 'express';
import { db, initSchema } from './database.js';
import { verifyJWT } from './middleware/auth.js';
import { airlinesRouter } from './routes/airlines.js';
import { assignmentsRouter } from './routes/assignments.js';
import { authRouter } from './routes/auth.js';
import { crewRouter } from './routes/crew.js';
import { flightRoutesRouter } from './routes/flightRoutes.js';
import { flightsRouter } from './routes/flights.js';
import { leaveRouter } from './routes/leave.js';
import { seedDatabaseIfEmpty } from './seed.js';

initSchema();
seedDatabaseIfEmpty();

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/crew', crewRouter);
app.use('/api/airlines', airlinesRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/routes', flightRoutesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/leave', leaveRouter);
app.get('/api/airports', verifyJWT, (_req, res) => {
  res.json(db.prepare('SELECT * FROM airports ORDER BY iata').all());
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
