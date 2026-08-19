import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';

const CUSTOMER_LINKS = [
  { label: 'Overview', path: '/customer/dashboard' },
  { label: 'My Bookings', path: '/customer/bookings' },
  { label: 'Favorites', path: '/customer/favorites' },
  { label: 'Profile', path: '/customer/profile' },
];

/**
 * @param {{ children: React.ReactNode, title: string }} props
 */
export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                    <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-extrabold text-white">
              S
            </span>
            <span className="font-display text-xl font-extrabold text-secondary">ServiGo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="hidden text-sm font-medium text-text-muted hover:text-secondary sm:block">
              ← Back to site
            </Link>
            <span className="hidden text-sm text-text-muted sm:block">
              Hi, {user?.firstName || 'there'}
            </span>
            <button
              onClick={logout}
              className="text-sm font-semibold text-danger hover:text-red-600"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8 lg:px-8">
        <Sidebar links={CUSTOMER_LINKS} />
        <main className="min-w-0 flex-1">
          <h1 className="mb-6 font-display text-2xl font-extrabold text-secondary">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}