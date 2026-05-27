import bcrypt from 'bcryptjs';
import { db, initSchema } from './database.js';

initSchema();

type AirlineSeed = { iata: string; icao: string; name: string; country: string; hub: string };
type CrewSeed = {
  employeeId: string;
  name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'pilot' | 'cabin_crew';
  rank: 'Captain' | 'First Officer' | 'Purser' | 'Senior Flight Attendant' | 'Flight Attendant';
  type: 'pilot' | 'cabin';
  airline: string;
  base: string;
  used: number;
  max: number;
  password?: string;
};

const airports = [
  ['DEL', 'Indira Gandhi Intl', 'New Delhi', 'India', 28.5562, 77.1, 'Asia/Kolkata'],
  ['BOM', 'Chhatrapati Shivaji', 'Mumbai', 'India', 19.0896, 72.8656, 'Asia/Kolkata'],
  ['BLR', 'Kempegowda Intl', 'Bengaluru', 'India', 13.1986, 77.7066, 'Asia/Kolkata'],
  ['MAA', 'Chennai Intl', 'Chennai', 'India', 12.9941, 80.1709, 'Asia/Kolkata'],
  ['CCU', 'Netaji Subhas Bose', 'Kolkata', 'India', 22.6547, 88.4467, 'Asia/Kolkata'],
  ['HYD', 'Rajiv Gandhi Intl', 'Hyderabad', 'India', 17.2403, 78.4294, 'Asia/Kolkata'],
  ['COK', 'Cochin Intl', 'Kochi', 'India', 9.9816, 76.2999, 'Asia/Kolkata'],
  ['AMD', 'Sardar Patel Intl', 'Ahmedabad', 'India', 23.0772, 72.6347, 'Asia/Kolkata'],
  ['GOI', 'Goa Intl', 'Goa', 'India', 15.3808, 73.8314, 'Asia/Kolkata'],
  ['JAI', 'Jaipur Intl', 'Jaipur', 'India', 26.8242, 75.8122, 'Asia/Kolkata']
] as const;

const airlines: AirlineSeed[] = [
  { iata: 'AI', icao: 'AIC', name: 'Air India', country: 'India', hub: 'DEL' },
  { iata: '6E', icao: 'IGO', name: 'IndiGo', country: 'India', hub: 'DEL' }
];

const flightSeeds = [
  ['AI 101', 'AI', 'DEL', 'BOM', 'B737-800', 'VT-AIR', 1, 1, 3],
  ['AI 201', 'AI', 'BOM', 'DEL', 'B737-800', 'VT-AIB', 1, 1, 3],
  ['AI 301', 'AI', 'DEL', 'BLR', 'A320', 'VT-AIC', 1, 1, 4],
  ['AI 401', 'AI', 'BLR', 'DEL', 'A320', 'VT-AID', 1, 1, 4],
  ['6E 501', '6E', 'DEL', 'MAA', 'A320neo', 'VT-INA', 1, 1, 4],
  ['6E 601', '6E', 'MAA', 'DEL', 'A320neo', 'VT-INB', 1, 1, 4],
  ['6E 701', '6E', 'DEL', 'CCU', 'A321', 'VT-INC', 1, 1, 5],
  ['6E 801', '6E', 'DEL', 'HYD', 'A320', 'VT-IND', 1, 1, 3]
] as const;

const crewSeeds: CrewSeed[] = [
  { employeeId: 'ADM001', name: 'Aman Kapoor', email: 'admin@airroster.com', role: 'admin', rank: 'Captain', type: 'pilot', airline: 'AI', base: 'DEL', used: 10, max: 90, password: 'admin123' },
  { employeeId: 'DSP001', name: 'Neha Menon', email: 'dispatch@airroster.com', role: 'dispatcher', rank: 'Senior Flight Attendant', type: 'cabin', airline: '6E', base: 'DEL', used: 18, max: 85, password: 'dispatch123' },
  { employeeId: 'P001', name: 'Arjun Varma', email: 'arjun.varma@airroster.com', role: 'pilot', rank: 'Captain', type: 'pilot', airline: 'AI', base: 'DEL', used: 62, max: 90 },
  { employeeId: 'P002', name: 'Rahul Mehta', email: 'rahul.mehta@airroster.com', role: 'pilot', rank: 'Captain', type: 'pilot', airline: 'AI', base: 'BOM', used: 45, max: 90 },
  { employeeId: 'P003', name: 'Kavita Nair', email: 'kavita.nair@airroster.com', role: 'pilot', rank: 'Captain', type: 'pilot', airline: '6E', base: 'BLR', used: 78, max: 90 },
  { employeeId: 'P004', name: 'Suresh Pillai', email: 'suresh.pillai@airroster.com', role: 'pilot', rank: 'Captain', type: 'pilot', airline: '6E', base: 'DEL', used: 88, max: 90 },
  { employeeId: 'P005', name: 'Priya Sharma', email: 'priya.sharma@airroster.com', role: 'pilot', rank: 'First Officer', type: 'pilot', airline: 'AI', base: 'DEL', used: 40, max: 90 },
  { employeeId: 'P006', name: 'Divya Kumar', email: 'divya.kumar@airroster.com', role: 'pilot', rank: 'First Officer', type: 'pilot', airline: 'AI', base: 'BOM', used: 55, max: 90 },
  { employeeId: 'P007', name: 'Aakash Joshi', email: 'aakash.joshi@airroster.com', role: 'pilot', rank: 'First Officer', type: 'pilot', airline: '6E', base: 'BLR', used: 30, max: 90 },
  { employeeId: 'P008', name: 'Meena Rao', email: 'meena.rao@airroster.com', role: 'pilot', rank: 'First Officer', type: 'pilot', airline: '6E', base: 'DEL', used: 82, max: 90 },
  { employeeId: 'C001', name: 'Nina Joshi', email: 'nina.joshi@airroster.com', role: 'cabin_crew', rank: 'Purser', type: 'cabin', airline: 'AI', base: 'DEL', used: 50, max: 85 },
  { employeeId: 'C002', name: 'Rajesh Nair', email: 'rajesh.nair@airroster.com', role: 'cabin_crew', rank: 'Purser', type: 'cabin', airline: '6E', base: 'BOM', used: 65, max: 85 },
  { employeeId: 'C003', name: 'Sara Mathew', email: 'sara.mathew@airroster.com', role: 'cabin_crew', rank: 'Senior Flight Attendant', type: 'cabin', airline: 'AI', base: 'DEL', used: 40, max: 85 },
  { employeeId: 'C004', name: 'Amit Patel', email: 'amit.patel@airroster.com', role: 'cabin_crew', rank: 'Senior Flight Attendant', type: 'cabin', airline: 'AI', base: 'BOM', used: 72, max: 85 },
  { employeeId: 'C005', name: 'Rekha Singh', email: 'rekha.singh@airroster.com', role: 'cabin_crew', rank: 'Senior Flight Attendant', type: 'cabin', airline: '6E', base: 'BLR', used: 35, max: 85 },
  { employeeId: 'C006', name: 'Tom George', email: 'tom.george@airroster.com', role: 'cabin_crew', rank: 'Senior Flight Attendant', type: 'cabin', airline: '6E', base: 'DEL', used: 80, max: 85 },
  { employeeId: 'C007', name: 'Ravi Thomas', email: 'ravi.thomas@airroster.com', role: 'cabin_crew', rank: 'Flight Attendant', type: 'cabin', airline: 'AI', base: 'DEL', used: 28, max: 85 },
  { employeeId: 'C008', name: 'Meera Kumar', email: 'meera.kumar@airroster.com', role: 'cabin_crew', rank: 'Flight Attendant', type: 'cabin', airline: 'AI', base: 'BOM', used: 45, max: 85 },
  { employeeId: 'C009', name: 'Asha Williams', email: 'asha.williams@airroster.com', role: 'cabin_crew', rank: 'Flight Attendant', type: 'cabin', airline: '6E', base: 'BLR', used: 33, max: 85 },
  { employeeId: 'C010', name: 'Dev Sharma', email: 'dev.sharma@airroster.com', role: 'cabin_crew', rank: 'Flight Attendant', type: 'cabin', airline: '6E', base: 'DEL', used: 60, max: 85 },
  { employeeId: 'C011', name: 'Priya George', email: 'priya.george@airroster.com', role: 'cabin_crew', rank: 'Flight Attendant', type: 'cabin', airline: 'AI', base: 'DEL', used: 22, max: 85 },
  { employeeId: 'C012', name: 'Sunita Das', email: 'sunita.das@airroster.com', role: 'cabin_crew', rank: 'Flight Attendant', type: 'cabin', airline: '6E', base: 'BOM', used: 50, max: 85 }
];

function initials(name: string) {
  return name.split(' ').map((part) => part[0]?.toUpperCase()).join('').slice(0, 3);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hhmm(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function haversine(from: string, to: string) {
  const a = airports.find((airport) => airport[0] === from);
  const b = airports.find((airport) => airport[0] === to);
  if (!a || !b) return 0;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b[4] - a[4]);
  const dLng = toRad(b[5] - a[5]);
  const lat1 = toRad(a[4]);
  const lat2 = toRad(b[4]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
}

const tx = db.transaction(() => {
  for (const table of ['crew_assignments', 'leave_requests', 'flight_routes', 'flights', 'crew', 'airlines', 'airports']) {
    db.prepare(`DELETE FROM ${table}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
  }

  const airportStmt = db.prepare('INSERT INTO airports (iata, name, city, country, lat, lng, timezone) VALUES (?, ?, ?, ?, ?, ?, ?)');
  airports.forEach((airport) => airportStmt.run(...airport));

  const airlineStmt = db.prepare('INSERT INTO airlines (iata_code, icao_code, name, country, hub_airport) VALUES (?, ?, ?, ?, ?)');
  airlines.forEach((airline) => airlineStmt.run(airline.iata, airline.icao, airline.name, airline.country, airline.hub));
  const airlineIds = Object.fromEntries(
    (db.prepare('SELECT id, iata_code FROM airlines').all() as Array<{ id: number; iata_code: string }>).map((airline) => [airline.iata_code, airline.id])
  );

  const crewStmt = db.prepare(`
    INSERT INTO crew (
      employee_id, full_name, initials, email, password_hash, role, rank, crew_type, airline_id,
      base_airport, monthly_hours_used, monthly_hours_max, leave_balance, phone, license_number,
      license_expiry, medical_expiry
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  crewSeeds.forEach((crew, index) => {
    const password = crew.password ?? 'crew123';
    crewStmt.run(
      crew.employeeId,
      crew.name,
      initials(crew.name),
      crew.email,
      bcrypt.hashSync(password, 10),
      crew.role,
      crew.rank,
      crew.type,
      airlineIds[crew.airline],
      crew.base,
      crew.used,
      crew.max,
      21 - (index % 8),
      `+91 98${String(10000000 + index).slice(0, 8)}`,
      `${crew.type === 'pilot' ? 'DGCA' : 'CAB'}-${crew.employeeId}`,
      isoDate(addDays(new Date(), 60 + index * 17)),
      isoDate(addDays(new Date(), 25 + index * 11))
    );
  });

  const flightStmt = db.prepare(`
    INSERT INTO flights (
      flight_number, airline_id, aircraft_type, aircraft_reg, total_seats,
      required_captains, required_fos, required_cabin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  flightSeeds.forEach((flight, index) => {
    flightStmt.run(flight[0], airlineIds[flight[1]], flight[4], flight[5], 180 + index * 6, flight[6], flight[7], flight[8]);
  });
  const flightRows = db.prepare('SELECT id, flight_number FROM flights ORDER BY id').all() as Array<{ id: number; flight_number: string }>;

  const routeStmt = db.prepare(`
    INSERT INTO flight_routes (
      flight_id, from_airport, to_airport, departure_date, departure_time, arrival_time,
      duration_mins, distance_km, cruising_alt, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date();
  const baseTimes = ['06:15', '08:20', '10:45', '13:10', '15:35', '17:40', '19:25', '21:10'];
  const routeIds: number[] = [];
  for (let day = 0; day < 7; day += 1) {
    const date = addDays(now, day);
    flightSeeds.forEach((flight, index) => {
      const flightRow = flightRows[index];
      const critical = day === 0 && index < 3;
      const departure = critical ? new Date(now.getTime() + (55 + index * 25) * 60_000) : new Date(`${isoDate(date)}T${baseTimes[index]}:00`);
      const mins = 115 + (index % 4) * 30;
      const arrival = new Date(departure.getTime() + mins * 60_000);
      const result = routeStmt.run(
        flightRow.id,
        flight[2],
        flight[3],
        isoDate(departure),
        hhmm(departure),
        hhmm(arrival),
        mins,
        haversine(flight[2], flight[3]),
        index % 2 === 0 ? 'FL350' : 'FL370',
        critical && index === 2 ? 'delayed' : 'scheduled'
      );
      routeIds.push(Number(result.lastInsertRowid));
    });
  }

  const crews = db.prepare('SELECT id, rank FROM crew WHERE role IN (?, ?) ORDER BY monthly_hours_used').all('pilot', 'cabin_crew') as Array<{ id: number; rank: string }>;
  const byRank = (rank: string) => crews.filter((crew) => crew.rank === rank).map((crew) => crew.id);
  const captains = byRank('Captain');
  const fos = byRank('First Officer');
  const pursers = byRank('Purser');
  const senior = byRank('Senior Flight Attendant');
  const fas = byRank('Flight Attendant');
  const assignStmt = db.prepare('INSERT OR IGNORE INTO crew_assignments (flight_route_id, crew_id, role_on_flight, assigned_by) VALUES (?, ?, ?, 1)');
  routeIds.forEach((routeId, index) => {
    if (index < 3) {
      assignStmt.run(routeId, captains[index % captains.length], 'Captain');
      return;
    }
    if (index % 10 === 0) return;
    assignStmt.run(routeId, captains[index % captains.length], 'Captain');
    if (index % 5 !== 0) assignStmt.run(routeId, fos[index % fos.length], 'First Officer');
    if (index % 4 !== 0) assignStmt.run(routeId, pursers[index % pursers.length], 'Purser');
    if (index % 3 !== 0) assignStmt.run(routeId, senior[index % senior.length], 'Senior Flight Attendant');
    if (index % 2 === 0) assignStmt.run(routeId, fas[index % fas.length], 'Flight Attendant');
    if (index % 6 === 0) assignStmt.run(routeId, fas[(index + 1) % fas.length], 'Flight Attendant');
  });

  const leaveStmt = db.prepare('INSERT INTO leave_requests (crew_id, from_date, to_date, leave_type, status, note, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const leaveCrew = db.prepare('SELECT id FROM crew WHERE email = ?').pluck();
  leaveStmt.run(leaveCrew.get('amit.patel@airroster.com'), isoDate(addDays(now, 1)), isoDate(addDays(now, 3)), 'annual', 'pending', 'Family travel', null, null);
  leaveStmt.run(leaveCrew.get('suresh.pillai@airroster.com'), isoDate(addDays(now, 2)), isoDate(addDays(now, 2)), 'training', 'approved', 'Simulator recurrency', 1, new Date().toISOString());
  leaveStmt.run(leaveCrew.get('nina.joshi@airroster.com'), isoDate(addDays(now, -2)), isoDate(addDays(now, -1)), 'sick', 'approved', 'Medical recovery', 1, new Date().toISOString());
  leaveStmt.run(leaveCrew.get('aakash.joshi@airroster.com'), isoDate(addDays(now, 5)), isoDate(addDays(now, 6)), 'emergency', 'rejected', 'Operational coverage required', 2, new Date().toISOString());
  leaveStmt.run(leaveCrew.get('priya.george@airroster.com'), isoDate(addDays(now, 4)), isoDate(addDays(now, 4)), 'annual', 'pending', 'Personal day', null, null);
});

tx();

console.log('AirRoster seed complete: 10 airports, 2 airlines, 22 crew, 8 flights, 56 routes.');
