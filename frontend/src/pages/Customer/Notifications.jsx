import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCheck,
  FiSettings,
  FiFilter,
  FiInbox,
  FiBell,
  FiCalendar,
  FiMessageSquare,
  FiCreditCard,
  FiStar,
  FiHelpCircle,
  FiArrowRight,
  FiX,
  FiShield,
} from 'react-icons/fi';
import CustomerLayout from '@/layouts/CustomerLayout';
import EmptyState from '@/components/common/EmptyState';
import Spinner from '@/components/common/Spinner';
import { useNotifications } from '@/context/NotificationContext';
import { notificationService } from '@/services/notificationService';
import { getNotificationMeta } from '@/utils/notificationMeta';

// The categories a customer can mute (PREFERENCE_CATEGORIES on the server).
// Account, verification and system notices always get through.
const SETTINGS = [
  { key: 'booking', label: 'Booking Updates', description: 'Requests, confirmations, changes and arrivals' },
  { key: 'message', label: 'Messages', description: 'New chat messages from professionals' },
  { key: 'payment', label: 'Payments', description: 'Invoices, payments and refunds' },
  { key: 'review', label: 'Reviews', description: 'Review reminders after a completed job' },
];

const KNOWN_CATEGORIES = ['booking', 'message', 'payment', 'review'];

const FILTERS = [
  { key: 'all', label: 'All Notifications', icon: FiInbox, match: () => true },
  { key: 'unread', label: 'Unread', icon: FiBell, match: (n) => !n.isRead },
  { key: 'booking', label: 'Bookings', icon: FiCalendar, match: (n) => n.category === 'booking' },
  { key: 'message', label: 'Messages', icon: FiMessageSquare, match: (n) => n.category === 'message' },
  { key: 'payment', label: 'Payments', icon: FiCreditCard, match: (n) => n.category === 'payment' },
  { key: 'review', label: 'Reviews', icon: FiStar, match: (n) => n.category === 'review' },
  {
    key: 'system',
    label: 'System Updates',
    icon: FiShield,
    match: (n) => !KNOWN_CATEGORIES.includes(n.category),
  },
];

// Solid icon discs, as in the design. Written out in full for Tailwind.
const SOLID_TONES = {
  primary: 'bg-primary text-white',
  success: 'bg-success text-white',
  danger: 'bg-danger text-white',
  accent: 'bg-accent text-white',
  neutral: 'bg-surface-warm text-secondary',
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function groupOf(createdAt) {
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(createdAt));
  const diff = Math.round((today - day) / 86400000);
  return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : 'Earlier';
}

function timeLabel(createdAt, group) {
  const date = new Date(createdAt);
  return group === 'Today'
    ? date.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-secondary' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow-soft transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function NotificationRow({ notification, group, onOpen, onRemove }) {
  const { icon: Icon, tone } = getNotificationMeta(notification.type);
  const clickable = Boolean(notification.link) || !notification.isRead;

  return (
    <li className="group relative">
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => onOpen(notification) : undefined}
        onKeyDown={
          clickable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(notification);
                }
              }
            : undefined
        }
        className={`flex gap-4 px-4 py-4 transition-colors sm:px-5 ${
          notification.isRead ? 'bg-surface' : 'bg-surface-warm/70'
        } ${clickable ? 'cursor-pointer hover:bg-surface-warm' : ''}`}
      >
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${SOLID_TONES[tone]}`}>
          <Icon size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={`text-[15px] text-secondary ${notification.isRead ? 'font-medium' : 'font-semibold'}`}>
              {notification.title}
            </p>
            <span className="flex shrink-0 items-center gap-2.5 pt-0.5 text-xs text-text-muted">
              {timeLabel(notification.createdAt, group)}
              {!notification.isRead && <span className="h-2 w-2 rounded-full bg-danger" aria-label="Unread" />}
            </span>
          </div>
          <p className="mt-1 pr-8 text-[13.5px] leading-relaxed text-text-muted">{notification.message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(notification._id)}
        aria-label="Delete notification"
        title="Delete"
        className="absolute bottom-3 right-4 grid h-7 w-7 place-items-center rounded-full text-text-muted opacity-0 transition-opacity hover:bg-surface hover:text-danger focus:opacity-100 group-hover:opacity-100"
      >
        <FiX size={14} />
      </button>
    </li>
  );
}

export default function CustomerNotifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, hasMore, error, loadMore, markAsRead, markAllAsRead, remove } =
    useNotifications();

  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  // Server-side totals per category, refreshed whenever the live list moves
  // (a new arrival, a read, a delete).
  const listSignature = `${notifications.length}:${unreadCount}:${notifications[0]?._id || ''}`;
  useEffect(() => {
    let cancelled = false;
    notificationService
      .getSummary()
      .then((response) => {
        if (!cancelled) setSummary(response?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listSignature]);

  useEffect(() => {
    let cancelled = false;
    notificationService
      .getPreferences()
      .then((response) => {
        if (!cancelled) setPreferences(response?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const categories = summary?.categories || {};
    const known = KNOWN_CATEGORIES.reduce((sum, key) => sum + (categories[key]?.total || 0), 0);
    return {
      all: summary?.total ?? notifications.length,
      unread: summary?.unread ?? unreadCount,
      booking: categories.booking?.total || 0,
      message: categories.message?.total || 0,
      payment: categories.payment?.total || 0,
      review: categories.review?.total || 0,
      system: Math.max(0, (summary?.total || 0) - known),
    };
  }, [summary, notifications.length, unreadCount]);

  const activeFilter = FILTERS.find((f) => f.key === filter);
  const visible = notifications.filter(activeFilter.match);

  // Today / Yesterday / Earlier — the list is newest-first, so each group is
  // one contiguous run.
  const groups = [];
  visible.forEach((n) => {
    const label = groupOf(n.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  });

  const handleOpen = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const handleToggle = async (key, value) => {
    const previous = preferences;
    setPreferences((current) => ({ ...current, [key]: value }));
    setSavingKey(key);
    try {
      const response = await notificationService.updatePreferences({ [key]: value });
      setPreferences(response?.data || previous);
    } catch (err) {
      setPreferences(previous);
      toast.error(err?.response?.data?.message || 'Could not save that setting.');
    } finally {
      setSavingKey(null);
    }
  };

  // The live list is paged; a filtered view may need older pages to fill up.
  const filteredCount = counts[filter] ?? 0;
  const showLoadMore = hasMore && (filter === 'all' || visible.length < filteredCount);

  return (
    <CustomerLayout>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ═══ List ═══════════════════════════════════════════════ */}
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">
                Notifications
              </h1>
              <p className="mt-2 text-[15px] text-text-muted">
                Stay updated with your bookings, messages and important updates.
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-border disabled:hover:text-secondary"
            >
              <FiCheck /> Mark all as read
            </button>
          </div>

          {/* Filters as chips below xl, where the side card isn't shown. */}
          <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-xl px-4 py-2 text-[13px] transition-colors ${
                  filter === f.key ? 'bg-secondary font-medium text-white' : 'bg-surface-warm text-secondary'
                }`}
              >
                {f.key === 'all' ? 'All' : f.label} ({counts[f.key]})
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {error && (
              <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
                {error}
              </div>
            )}

            {!error && isLoading && notifications.length === 0 && (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            )}

            {!error && !isLoading && visible.length === 0 && !showLoadMore && (
              <EmptyState
                icon={<FiBell size={22} />}
                title={filter === 'unread' ? "You're all caught up" : 'Nothing here yet'}
                description={
                  filter === 'all'
                    ? 'Booking updates, messages and payments will show up here.'
                    : `No ${activeFilter.label.toLowerCase()} notifications.`
                }
              />
            )}

            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 font-body text-lg font-medium text-secondary">{group.label}</h2>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n._id}
                      notification={n}
                      group={group.label}
                      onOpen={handleOpen}
                      onRemove={remove}
                    />
                  ))}
                </ul>
              </section>
            ))}

            {showLoadMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="rounded-xl border border-border bg-surface px-5 py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {isLoading ? 'Loading…' : 'Load older notifications'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Side cards ═════════════════════════════════════════ */}
        <aside className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-3 font-body text-[17px] font-medium text-secondary">
              <FiSettings /> Notification Settings
            </h2>
            {!preferences ? (
              <div className="mt-4 space-y-3">
                {SETTINGS.map((s) => (
                  <div key={s.key} className="h-12 animate-pulse rounded-xl bg-surface-warm" />
                ))}
              </div>
            ) : (
              <ul className="mt-3">
                {SETTINGS.map((s) => (
                  <li key={s.key} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-secondary">{s.label}</p>
                      <p className="text-xs text-text-muted">{s.description}</p>
                    </div>
                    <Toggle
                      checked={preferences[s.key] !== false}
                      onChange={(value) => handleToggle(s.key, value)}
                      label={s.label}
                      disabled={savingKey === s.key}
                    />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11.5px] leading-relaxed text-text-muted">
              Account and security notices are always sent.
            </p>
          </section>

          <section className="hidden rounded-2xl border border-border bg-surface p-5 xl:block">
            <h2 className="flex items-center gap-3 font-body text-[17px] font-medium text-secondary">
              <FiFilter /> Filter Notifications
            </h2>
            <ul className="mt-4 space-y-1">
              {FILTERS.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={filter === f.key}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      filter === f.key ? 'bg-surface-warm font-medium text-secondary' : 'text-text hover:bg-surface-warm/60'
                    }`}
                  >
                    <f.icon className="shrink-0 text-[16px]" />
                    <span className="flex-1">{f.label}</span>
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-surface-warm px-1.5 text-xs text-text-muted">
                      {counts[f.key]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
            <FiHelpCircle className="mt-0.5 shrink-0 text-2xl text-secondary" />
            <div>
              <p className="text-[15px] font-medium text-secondary">Need Help?</p>
              <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                Not getting a notification you expect? Check the settings above, then see how ServiGo works.
              </p>
              <button
                type="button"
                onClick={() => navigate('/how-it-works')}
                className="mt-4 flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary"
              >
                Help & Support <FiArrowRight />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </CustomerLayout>
  );
}
