import app from './app.js';
import express from 'express';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const port = Number(process.env.PORT || 3001);
const clientDist = resolve(process.cwd(), 'client/dist');

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`AirRoster listening on http://localhost:${port}`);
});
