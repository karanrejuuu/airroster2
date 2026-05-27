import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../server/app.js';

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

function normalizePathParam(value: string | string[] | undefined) {
  if (!value) return '';
  return Array.isArray(value) ? value.join('/') : value;
}

export default function handler(req: VercelRequest, res: ServerResponse) {
  const apiPath = normalizePathParam(req.query?.path);

  if (apiPath) {
    const originalUrl = new URL(req.url ?? '/api', 'http://localhost');
    originalUrl.searchParams.delete('path');
    req.url = `/api/${apiPath}${originalUrl.search}`;
  }

  return app(req, res);
}
