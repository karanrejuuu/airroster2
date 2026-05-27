import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from './Avatar';

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  hidden?: boolean;
};

export function Sidebar({ mode, nav, footer }: { mode: 'OPS' | 'CREW PORTAL'; nav: NavItem[]; footer?: { initials: string; name: string; sub: string; actions?: ReactNode } }) {
  return (
    <aside className="sidebar">
      <div className="wordmark">
        <span>AirRoster</span>
        <small>{mode}</small>
      </div>
      <nav>
        {nav.filter((item) => !item.hidden).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {footer && (
        <div className="sidebar-footer">
          <Avatar initials={footer.initials} />
          <div>
            <strong>{footer.name}</strong>
            <small>{footer.sub}</small>
          </div>
          {footer.actions}
        </div>
      )}
    </aside>
  );
}
