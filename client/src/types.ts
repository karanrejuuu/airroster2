export type UserRole = 'admin' | 'dispatcher' | 'pilot' | 'cabin_crew';
export type CrewRank = 'Captain' | 'First Officer' | 'Purser' | 'Senior Flight Attendant' | 'Flight Attendant';
export type CrewType = 'pilot' | 'cabin';
export type RouteStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'delayed';

export type User = {
  id: number;
  email: string;
  role: UserRole;
};

export type Airline = {
  id: number;
  iata_code: string;
  icao_code: string;
  name: string;
  country: string;
  hub_airport: string;
  status: 'active' | 'inactive';
  active_flight_count?: number;
  active_crew_count?: number;
};

export type CrewMember = {
  id: number;
  employee_id: string;
  full_name: string;
  initials: string;
  email: string;
  role: UserRole;
  rank: CrewRank;
  crew_type: CrewType;
  airline_id: number;
  airline_name?: string;
  airline_iata?: string;
  base_airport: string;
  monthly_hours_used: number;
  monthly_hours_max: number;
  leave_balance: number;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  medical_expiry?: string;
  status: 'active' | 'inactive' | 'suspended';
};

export type Flight = {
  id: number;
  flight_number: string;
  airline_id: number;
  airline_name?: string;
  airline_iata?: string;
  aircraft_type: string;
  aircraft_reg: string;
  total_seats?: number;
  required_captains: number;
  required_fos: number;
  required_cabin: number;
  status: 'active' | 'inactive';
};

export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
};

export type Assignment = CrewMember & {
  assignment_id: number;
  flight_route_id: number;
  role_on_flight: CrewRank;
};

export type FlightRoute = {
  id: number;
  flight_id: number;
  from_airport: string;
  to_airport: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  duration_mins: number;
  distance_km: number;
  cruising_alt: string;
  status: RouteStatus;
  flight_number: string;
  aircraft_type: string;
  aircraft_reg: string;
  required_captains: number;
  required_fos: number;
  required_cabin: number;
  airline_name: string;
  airline_iata: string;
  from_name?: string;
  from_city?: string;
  from_lat?: number;
  from_lng?: number;
  to_name?: string;
  to_city?: string;
  to_lat?: number;
  to_lng?: number;
  assignments: Assignment[];
};

export type LeaveRequest = {
  id: number;
  crew_id: number;
  full_name?: string;
  rank?: CrewRank;
  crew_type?: CrewType;
  from_date: string;
  to_date: string;
  leave_type: 'annual' | 'sick' | 'training' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
};
