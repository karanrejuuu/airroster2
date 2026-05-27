import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const dbPath = fileURLToPath(new URL('./database.sqlite', import.meta.url));

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS airlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iata_code TEXT UNIQUE NOT NULL,
      icao_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      hub_airport TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS crew (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      initials TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','dispatcher','pilot','cabin_crew')),
      rank TEXT CHECK (rank IN ('Captain','First Officer','Purser','Senior Flight Attendant','Flight Attendant')),
      crew_type TEXT CHECK (crew_type IN ('pilot','cabin')),
      airline_id INTEGER REFERENCES airlines(id),
      base_airport TEXT NOT NULL,
      monthly_hours_used REAL DEFAULT 0,
      monthly_hours_max REAL DEFAULT 90,
      leave_balance INTEGER DEFAULT 21,
      phone TEXT,
      license_number TEXT,
      license_expiry TEXT,
      medical_expiry TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_number TEXT NOT NULL,
      airline_id INTEGER NOT NULL REFERENCES airlines(id),
      aircraft_type TEXT NOT NULL,
      aircraft_reg TEXT NOT NULL,
      total_seats INTEGER,
      required_captains INTEGER DEFAULT 1,
      required_fos INTEGER DEFAULT 1,
      required_cabin INTEGER DEFAULT 3,
      status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(flight_number, airline_id)
    );

    CREATE TABLE IF NOT EXISTS flight_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id INTEGER NOT NULL REFERENCES flights(id),
      from_airport TEXT NOT NULL,
      to_airport TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      distance_km INTEGER,
      cruising_alt TEXT DEFAULT 'FL350',
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled','delayed')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS crew_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_route_id INTEGER NOT NULL REFERENCES flight_routes(id) ON DELETE CASCADE,
      crew_id INTEGER NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
      role_on_flight TEXT NOT NULL CHECK (role_on_flight IN ('Captain','First Officer','Purser','Senior Flight Attendant','Flight Attendant')),
      assigned_by INTEGER REFERENCES crew(id),
      assigned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(flight_route_id, crew_id)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crew_id INTEGER NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      leave_type TEXT NOT NULL CHECK (leave_type IN ('annual','sick','training','emergency')),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      note TEXT,
      reviewed_by INTEGER REFERENCES crew(id),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS airports (
      iata TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      timezone TEXT NOT NULL
    );
  `);
}

export function publicCrewSelect(prefix = 'c') {
  return `
    ${prefix}.id, ${prefix}.employee_id, ${prefix}.full_name, ${prefix}.initials,
    ${prefix}.email, ${prefix}.role, ${prefix}.rank, ${prefix}.crew_type,
    ${prefix}.airline_id, ${prefix}.base_airport, ${prefix}.monthly_hours_used,
    ${prefix}.monthly_hours_max, ${prefix}.leave_balance, ${prefix}.phone,
    ${prefix}.license_number, ${prefix}.license_expiry, ${prefix}.medical_expiry,
    ${prefix}.status, ${prefix}.created_at
  `;
}

export function getProfile(id: number) {
  return db.prepare(`
    SELECT ${publicCrewSelect('c')}, a.name AS airline_name, a.iata_code AS airline_iata
    FROM crew c
    LEFT JOIN airlines a ON a.id = c.airline_id
    WHERE c.id = ?
  `).get(id);
}

export function runUpdate(table: string, id: number, allowed: string[], body: Record<string, unknown>) {
  const entries = allowed.filter((key) => body[key] !== undefined);
  if (entries.length === 0) return { changes: 0 };
  const setSql = entries.map((key) => `${key} = @${key}`).join(', ');
  return db.prepare(`UPDATE ${table} SET ${setSql} WHERE id = @id`).run({ ...body, id });
}

initSchema();
