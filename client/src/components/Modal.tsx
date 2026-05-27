import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  useKeyboard({ Escape: onClose }, open);
  if (!open) return null;
  return (
    <div className="modal-layer">
      <button className="modal-overlay" aria-label="Close modal overlay" onClick={onClose} />
      <section className="modal">
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal"><X size={16} strokeWidth={1.5} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
