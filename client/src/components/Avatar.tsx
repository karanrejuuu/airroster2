export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}>
      {initials}
    </span>
  );
}
