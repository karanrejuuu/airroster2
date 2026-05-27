# Vercel Deployment

## Status

The project is prepared for Vercel upload as a Vite frontend plus Express API functions. The repository root is the only project root Vercel needs.

## Vercel Settings

The repository includes `vercel.json` with:

- Build command: `npm run build`
- Output directory: `client/dist`
- `/api` routes handled by Vercel Functions in the `api/` directory
- All other routes rewritten to `index.html` for the React app

## Runtime Notes

- Local development uses SQLite at `server/database.sqlite`.
- Local development and Vercel both seed demo data automatically when the database is empty.
- Vercel uses SQLite at `/tmp/airroster.sqlite`.
- The Vercel database is demo-only because `/tmp` storage is ephemeral in a serverless environment.
- For a production deployment with persistent data, replace SQLite with a hosted database such as Vercel Postgres, Neon, Supabase, or Turso.

## Local Commands

```powershell
npm install
npm run dev
```

`npm run dev` starts the API on `http://localhost:3001` and the Vite app on `http://localhost:5173`.

```powershell
npm run build
npm start
```

After a build, `npm start` serves the API and the built frontend from `http://localhost:3001`.

## Upload Steps

1. Push this folder to GitHub.
2. Import the GitHub repository in Vercel.
3. Keep the detected project root as the repository root.
4. Confirm the build command is `npm run build`.
5. Confirm the output directory is `client/dist`.
6. Add `JWT_SECRET` in Vercel Environment Variables for production.

## Demo Credentials

- `admin@airroster.com` / `admin123`
- `dispatch@airroster.com` / `dispatch123`
- `arjun.varma@airroster.com` / `crew123`

All seeded pilot and cabin crew accounts use `crew123`.
