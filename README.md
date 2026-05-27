# AirRoster

AirRoster is an Airline Crew Roster application for managing crew, airlines, flights, and scheduled flight routes.

## Core Masters

- Crew Master: Pilots, First Officers, Flight Attendants, duty hours, licences, medicals, leave balance.
- Airline Master: Airline name, IATA, ICAO, hub, country, status.
- Flight Master: Flight number, airline, aircraft, registration, required crew.
- Flight Route: Date, time, sector, duration, status, assigned crew.

## Local Setup

```powershell
npm install
npm run dev
```

Client: `http://localhost:5173`

API: `http://localhost:3001/api/health`

The app creates and seeds `server/database.sqlite` automatically the first time it starts. Run `npm run seed` only when you want to reset the demo data.

For a production-style local run:

```powershell
npm run build
npm start
```

App: `http://localhost:3001`

## Login

- Admin: `admin@airroster.com` / `admin123`
- Dispatcher: `dispatch@airroster.com` / `dispatch123`
- Crew: `arjun.varma@airroster.com` / `crew123`

## Checks

```powershell
npm run typecheck
npm run build
```

## Vercel

This repository includes `vercel.json` and `api/` function entrypoints. Import the repository into Vercel and use:

- Build command: `npm run build`
- Output directory: `client/dist`
- Environment variable: `JWT_SECRET`

See `DEPLOYMENT.md` for notes about Vercel runtime storage and production database recommendations.
