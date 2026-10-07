import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerService } from '@/services/providerService';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/context/AuthContext';

const PROVIDER_LINKS = [
  { label: 'Overview', path: '/provider/dashboard' },
  { label: 'Notifications', path: '/provider/notifications' },
  { label: 'Verification', path: '/provider/verification' },
  { label: 'Messages', path: '/messages' },
  { label: 'My Services', path: '/provider/services' },
  { label: 'Bookings', path: '/provider/bookings' },
  { label: 'Job Requests', path: '/provider/job-requests' },
  { label: 'Earnings', path: '/provider/earnings' },
  { label: 'Reviews', path: '/provider/reviews' },
  { label: 'Support', path: '/provider/support' },
  { label: 'Profile', path: '/provider/profile' },
];

export default function ProviderLayout({ children, title }) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

useEffect(() => {
  providerService.getMyProfile().catch((err) => {
    if (err?.response?.status === 404) {
      navigate('/provider/onboarding');
    }
  });
}, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-extrabold text-white">
              S
            </span>
            <span className="font-display text-xl font-extrabold text-secondary">ServiGo Pro</span>
          </Link>
                    <div className="flex items-center gap-4">
            <Link to="/" className="hidden text-sm font-medium text-text-muted hover:text-secondary sm:block">
              ← Back to site
            </Link>
            <NotificationBell viewAllPath="/provider/notifications" />
            <span className="hidden text-sm text-text-muted sm:block">
              Hi, {user?.firstName || 'there'}
            </span>
            <button onClick={logout} className="text-sm font-semibold text-danger hover:text-red-600">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8 lg:px-8">
        <Sidebar links={PROVIDER_LINKS} />
        <main className="min-w-0 flex-1">
          <h1 className="mb-6 font-display text-2xl font-extrabold text-secondary">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}