import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import NotificationItem from '@/components/notifications/NotificationItem';

const PREVIEW_COUNT = 6;

/**
 * Header bell with a live unread badge and a short preview dropdown.
 *
 * @param {{ viewAllPath: string }} props `viewAllPath` differs per portal
 *   (/customer/notifications, /provider/notifications, ...).
 */
export default function NotificationBell({ viewAllPath }) {
  const { notifications, unreadCount, lastArrivalId, markAsRead, markAllAsRead } =
    useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // When rendered outside a role layout (the public navbar), send the user to
  // their own portal's notifications page rather than a hard-coded one.
  const resolvedViewAllPath =
    viewAllPath ||
    (user?.role === 'provider'
      ? '/provider/notifications'
      : user?.role === 'admin'
        ? '/admin/notifications'
        : '/customer/notifications');

  // Close on an outside click or Escape — standard dropdown behaviour, and
  // both listeners are torn down with the effect.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={isOpen}
        className="relative grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-slate-100 hover:text-secondary"
      >
        {/* Keyed on the newest arrival so the swing replays once per
            notification. prefers-reduced-motion is honoured globally in
            index.css, which neutralises the transition there. */}
        <motion.span
          key={lastArrivalId || 'idle'}
          animate={lastArrivalId ? { rotate: [0, -14, 12, -8, 6, 0] } : undefined}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="grid place-items-center"
        >
          <FaBell size={16} />
        </motion.span>

        {unreadCount > 0 && (
          <motion.span
            key={`badge-${unreadCount}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[18px] text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-sm font-bold text-secondary">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {preview.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-text-muted">
                  You're all caught up.
                </p>
              ) : (
                preview.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onRead={markAsRead}
                    onNavigate={() => setIsOpen(false)}
                    compact
                  />
                ))
              )}
            </div>

            <Link
              to={resolvedViewAllPath}
              onClick={() => setIsOpen(false)}
              className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-slate-50"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
