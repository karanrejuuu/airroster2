export function DutyBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const tone = pct >= 95 ? 'danger' : pct >= 80 ? 'warn' : 'ok';
  return (
    <div className="duty">
      <div className="duty-track">
        <div className={`duty-fill duty-${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span>{used} / {max} hrs</span>
    </div>
  );
}
