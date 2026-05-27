import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';

export function Drawer({ title, open, width = 480, onClose, children }: { title: string; open: boolean; width?: number; onClose: () => void; children: ReactNode }) {
  useKeyboard({ Escape: onClose }, open);
  if (!open) return null;
  return (
    <div className="drawer-layer">
      <button className="drawer-overlay" aria-label="Close drawer overlay" onClick={onClose} />
      <aside className="drawer" style={{ width }}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close drawer"><X size={16} strokeWidth={1.5} /></button>
        </header>
        {children}
      </aside>
    </div>
  );
}
