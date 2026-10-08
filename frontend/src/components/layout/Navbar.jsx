import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaUserCircle, FaChevronDown } from 'react-icons/fa';
import { NAV_LINKS, APP_NAME } from '@/utils/constants';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-soft' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
            S
          </span>
          <span className="font-body text-xl font-bold tracking-tight text-secondary">
            {APP_NAME}
          </span>
        </Link>

        {/* The active link gets an underline rather than a pill — it sits
            better under the editorial type and keeps the bar quiet. */}
        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.path.split('#')[0]) &&
                  link.path.split('#')[0] !== '/';

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-1 text-sm transition-colors ${
                  isActive
                    ? 'font-semibold text-secondary'
                    : 'font-medium text-text-muted hover:text-secondary'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-secondary" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/provider/onboarding"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            Become a Pro
          </Link>
          {isAuthenticated ? (
            <>
              {/* Logged-in visitors spend most of their time on these public
                  pages, so the bell lives here too — otherwise the unread
                  badge only existed inside the dashboard layouts. */}
              <NotificationBell />
              <button
                onClick={() => {
                  if (user?.role === 'provider') navigate('/provider/dashboard');
                  else if (user?.role === 'admin') navigate('/admin/dashboard');
                  else navigate('/customer/dashboard');
                }}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-warm"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="h-9 w-9 text-text-muted" />
                )}
                <span className="text-sm font-medium text-secondary">
                  Hi, {user?.firstName || 'there'}
                </span>
                <FaChevronDown className="text-[10px] text-text-muted" />
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                Sign up
              </Button>
            </>
          )}
        </div>

        {/* On phones the bell sits beside the menu toggle, so the unread
            badge stays visible without opening the menu. */}
        <div className="flex items-center gap-1 lg:hidden">
          {isAuthenticated && <NotificationBell />}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden border-t border-border bg-surface lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/provider/onboarding"
                className="rounded-xl px-4 py-3 text-sm font-medium text-secondary hover:bg-slate-100"
              >
                Become a Pro
              </Link>
              <div className="mt-2 flex gap-3 border-t border-border pt-4">
                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      if (user?.role === 'provider') navigate('/provider/dashboard');
                      else if (user?.role === 'admin') navigate('/admin/dashboard');
                      else navigate('/customer/dashboard');
                    }}
                  >
                    Account
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" fullWidth onClick={() => navigate('/login')}>
                      Log in
                    </Button>
                    <Button variant="primary" fullWidth onClick={() => navigate('/register')}>
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
