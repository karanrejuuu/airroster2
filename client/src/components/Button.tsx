import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: ReactNode;
  loading?: boolean;
};

export function Button({ variant = 'ghost', icon, loading, children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" /> : icon}
      {children}
    </button>
  );
}
