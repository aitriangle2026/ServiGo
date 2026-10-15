import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiCalendar,
  FiClipboard,
  FiTool,
  FiDollarSign,
  FiStar,
  FiUser,
  FiMessageSquare,
  FiBell,
  FiShield,
  FiHelpCircle,
  FiLogOut,
  FiChevronDown,
  FiHeadphones,
} from 'react-icons/fi';
import { providerService } from '@/services/providerService';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Avatar, PortalNavLink } from '@/components/layout/PortalNav';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { APP_NAME } from '@/utils/constants';

// Every section the provider portal had before the redesign is still here —
// Verification and Support included, which the mockup's rail leaves out.
const PROVIDER_LINKS = [
  { label: 'Dashboard', path: '/provider/dashboard', icon: FiHome },
  { label: 'My Bookings', path: '/provider/bookings', icon: FiCalendar },
  { label: 'Service Requests', path: '/provider/job-requests', icon: FiClipboard },
  { label: 'My Services', path: '/provider/services', icon: FiTool },
  { label: 'Earnings', path: '/provider/earnings', icon: FiDollarSign },
  { label: 'Reviews', path: '/provider/reviews', icon: FiStar },
  { label: 'Profile', path: '/provider/profile', icon: FiUser },
  { label: 'Verification', path: '/provider/verification', icon: FiShield },
  { label: 'Messages', path: '/messages', icon: FiMessageSquare, dot: 'messages' },
  { label: 'Notifications', path: '/provider/notifications', icon: FiBell, dot: 'notifications' },
  { label: 'Help & Support', path: '/provider/support', icon: FiHelpCircle },
];

function UserMenu({ user, photo, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-warm"
      >
        <Avatar src={photo} name={user?.firstName} size="h-10 w-10" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-secondary">{name || 'Provider'}</span>
          <span className="block text-xs text-text-muted">Provider</span>
        </span>
        <FiChevronDown className="text-sm text-text-muted" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-soft-lg">
            <Link
              to="/provider/profile"
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
 * Shell for every provider page.
 *
 * @param {{ children: React.ReactNode, title?: string }} props — without a
 *   title the page renders its own heading (the dashboard does).
 */
export default function ProviderLayout({ children, title }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);

  // A provider without a profile yet belongs on onboarding. The same call
  // supplies the avatar, which lives on the provider profile, not the user.
  useEffect(() => {
    let cancelled = false;
    providerService
      .getMyProfile()
      .then((response) => {
        if (!cancelled) setPhoto(response?.data?.profileImage || null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) navigate('/provider/onboarding');
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const dots = {
    notifications: unreadCount > 0,
    messages: notifications.some((n) => n.type === 'new_message' && !n.isRead),
  };

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

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell viewAllPath="/provider/notifications" />
            <UserMenu user={user} photo={photo} onLogout={logout} />
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2.5 lg:hidden">
          {PROVIDER_LINKS.map((link) => (
            <PortalNavLink key={link.path} link={link} showDot={Boolean(link.dot && dots[link.dot])} compact />
          ))}
        </nav>
      </header>

      <div className="flex">
        <aside className="sticky top-[69px] hidden h-[calc(100vh-69px)] w-60 shrink-0 flex-col overflow-y-auto border-r border-border px-4 py-6 lg:flex">
          <nav className="space-y-1">
            {PROVIDER_LINKS.map((link) => (
              <PortalNavLink key={link.path} link={link} showDot={Boolean(link.dot && dots[link.dot])} />
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div className="rounded-2xl bg-surface-warm p-4">
              <FiHeadphones className="text-2xl text-secondary" />
              <p className="mt-3 text-sm font-medium text-secondary">Need Help?</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">Our support team is here for you.</p>
              <Link
                to="/provider/support"
                className="mt-3 block rounded-xl bg-secondary px-4 py-2.5 text-center text-[13px] font-medium text-white hover:bg-primary"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm text-text transition-colors hover:bg-danger-light hover:text-danger"
            >
              <FiLogOut className="text-[17px]" /> Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-8">
          {title && <h1 className="mb-6 font-display text-3xl font-medium text-secondary">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
