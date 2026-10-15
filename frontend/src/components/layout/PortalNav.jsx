import { NavLink } from 'react-router-dom';

// Pieces shared by the customer and provider portal layouts.

export function Avatar({ src, name, size = 'h-9 w-9' }) {
  if (src) {
    return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-primary-light text-sm font-semibold text-primary`}>
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * One entry in a portal's left rail (or, with `compact`, in the scrollable
 * strip that replaces the rail below lg).
 *
 * @param {{ link: { label: string, path: string, icon: React.ComponentType }, showDot?: boolean, compact?: boolean }} props
 */
export function PortalNavLink({ link, showDot = false, compact = false }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.path}
      end
      className={({ isActive }) =>
        compact
          ? `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              isActive ? 'bg-secondary text-white' : 'bg-surface text-secondary'
            }`
          : `relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-colors ${
              isActive
                ? 'bg-surface-warm font-semibold text-secondary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-secondary'
                : 'text-text hover:bg-surface-warm/60'
            }`
      }
    >
      <Icon className="shrink-0 text-[17px]" />
      {link.label}
      {showDot && <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-label="Unread" />}
    </NavLink>
  );
}
