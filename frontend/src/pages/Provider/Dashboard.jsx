import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiMoreVertical,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
  FiTool,
  FiClipboard,
  FiUser,
  FiCreditCard,
  FiTrendingUp,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { useNotifications } from '@/context/NotificationContext';
import { bookingService } from '@/services/bookingService';
import { providerService } from '@/services/providerService';
import { reviewService } from '@/services/reviewService';
import { chatService } from '@/services/chatService';
import { formatCurrency } from '@/utils/formatCurrency';
import Modal from '@/components/common/Modal';

const PLACEHOLDER_IMAGE = '/images/service-placeholder.jpg';

const STATUS = {
  pending: { label: 'Awaiting you', classes: 'bg-amber-50 text-accent-hover', dot: 'bg-accent' },
  accepted: { label: 'Upcoming', classes: 'bg-success-light text-success', dot: 'bg-success' },
  on_the_way: { label: 'In Progress', classes: 'bg-primary-light text-primary', dot: 'bg-primary' },
  completed: { label: 'Completed', classes: 'bg-surface-warm text-text-muted', dot: 'bg-border' },
  cancelled: { label: 'Cancelled', classes: 'bg-danger-light text-danger', dot: 'bg-danger' },
  rejected: { label: 'Declined', classes: 'bg-danger-light text-danger', dot: 'bg-danger' },
};

// The provider-side transitions the server allows (booking.service.js →
// updateBookingStatus). Cancelling is the customer's action, not offered here.
const NEXT_ACTIONS = {
  pending: [
    { status: 'accepted', label: 'Accept booking' },
    { status: 'rejected', label: 'Decline booking', danger: true, confirm: true },
  ],
  accepted: [{ status: 'on_the_way', label: "I'm on the way" }],
  on_the_way: [{ status: 'completed', label: 'Mark as completed' }],
};

// ── Date helpers ──────────────────────────────────────────────────────
// bookingDate is saved from a "YYYY-MM-DD" string, i.e. UTC midnight, so its
// calendar day is read in UTC. "Today" is the provider's local day.
const bookingDayKey = (b) => (b.bookingDate ? new Date(b.bookingDate).toISOString().slice(0, 10) : null);
const localDayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// "09:00 AM" → minutes since midnight, for ordering the day.
const minutesOf = (time = '') => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(time.trim());
  if (!match) return 24 * 60;
  let hours = Number(match[1]) % 12;
  if (match[3]?.toUpperCase() === 'PM') hours += 12;
  if (!match[3]) hours = Number(match[1]); // legacy "09:00" values
  return hours * 60 + Number(match[2]);
};

const customerName = (b) =>
  `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim() || 'Customer';

/** % change, or null when there's no previous figure to compare against. */
const percentChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

function Trend({ value }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-success' : 'text-danger'}`}>
      {up ? <FiArrowUp /> : <FiArrowDown />}
      {up ? '+' : ''}
      {value}%
    </span>
  );
}

function Stars({ rating, size = 'text-xs' }) {
  return (
    <span className={`flex gap-0.5 ${size}`} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} className={i < Math.round(rating) ? 'text-accent' : 'text-border'} />
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${meta.classes}`}>
      <FiCheckCircle className="text-[11px]" /> {meta.label}
    </span>
  );
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-surface p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-body text-lg font-medium text-secondary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ to, label = 'View All' }) {
  return (
    <Link to={to} className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline">
      {label} <FiChevronRight />
    </Link>
  );
}

/** Kebab menu with the next valid status change for a booking. */
function ActionMenu({ booking, onChangeStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const actions = NEXT_ACTIONS[booking.status] || [];
  if (actions.length === 0) return <span className="h-9 w-9" />;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Booking actions"
        aria-expanded={isOpen}
        className="grid h-9 w-9 place-items-center rounded-full text-secondary hover:bg-surface-warm"
      >
        <FiMoreVertical />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
            {actions.map((action) => (
              <li key={action.status}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onChangeStatus(booking, action);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-warm ${
                    action.danger ? 'text-danger' : 'text-secondary'
                  }`}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Weekly earnings for one month as bars. Single series, so one hue and no
 * legend; the week in progress is drawn solid, the rest tinted.
 */
function EarningsChart({ weeks, currentWeekIndex }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...weeks.map((w) => w.total), 0);
  // A round top for the axis: 1, 2, 2.5 or 5 × a power of ten.
  const niceMax = (() => {
    if (max <= 0) return 1000;
    const power = 10 ** Math.floor(Math.log10(max));
    return [1, 2, 2.5, 5, 10].map((m) => m * power).find((m) => m >= max);
  })();
  const ticks = [0, 0.5, 1].map((f) => Math.round(niceMax * f));
  const short = (n) => (n >= 1000 ? `${Math.round((n / 1000) * 10) / 10}K` : String(n));

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <div className="flex h-36 flex-col justify-between pb-0 text-right text-[11px] text-text-muted">
          {[...ticks].reverse().map((tick) => (
            <span key={tick} className="leading-none">
              {short(tick)}
            </span>
          ))}
        </div>
        <div className="relative h-36 flex-1">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute inset-x-0 h-px bg-border/70"
              style={{ bottom: `${(tick / niceMax) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-[2px]">
            {weeks.map((week, index) => (
              <button
                key={week.label}
                type="button"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                aria-label={`${week.label}: ${formatCurrency(week.total)}, ${week.jobs} jobs`}
                className="relative flex h-full w-full max-w-10 items-end justify-center"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-colors ${
                    index === currentWeekIndex ? 'bg-primary' : 'bg-primary/30'
                  } ${hovered === index ? 'bg-primary/70' : ''}`}
                  style={{ height: `${Math.max((week.total / niceMax) * 100, week.total > 0 ? 3 : 0)}%` }}
                />
                {hovered === index && (
                  <span className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] text-white shadow-soft-lg">
                    {week.label} · {formatCurrency(week.total)} · {week.jobs} {week.jobs === 1 ? 'job' : 'jobs'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-8 mt-2 flex justify-around text-[11px] text-text-muted">
        {weeks.map((week) => (
          <span key={week.label}>{week.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCall } = useCall();
  const { notifications } = useNotifications();

  const { data, isLoading, error, refetch } = useFetch(() => bookingService.getProviderBookings(), []);
  const profileFetch = useFetch(() => providerService.getMyProfile(), []);
  const conversationsFetch = useFetch(() => chatService.getConversations(), []);

  const bookings = useMemo(() => data?.data || [], [data]);
  const profile = profileFetch.data?.data;

  const [reviews, setReviews] = useState(null);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [earningsMonth, setEarningsMonth] = useState('this');
  const [busyId, setBusyId] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);

  useEffect(() => {
    if (!profile?._id) return undefined;
    let cancelled = false;
    reviewService
      .getByProvider(profile._id)
      .then((response) => {
        if (!cancelled) setReviews(response?.data || []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?._id]);

  // Local override until the profile reloads; derived otherwise.
  const online = isAvailable ?? profile?.isAvailable !== false;

  // customer id → conversation id. Providers can't open a new thread (only a
  // customer can start one), so chat/call is offered where a thread exists.
  const conversationByCustomer = useMemo(() => {
    const map = new Map();
    (conversationsFetch.data?.data || []).forEach((c) => {
      const id = c.customer?._id || c.customer;
      if (id && !map.has(String(id))) map.set(String(id), c._id);
    });
    return map;
  }, [conversationsFetch.data]);

  // ── Figures ─────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const todayKey = localDayKey(now);

  const createdIn = (key) => bookings.filter((b) => monthKey(new Date(b.createdAt)) === key);
  const completedIn = (key) =>
    bookings.filter((b) => b.status === 'completed' && bookingDayKey(b)?.slice(0, 7) === key);

  const pending = bookings.filter((b) => b.status === 'pending');
  const todays = bookings
    .filter((b) => bookingDayKey(b) === todayKey && !['cancelled', 'rejected'].includes(b.status))
    .sort((a, b) => minutesOf(a.bookingTime) - minutesOf(b.bookingTime));
  const upcomingToday = todays.filter((b) => ['pending', 'accepted'].includes(b.status));
  const nextUp = bookings
    .filter((b) => ['pending', 'accepted'].includes(b.status) && bookingDayKey(b) && bookingDayKey(b) > todayKey)
    .sort((a, b) => bookingDayKey(a).localeCompare(bookingDayKey(b)) || minutesOf(a.bookingTime) - minutesOf(b.bookingTime))[0];

  const allTimeEarned = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const stats = [
    {
      label: 'Total Bookings',
      value: createdIn(thisMonth).length,
      trend: percentChange(createdIn(thisMonth).length, createdIn(lastMonth).length),
      note: 'Received this month',
      icon: FiCalendar,
      tone: 'bg-primary-light text-primary',
    },
    {
      label: 'Completed',
      value: completedIn(thisMonth).length,
      trend: percentChange(completedIn(thisMonth).length, completedIn(lastMonth).length),
      note: 'This month',
      icon: FiCheckCircle,
      tone: 'bg-success-light text-success',
    },
    {
      label: 'Upcoming',
      value: upcomingToday.length,
      trend: null,
      note: 'Today',
      icon: FiClock,
      tone: 'bg-amber-50 text-accent-hover',
    },
  ];

  // Earnings for the chosen month, bucketed into calendar weeks (1–7, 8–14…).
  const earningsKey = earningsMonth === 'this' ? thisMonth : lastMonth;
  const earningsPrevKey = monthKey(
    new Date(now.getFullYear(), now.getMonth() - (earningsMonth === 'this' ? 1 : 2), 1)
  );
  const monthCompleted = completedIn(earningsKey);
  const monthTotal = monthCompleted.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const prevTotal = completedIn(earningsPrevKey).reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const [year, month] = earningsKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, i) => ({
    label: `Week ${i + 1}`,
    total: 0,
    jobs: 0,
  }));
  monthCompleted.forEach((b) => {
    const week = weeks[Math.floor((Number(bookingDayKey(b).slice(8, 10)) - 1) / 7)];
    week.total += b.totalPrice || 0;
    week.jobs += 1;
  });
  const currentWeekIndex = earningsMonth === 'this' ? Math.floor((now.getDate() - 1) / 7) : -1;

  const recent = bookings.slice(0, 3);
  const latestReviews = (reviews || []).slice(0, 2);
  const hasUnreadMessages = notifications.some((n) => n.type === 'new_message' && !n.isRead);

  // What would most help this provider get booked — real gaps only.
  const tip = !profile
    ? null
    : !profile.isVerified
      ? { title: 'Get verified', body: 'Verified professionals show up in search. Finish your verification to start getting booked.', cta: 'Continue verification', to: '/provider/verification' }
      : !profile.profileImage || !profile.bio
        ? { title: 'Get more bookings', body: 'Profiles with a photo and an introduction get chosen more often.', cta: 'Update Profile', to: '/provider/profile' }
        : !online
          ? { title: "You're offline", body: "Customers can't find you in search right now. Go online when you're ready for new jobs.", cta: null }
          : { title: 'Get more bookings', body: 'Keep your services up to date and reply to requests quickly.', cta: 'Update Services', to: '/provider/services' };

  // ── Actions ─────────────────────────────────────────────────────────
  const toggleAvailability = async () => {
    const next = !online;
    setIsAvailable(next);
    setIsTogglingAvailability(true);
    try {
      await providerService.updateProfile({ isAvailable: next });
      toast.success(next ? "You're online — customers can find you" : "You're offline — hidden from search");
    } catch (err) {
      setIsAvailable(!next);
      toast.error(err?.response?.data?.message || 'Could not change your status.');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const changeStatus = async (booking, action) => {
    if (action.confirm) {
      setDeclineTarget({ booking, action });
      return;
    }
    await applyStatus(booking, action.status);
  };

  const applyStatus = async (booking, status) => {
    setBusyId(booking._id);
    try {
      await bookingService.updateStatus(booking._id, status);
      toast.success(`${booking.service?.title || 'Booking'} — ${STATUS[status]?.label.toLowerCase()}`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update this booking.');
    } finally {
      setBusyId(null);
      setDeclineTarget(null);
    }
  };

  const openChat = (booking) => {
    const id = conversationByCustomer.get(String(booking.customer?._id));
    if (id) navigate(`/messages/${id}`);
  };

  const call = (booking) => {
    const id = conversationByCustomer.get(String(booking.customer?._id));
    if (!id || !booking.customer?._id) return;
    startCall({ userId: booking.customer._id, name: customerName(booking), avatar: booking.customer.profileImage }, id);
  };

  const firstName = user?.firstName || 'there';

  return (
    <ProviderLayout>
      {/* ═══ Header ═════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg text-text-muted">Welcome back,</p>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">
            {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || firstName}{' '}
            <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-[15px] text-text-muted">Here's an overview of your services and bookings today.</p>
        </div>

        <div className="shrink-0 sm:text-right">
          <button
            type="button"
            role="switch"
            aria-checked={online}
            onClick={toggleAvailability}
            disabled={!profile || isTogglingAvailability}
            className="flex items-center gap-3 rounded-full border border-border bg-surface py-2 pl-2 pr-5 disabled:opacity-60"
          >
            <span className={`relative h-7 w-12 rounded-full transition-colors ${online ? 'bg-primary' : 'bg-border'}`}>
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow-soft transition-all ${online ? 'left-6' : 'left-1'}`}
              />
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-secondary">
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-success' : 'bg-text-muted'}`} />
              {online ? 'Online' : 'Offline'}
            </span>
          </button>
          <p className="mt-1.5 text-xs text-text-muted">
            {online ? 'You are visible to customers' : 'Hidden from search results'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {/* Requests waiting on the provider — the most time-sensitive thing here. */}
      {pending.length > 0 && (
        <Link
          to="/provider/bookings"
          className="mt-6 flex items-center gap-4 rounded-2xl border border-accent/30 bg-amber-50 p-4 transition-colors hover:border-accent"
        >
          <FiAlertCircle className="shrink-0 text-xl text-accent-hover" />
          <span className="min-w-0 flex-1 text-sm text-secondary">
            <strong className="font-semibold">
              {pending.length} new booking {pending.length === 1 ? 'request' : 'requests'}
            </strong>{' '}
            waiting for your response.
          </span>
          <FiChevronRight className="shrink-0 text-secondary" />
        </Link>
      )}

      {/* ═══ Stats ══════════════════════════════════════════════════ */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl ${stat.tone}`}>
              <stat.icon />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-secondary">{stat.label}</p>
              <p className="flex items-center gap-2">
                <span className="text-3xl font-medium text-secondary">{isLoading ? '—' : stat.value}</span>
                <Trend value={stat.trend} />
              </p>
              <p className="text-xs text-text-muted">{stat.note}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-50 text-xl text-accent">
            <FaStar />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-secondary">Average Rating</p>
            {profile?.totalReviews > 0 ? (
              <>
                <p className="flex items-center gap-2">
                  <span className="text-3xl font-medium text-secondary">{profile.averageRating.toFixed(1)}</span>
                  <Stars rating={profile.averageRating} size="text-sm" />
                </p>
                <p className="text-xs text-text-muted">({profile.totalReviews} reviews)</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-text-muted">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Schedule + earnings ════════════════════════════════════ */}
      <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_25rem]">
        <Card title="Today's Schedule" action={<ViewAll to="/provider/bookings" label="All bookings" />}>
          {isLoading && <div className="h-48 animate-pulse rounded-xl bg-surface-warm" />}

          {!isLoading && todays.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-secondary">No jobs scheduled for today.</p>
              {nextUp && (
                <p className="mt-1 text-[13px] text-text-muted">
                  Next up: {nextUp.service?.title || 'Booking'} with {customerName(nextUp)} on{' '}
                  {new Date(nextUp.bookingDate).toLocaleDateString('en-LK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                  {nextUp.bookingTime && ` at ${nextUp.bookingTime}`}.
                </p>
              )}
            </div>
          )}

          {!isLoading && todays.length > 0 && (
            <ol className="relative">
              {todays.map((booking, index) => {
                const hasThread = conversationByCustomer.has(String(booking.customer?._id));
                return (
                  <li key={booking._id} className="relative grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-2 pb-3 last:pb-0 sm:grid-cols-[5.5rem_1.25rem_minmax(0,1fr)]">
                    <span className="pt-4 text-[13px] text-text-muted">{booking.bookingTime || '—'}</span>
                    <span className="relative flex justify-center">
                      {index < todays.length - 1 && <span className="absolute top-6 h-full w-px bg-border" />}
                      <span className={`relative mt-5 h-3 w-3 rounded-full ring-4 ring-surface ${(STATUS[booking.status] || STATUS.pending).dot}`} />
                    </span>
                    <div className={`flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center ${busyId === booking._id ? 'opacity-60' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-secondary">{booking.service?.title || 'Custom job'}</p>
                        <p className="text-sm text-text-muted">{customerName(booking)}</p>
                        {booking.address && (
                          <p className="mt-1 flex items-center gap-2 text-[13px] text-text">
                            <FiMapPin className="shrink-0 text-text-muted" />
                            <span className="truncate">{booking.address}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={booking.status} />
                        <button
                          type="button"
                          onClick={() => openChat(booking)}
                          disabled={!hasThread}
                          title={hasThread ? 'Chat' : 'No conversation with this customer yet'}
                          aria-label="Chat with customer"
                          className="ml-2 grid h-9 w-9 place-items-center rounded-full bg-surface-warm text-secondary hover:text-primary disabled:opacity-40"
                        >
                          <FiMessageSquare />
                        </button>
                        <button
                          type="button"
                          onClick={() => call(booking)}
                          disabled={!hasThread}
                          title={hasThread ? 'Call' : 'No conversation with this customer yet'}
                          aria-label="Call customer"
                          className="grid h-9 w-9 place-items-center rounded-full bg-surface-warm text-secondary hover:text-primary disabled:opacity-40"
                        >
                          <FiPhone />
                        </button>
                        <ActionMenu booking={booking} onChangeStatus={changeStatus} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card
          title="Earnings Overview"
          action={
            <select
              value={earningsMonth}
              onChange={(e) => setEarningsMonth(e.target.value)}
              aria-label="Earnings period"
              className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-secondary focus:border-primary focus:outline-none"
            >
              <option value="this">This Month</option>
              <option value="last">Last Month</option>
            </select>
          }
        >
          <p className="text-3xl font-medium text-secondary">{formatCurrency(monthTotal)}</p>
          {percentChange(monthTotal, prevTotal) !== null ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
              <Trend value={percentChange(monthTotal, prevTotal)} /> from the month before
            </p>
          ) : (
            <p className="mt-1 text-sm text-text-muted">Nothing earned the month before to compare.</p>
          )}

          <EarningsChart weeks={weeks} currentWeekIndex={currentWeekIndex} />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                <FiCreditCard />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-text-muted">All-time earned</p>
                <p className="truncate text-sm font-medium text-secondary">{formatCurrency(allTimeEarned)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                <FiCalendar />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-text-muted">Completed jobs</p>
                <p className="text-sm font-medium text-secondary">{monthCompleted.length}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] text-text-muted">From completed bookings, by service date.</p>
        </Card>
      </div>

      {/* ═══ Recent · reviews · actions ═════════════════════════════ */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_25rem]">
        <Card title="Recent Bookings" action={<ViewAll to="/provider/bookings" />}>
          {!isLoading && recent.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">
              Once a customer books one of your services, it'll show up here.
            </p>
          )}
          <ul className="space-y-2">
            {recent.map((booking) => (
              <li key={booking._id}>
                <Link
                  to={`/provider/bookings?highlight=${booking._id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-2.5 transition-colors hover:border-primary/40"
                >
                  <img
                    src={booking.service?.images?.[0] || PLACEHOLDER_IMAGE}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-secondary">{booking.service?.title || 'Custom job'}</p>
                    <p className="truncate text-[13px] text-text-muted">{customerName(booking)}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <FiCalendar className="shrink-0" />
                      {booking.bookingDate
                        ? new Date(booking.bookingDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', timeZone: 'UTC' })
                        : 'To be scheduled'}
                      {booking.bookingTime && `, ${booking.bookingTime}`}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                  <FiChevronRight className="shrink-0 text-text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Customer Reviews" action={<ViewAll to="/provider/reviews" />}>
          {reviews === null && <div className="h-40 animate-pulse rounded-xl bg-surface-warm" />}
          {reviews?.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">Reviews appear here after completed jobs.</p>
          )}
          <ul className="divide-y divide-border">
            {latestReviews.map((review) => {
              const name = `${review.customer?.firstName || ''} ${review.customer?.lastName || ''}`.trim() || 'Customer';
              return (
                <li key={review._id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    {review.customer?.profileImage ? (
                      <img src={review.customer.profileImage} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light font-display text-primary">
                        {name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm font-medium text-secondary">{name}</p>
                        <span className="text-xs text-text-muted">
                          {new Date(review.createdAt).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                        <Stars rating={review.rating} /> {Number(review.rating).toFixed(1)}
                      </p>
                    </div>
                  </div>
                  {review.review && (
                    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-text">“{review.review}”</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-5 xl:col-span-2 2xl:col-span-1">
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Update Services', icon: FiTool, to: '/provider/services' },
                { label: 'Service Requests', icon: FiClipboard, to: '/provider/job-requests' },
                { label: 'View Messages', icon: FiMessageSquare, to: '/messages', dot: hasUnreadMessages },
                { label: 'Edit Profile', icon: FiUser, to: '/provider/profile' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="relative flex flex-col items-center gap-2 rounded-xl border border-border px-2 py-4 text-center text-xs text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {action.dot && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger" />}
                  <action.icon className="text-xl" />
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>

          {tip && (
            <section className="flex items-center gap-4 rounded-2xl bg-primary-light p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface text-2xl text-primary">
                <FiTrendingUp />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-secondary">{tip.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{tip.body}</p>
                {tip.cta && (
                  <Link
                    to={tip.to}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-[13px] font-medium text-white hover:bg-primary"
                  >
                    {tip.cta} <FiChevronRight />
                  </Link>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <Modal isOpen={Boolean(declineTarget)} onClose={() => setDeclineTarget(null)} title="Decline this booking?" size="sm">
        <p className="text-sm leading-relaxed text-text-muted">
          {declineTarget?.booking.service?.title} for {declineTarget ? customerName(declineTarget.booking) : ''}. The customer
          will be notified. This can't be undone.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeclineTarget(null)}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={busyId !== null}
            onClick={() => applyStatus(declineTarget.booking, 'rejected')}
            className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      </Modal>
    </ProviderLayout>
  );
}
