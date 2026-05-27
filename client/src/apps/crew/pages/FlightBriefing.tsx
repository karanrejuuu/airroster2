import { useQuery } from '@tanstack/react-query';
import L, { type LatLngExpression } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { api } from '../../../lib/api';
import { routeDateTime, todayIso } from '../../../lib/dateUtils';
import type { Assignment, FlightRoute } from '../../../types';

function airportIcon(label: string) {
  return L.divIcon({ className: 'airport-label', html: `<strong>${label}</strong>`, iconSize: [80, 18], iconAnchor: [40, -4] });
}

const planeIcon = L.divIcon({
  className: 'airport-label',
  html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21 16.2 13.4 12 21 7.8V5.5L10.4 9.2 4 5.5v2l4.6 4.5L4 16.5v2l6.4-3.7L21 18.5z"/></svg>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
  }, [map, points]);
  return null;
}

function arcPoints(from: [number, number], to: [number, number]) {
  return Array.from({ length: 36 }, (_, index) => {
    const t = index / 35;
    const lat = from[0] + (to[0] - from[0]) * t + Math.sin(Math.PI * t) * 3;
    const lng = from[1] + (to[1] - from[1]) * t;
    return [lat, lng] as [number, number];
  });
}

function Countdown({ departure }: { departure: Date }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const mins = Math.max(0, Math.floor((departure.getTime() - now) / 60_000));
  return <span>{Math.floor(mins / 60)}h {mins % 60}m</span>;
}

function WeatherIcon({ type }: { type: string }) {
  if (type === 'rain') return <svg width="28" height="28" viewBox="0 0 28 28"><path d="M6 16c2-5 14-5 16 0" fill="none" stroke="white" /><path d="M10 19v5M14 19v5M18 19v5" stroke="white" /></svg>;
  if (type === 'storm') return <svg width="28" height="28" viewBox="0 0 28 28"><path d="M6 15c2-5 14-5 16 0" fill="none" stroke="white" /><path d="m14 17-3 6 5-2-2 5 5-8z" fill="white" /></svg>;
  if (type === 'fog') return <svg width="28" height="28" viewBox="0 0 28 28"><path d="M5 9c4 2 6-2 10 0s6-2 8 0M5 14c4 2 6-2 10 0s6-2 8 0M5 19c4 2 6-2 10 0s6-2 8 0" fill="none" stroke="white" /></svg>;
  if (type === 'cloud') return <svg width="28" height="28" viewBox="0 0 28 28"><path d="M7 17c1-5 5-7 9-4 4-1 7 1 7 4" fill="none" stroke="white" /><circle cx="10" cy="10" r="4" fill="none" stroke="white" /></svg>;
  return <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="4" fill="none" stroke="white" /><path d="M14 2v5M14 21v5M2 14h5M21 14h5M5 5l4 4M19 19l4 4M23 5l-4 4M9 19l-4 4" stroke="white" /></svg>;
}

function WeatherCard({ airport, city, variant }: { airport: string; city?: string; variant: 'dep' | 'arr' }) {
  const type = variant === 'dep' ? 'clear' : 'cloud';
  return (
    <article className="card weather-card">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}><div><h3>{city}</h3><p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{airport}</p></div><WeatherIcon type={type} /></div>
      <strong>{variant === 'dep' ? '31' : '28'}°C</strong>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{variant === 'dep' ? 'Clear' : 'Partly cloudy'} · Wind {variant === 'dep' ? '12 kt NNE' : '8 kt W'}</p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 8 }}>Visibility 10+ km · QNH 1013 hPa</p>
    </article>
  );
}

export function FlightBriefing() {
  const { routeId } = useParams();
  const assignments = useQuery({ queryKey: ['briefingMine'], enabled: !routeId, queryFn: () => api<Array<FlightRoute & { role_on_flight: string }>>(`/api/assignments?from=${todayIso()}&to=${todayIso()}`) });
  const resolvedId = routeId ?? assignments.data?.[0]?.id;
  const route = useQuery({ queryKey: ['route', resolvedId], enabled: Boolean(resolvedId), queryFn: () => api<FlightRoute>(`/api/routes/${resolvedId}`) });
  const data = route.data;
  const points = useMemo(() => {
    if (!data?.from_lat || !data.to_lat || !data.from_lng || !data.to_lng) return null;
    return arcPoints([data.from_lat, data.from_lng], [data.to_lat, data.to_lng]);
  }, [data]);

  if (!resolvedId && assignments.isSuccess) return <div className="screen-center">No assigned flight today. <Link to="/crew/roster">View roster</Link></div>;
  if (!data || !points) return <div className="screen-center">Loading flight briefing...</div>;

  const departure = routeDateTime(data.departure_date, data.departure_time);
  const end = new Date(departure.getTime() + data.duration_mins * 60_000);
  const midpoint = points[Math.floor(points.length / 2)];
  const pilots = data.assignments.filter((crew) => crew.crew_type === 'pilot');
  const cabin = data.assignments.filter((crew) => crew.crew_type === 'cabin');
  const restBefore = 12;

  return (
    <>
      <section className="brief-hero">
        <div><div className="overline">FLIGHT</div><h1>{data.flight_number}</h1><p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{data.from_name} ({data.from_airport}) {'->'} {data.to_name} ({data.to_airport})</p><p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 10 }}>{data.departure_date} · {data.aircraft_type} · {data.aircraft_reg}</p></div>
        <div><div className="overline">Departure in</div><h2 style={{ fontSize: 32, fontWeight: 300, marginTop: 12 }}><Countdown departure={departure} /></h2></div>
      </section>
      <section className="brief-section">
        <div className="overline">Flight info</div>
        <div className="detail-grid">
          {[
            ['Departure local', data.departure_time],
            ['Departure UTC', data.departure_time],
            ['Arrival local', data.arrival_time],
            ['Arrival UTC', data.arrival_time],
            ['Duration', `${data.duration_mins} mins`],
            ['Aircraft type', data.aircraft_type],
            ['Registration', data.aircraft_reg],
            ['Cruising altitude', data.cruising_alt],
            ['Distance', `${data.distance_km} km`],
            ['Flight number', data.flight_number]
          ].map(([key, value]) => <div className="kv" key={key}><small>{key}</small><strong>{value}</strong></div>)}
        </div>
      </section>
      <section className="brief-section">
        <div className="overline" style={{ marginBottom: 14 }}>Route map</div>
        <div className="map-box">
          <MapContainer center={midpoint} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <FitBounds points={[[data.from_lat!, data.from_lng!], [data.to_lat!, data.to_lng!]]} />
            <CircleMarker center={[data.from_lat!, data.from_lng!]} radius={4} pathOptions={{ color: 'white', fillColor: 'white', fillOpacity: 1 }} />
            <CircleMarker center={[data.to_lat!, data.to_lng!]} radius={4} pathOptions={{ color: 'white', fillColor: 'white', fillOpacity: 1 }} />
            <Marker position={[data.from_lat!, data.from_lng!]} icon={airportIcon(`${data.from_airport} ${data.from_city}`)} />
            <Marker position={[data.to_lat!, data.to_lng!]} icon={airportIcon(`${data.to_airport} ${data.to_city}`)} />
            <Polyline positions={points} pathOptions={{ color: 'white', weight: 1.5, opacity: 0.7, dashArray: '6 4' }} />
            <Marker position={midpoint} icon={planeIcon} />
          </MapContainer>
        </div>
      </section>
      <section className="brief-section"><div className="overline" style={{ marginBottom: 14 }}>Weather</div><div className="weather-grid"><WeatherCard airport={data.from_airport} city={data.from_city} variant="dep" /><WeatherCard airport={data.to_airport} city={data.to_city} variant="arr" /></div></section>
      <section className="brief-section"><div className="overline" style={{ marginBottom: 14 }}>Crew on this flight</div><CrewGroup title="Pilots" crew={pilots} /><CrewGroup title="Cabin crew" crew={cabin} /></section>
      <section className="brief-section"><div className="overline">Duty & rest</div><div className="detail-grid"><div className="kv"><small>Report time</small><strong>{data.departure_time}</strong></div><div className="kv"><small>End of duty</small><strong>{end.toTimeString().slice(0, 5)}</strong></div><div className="kv"><small>Total FDP</small><strong>{(data.duration_mins / 60).toFixed(1)} hrs</strong></div><div className="kv"><small>Rest before this flight</small><strong>{restBefore} hrs</strong> {restBefore < 10 && <Badge tone="warn">Below DGCA minimum (10h)</Badge>}</div></div></section>
    </>
  );
}

function CrewGroup({ title, crew }: { title: string; crew: Assignment[] }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 className="overline" style={{ marginBottom: 8 }}>{title}</h3>
      <div className="crew-chips">{crew.map((member) => <div className="crew-chip" key={member.id}><Avatar initials={member.initials} size={32} /><span><strong style={{ display: 'block', fontSize: 13 }}>{member.full_name}</strong><small style={{ color: 'var(--text-tertiary)' }}>{member.rank}</small></span></div>)}</div>
    </div>
  );
}
