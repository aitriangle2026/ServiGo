import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Avatar, PortalNavLink } from '@/components/layout/PortalNav';
import {
  FiHome,
  FiCalendar,
  FiClipboard,
  FiHeart,
  FiMessageSquare,
  FiBell,
  FiUser,
  FiHelpCircle,
  FiChevronDown,
  FiArrowRight,
  FiLogOut,
} from 'react-icons/fi';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NAV_LINKS, APP_NAME } from '@/utils/constants';
import promoImage from '/images/dashboard-promo.webp';

// Customers have no support channel of their own yet (support chat is
// provider-only on the backend), so Help & Support points at the How It
// Works page rather than a dead end.
const CUSTOMER_LINKS = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: FiHome },
  { label: 'My Bookings', path: '/customer/bookings', icon: FiCalendar },
  { label: 'Job Requests', path: '/customer/job-requests', icon: FiClipboard },
  { label: 'Favorites', path: '/customer/favorites', icon: FiHeart },
  { label: 'Messages', path: '/messages', icon: FiMessageSquare },
  { label: 'Notifications', path: '/customer/notifications', icon: FiBell, showUnreadDot: true },
  { label: 'Profile', path: '/customer/profile', icon: FiUser },
  { label: 'Help & Support', path: '/how-it-works', icon: FiHelpCircle },
];

function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-warm"
      >
        <Avatar src={user?.profileImage} name={user?.firstName} />
        <span className="hidden text-sm font-medium text-secondary sm:block">
          Hi, {user?.firstName || 'there'}
        </span>
        <FiChevronDown className="text-sm text-text-muted" />
      </button>

      {isOpen && (
        <>
          {/* Click-away layer, same pattern as the homepage city picker. */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-soft-lg">
            <Link
              to="/customer/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-surface-warm"
            >
              <FiUser /> Profile
            </Link>
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-surface-warm"
            >
              <FiHome /> Back to site
            </Link>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-danger hover:bg-danger-light"
            >
              <FiLogOut /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Shell for every customer page: public-style top bar, a left rail with the
 * customer's sections, and the page content.
 *
 * @param {{ children: React.ReactNode, title?: string, fullBleed?: boolean }} props
 *   `fullBleed` drops the content padding and page title so a page (the
 *   dashboard) can run its own hero edge to edge.
 */
export default function DashboardLayout({ children, title, fullBleed = false }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const hasUnread = unreadCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg font-bold text-white">
              S
            </span>
            <span className="font-display text-xl font-semibold text-secondary">{APP_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                className="text-sm text-text-muted transition-colors hover:text-secondary"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="hidden rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-secondary transition-colors hover:border-primary hover:text-primary md:block"
            >
              Book a Service
            </button>
            <NotificationBell viewAllPath="/customer/notifications" />
            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>

        {/* Below lg the rail is hidden, so its links ride along under the
            header as a scrollable strip — otherwise a phone has no way
            between customer pages at all. */}
        <nav className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2.5 lg:hidden">
          {CUSTOMER_LINKS.map((link) => (
            <PortalNavLink key={link.path} link={link} showDot={link.showUnreadDot && hasUnread} compact />
          ))}
        </nav>
      </header>

      <div className="flex">
        <aside className="sticky top-[69px] hidden h-[calc(100vh-69px)] w-60 shrink-0 flex-col overflow-y-auto border-r border-border px-4 py-7 lg:flex">
          <nav className="space-y-1">
            {CUSTOMER_LINKS.map((link) => (
              <PortalNavLink key={link.path} link={link} showDot={link.showUnreadDot && hasUnread} />
            ))}
          </nav>

          {/* Image and scrim share one box (see README page conventions). */}
          <div className="relative mt-auto min-h-[380px] overflow-hidden rounded-2xl pt-8">
            <img
              src={promoImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-secondary/45 to-secondary/90" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-display text-[1.7rem] leading-[1.1] text-white">
                A better way to get things <em className="italic">done.</em>
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/80">
                Trusted professionals for your home and everyday needs.
              </p>
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm font-medium text-secondary transition-colors hover:bg-surface-warm"
              >
                Book a Service <FiArrowRight />
              </button>
            </div>
          </div>
        </aside>

        <main className={`min-w-0 flex-1 ${fullBleed ? '' : 'px-4 py-8 sm:px-6 lg:px-10'}`}>
          {!fullBleed && title && (
            <h1 className="mb-6 font-display text-3xl font-medium text-secondary">{title}</h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
