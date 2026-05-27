import { AlertTriangle, Check, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  const icon = {
    success: <Check size={16} strokeWidth={1.5} />,
    error: <X size={16} strokeWidth={1.5} />,
    warning: <AlertTriangle size={16} strokeWidth={1.5} />
  };
  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.kind}`} key={toast.id}>
          <span>{icon[toast.kind]}</span>
          <p>{toast.message}</p>
          {toast.undo && <button onClick={() => { toast.undo?.(); dismiss(toast.id); }}>Undo</button>}
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
}
