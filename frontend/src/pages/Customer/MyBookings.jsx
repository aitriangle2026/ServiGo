import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiMoreVertical,
  FiArrowLeft,
  FiPhone,
  FiMessageSquare,
  FiUser,
  FiFileText,
  FiCreditCard,
  FiDollarSign,
  FiX,
  FiChevronDown,
  FiCheck,
} from 'react-icons/fi';
import { FaStar, FaCheckCircle, FaShieldAlt, FaCalendarCheck } from 'react-icons/fa';
import CustomerLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import useHighlight from '@/hooks/useHighlight';
import { bookingService } from '@/services/bookingService';
import { chatService } from '@/services/chatService';
import { useCall } from '@/context/CallContext';
import { formatCurrency } from '@/utils/formatCurrency';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import ReviewForm from '@/components/forms/ReviewForm';
import RescheduleModal from '@/components/bookings/RescheduleModal';

const PLACEHOLDER_IMAGE = '/images/service-placeholder.jpg';

const TABS = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'upcoming', label: 'Upcoming', statuses: ['pending', 'accepted'] },
  { key: 'in_progress', label: 'In Progress', statuses: ['on_the_way'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'rejected'] },
];

const SORTS = [
  { key: 'latest', label: 'Latest', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  { key: 'oldest', label: 'Oldest', compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  {
    key: 'date',
    label: 'Service date',
    // Unscheduled (chat-arranged) bookings sink to the bottom.
    compare: (a, b) =>
      (a.bookingDate ? new Date(a.bookingDate) : Infinity) - (b.bookingDate ? new Date(b.bookingDate) : Infinity),
  },
  { key: 'price', label: 'Price: high to low', compare: (a, b) => (b.totalPrice || 0) - (a.totalPrice || 0) },
];

const STATUS = {
  pending: { label: 'Awaiting confirmation', classes: 'bg-amber-50 text-accent-hover', icon: FaCheckCircle },
  accepted: { label: 'Upcoming', classes: 'bg-success-light text-success', icon: FaCheckCircle },
  on_the_way: { label: 'In Progress', classes: 'bg-primary-light text-primary', icon: FaCheckCircle },
  completed: { label: 'Completed', classes: 'bg-success-light text-success', icon: FaCheckCircle },
  cancelled: { label: 'Cancelled', classes: 'bg-danger-light text-danger', icon: FiX },
  rejected: { label: 'Declined', classes: 'bg-danger-light text-danger', icon: FiX },
};

// The real lifecycle a booking moves through. There's no live location
// data, so "tracking" is this stepper rather than a map.
const TIMELINE = [
  { status: 'pending', label: 'Requested' },
  { status: 'accepted', label: 'Confirmed by provider' },
  { status: 'on_the_way', label: 'Provider on the way' },
  { status: 'completed', label: 'Job completed' },
];

const isChangeable = (b) => ['pending', 'accepted'].includes(b.status);
const canReschedule = (b) => isChangeable(b) && Boolean(b.service?._id);

const providerName = (b) =>
  `${b.provider?.user?.firstName || ''} ${b.provider?.user?.lastName || ''}`.trim() || 'Provider';

const formatDate = (value, withYear = true) =>
  value
    ? new Date(value).toLocaleDateString('en-LK', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(withYear ? { year: 'numeric' } : {}),
      })
    : 'To be scheduled';

function StatusBadge({ status, large = false }) {
  const meta = STATUS[status] || STATUS.pending;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium ${meta.classes} ${
        large ? 'px-3 py-1.5 text-[13px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Icon className="text-[11px]" /> {meta.label}
    </span>
  );
}

function Rating({ provider }) {
  if (!provider?.totalReviews) return <span className="text-xs text-text-muted">No reviews yet</span>;
  return (
    <span className="flex items-center gap-1 text-[13px] text-text">
      <FaStar className="text-accent" /> {provider.averageRating?.toFixed(1)}
      <span className="text-text-muted">({provider.totalReviews} reviews)</span>
    </span>
  );
}

function ProviderAvatar({ booking, className }) {
  const src = booking.provider?.profileImage || booking.provider?.user?.profileImage;
  if (src) return <img src={src} alt="" className={`${className} object-cover`} />;
  return (
    <span className={`${className} grid place-items-center bg-primary-light font-display text-xl text-primary`}>
      {providerName(booking).charAt(0)}
    </span>
  );
}

/** Kebab menu on each card — every secondary action for that booking. */
function CardMenu({ booking, actions }) {
  const [isOpen, setIsOpen] = useState(false);
  const items = [
    { label: 'Chat with provider', onClick: actions.chat, show: Boolean(booking.provider?._id) },
    { label: 'View provider profile', onClick: actions.profile, show: Boolean(booking.provider?._id) },
    { label: 'Reschedule', onClick: actions.reschedule, show: canReschedule(booking) },
    { label: 'Leave a review', onClick: actions.review, show: booking.status === 'completed' },
    { label: 'Book again', onClick: actions.bookAgain, show: Boolean(booking.service?._id) && !isChangeable(booking) },
    { label: 'Cancel booking', onClick: actions.cancel, show: isChangeable(booking), danger: true },
  ].filter((item) => item.show);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
        aria-label="More actions"
        aria-expanded={isOpen}
        className="grid h-8 w-8 place-items-center rounded-full text-secondary hover:bg-surface-warm"
      >
        <FiMoreVertical />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <ul className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
            {items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-warm ${
                    item.danger ? 'text-danger' : 'text-secondary'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function BookingRow({ booking, isSelected, isHighlighted, onSelect, actions }) {
  const isUpcoming = isChangeable(booking);
  return (
    <article
      id={`item-${booking._id}`}
      className={`flex flex-col gap-4 rounded-2xl border bg-surface p-4 transition-shadow sm:flex-row ${
        isSelected ? 'border-primary/50 shadow-soft' : 'border-border'
      } ${isHighlighted ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <img
        src={booking.service?.images?.[0] || PLACEHOLDER_IMAGE}
        alt=""
        className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-[118px] sm:w-32"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-body text-[17px] font-medium text-secondary">
          {booking.service?.title || 'Custom job'}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[13px] text-secondary">{providerName(booking)}</span>
          <Rating provider={booking.provider} />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[13px] text-text">
          <FiCalendar className="shrink-0 text-text-muted" />
          {formatDate(booking.bookingDate)}
          {booking.bookingTime && (
            <>
              <span className="text-border">|</span> {booking.bookingTime}
            </>
          )}
        </p>
        {booking.address && (
          <p className="mt-2 flex items-center gap-2 text-[13px] text-text">
            <FiMapPin className="shrink-0 text-text-muted" />
            <span className="truncate">{booking.address}</span>
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:w-[13.5rem] sm:items-start">
        <div className="flex w-full items-start justify-between gap-2">
          <StatusBadge status={booking.status} />
          <CardMenu booking={booking} actions={actions} />
        </div>
        <p className={`text-[17px] font-medium ${isUpcoming ? 'text-primary' : 'text-secondary'}`}>
          {formatCurrency(booking.totalPrice)}
        </p>
        <div className="mt-auto flex gap-2">
          {booking.status === 'on_the_way' ? (
            <button
              type="button"
              onClick={() => onSelect(booking._id, { scrollTo: 'timeline' })}
              className="rounded-lg bg-secondary px-4 py-2.5 text-[13px] font-medium text-white hover:bg-primary"
            >
              Track Progress
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelect(booking._id)}
              className="rounded-lg bg-secondary px-4 py-2.5 text-[13px] font-medium text-white hover:bg-primary"
            >
              View Details
            </button>
          )}
          {canReschedule(booking) && (
            <button
              type="button"
              onClick={actions.reschedule}
              className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary"
            >
              Reschedule
            </button>
          )}
          {booking.status === 'completed' && (
            <button
              type="button"
              onClick={actions.review}
              className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium text-secondary hover:border-primary hover:text-primary"
            >
              Review
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="grid grid-cols-[1.25rem_7.5rem_minmax(0,1fr)] items-start gap-3 border-b border-border py-3 text-[13.5px] last:border-b-0">
      <Icon className="mt-0.5 text-text-muted" />
      <dt className="text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-secondary">{children}</dd>
    </div>
  );
}

function StatusNote({ booking }) {
  const name = providerName(booking);
  const notes = {
    pending: ['Waiting for confirmation', `${name} hasn't confirmed this booking yet. You'll get a notification as soon as they respond.`],
    accepted: ['Your booking is confirmed', `${name} will arrive at your location at the scheduled time. You'll get a notification when they're on the way.`],
    on_the_way: ['Your provider is on the way', `${name} has set off for your location. Chat or call them if you need to share directions.`],
    completed: ['Job completed', 'Hope it went well — a review helps other customers choose with confidence.'],
    cancelled: ['Booking cancelled', 'This booking was cancelled. You can book the service again any time.'],
    rejected: ['Provider declined', `${name} couldn't take this booking. Try another time or another professional.`],
  };
  const [title, body] = notes[booking.status] || notes.pending;
  const isBad = ['cancelled', 'rejected'].includes(booking.status);

  return (
    <div className="flex gap-4 rounded-xl bg-surface-warm p-4">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface ${
          isBad ? 'text-danger' : 'text-primary'
        }`}
      >
        <FaShieldAlt />
      </span>
      <div>
        <p className="text-sm font-medium text-secondary">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{body}</p>
      </div>
    </div>
  );
}

function Timeline({ status }) {
  if (['cancelled', 'rejected'].includes(status)) return null;
  const reached = TIMELINE.findIndex((step) => step.status === status);

  return (
    <ol data-timeline className="space-y-0">
      {TIMELINE.map((step, index) => {
        const done = index <= reached;
        const current = index === reached;
        return (
          <li key={step.status} className="relative flex gap-3 pb-4 last:pb-0">
            {index < TIMELINE.length - 1 && (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px ${
                  index < reached ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
            <span
              className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                done ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text-muted'
              }`}
            >
              {done ? <FiCheck /> : index + 1}
            </span>
            <span className={`pt-0.5 text-[13px] ${current ? 'font-semibold text-secondary' : done ? 'text-secondary' : 'text-text-muted'}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DetailPanel({ booking, actions, isCalling, onBack }) {
  const name = providerName(booking);
  const trade = booking.service?.category?.name;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-secondary hover:text-primary xl:hidden"
      >
        <FiArrowLeft /> Back to My Bookings
      </button>

      <div className="mt-4 flex items-start justify-between gap-3 xl:mt-0">
        <h2 className="min-w-0 font-display text-[1.4rem] leading-snug text-secondary">
          {booking.service?.title || 'Custom job'}
        </h2>
        <StatusBadge status={booking.status} large />
      </div>
      {booking.reference && (
        <p className="mt-1.5 text-[13px] text-text-muted">
          Booking ID <span className="ml-2 text-secondary">#{booking.reference}</span>
        </p>
      )}

      {/* Provider */}
      <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ProviderAvatar booking={booking} className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-medium text-secondary">
              <span className="truncate">{name}</span>
              {booking.provider?.isVerified && (
                <FaCheckCircle className="shrink-0 text-success" title="Verified professional" />
              )}
            </p>
            {trade && <p className="text-[13px] text-text-muted">{trade}</p>}
            <div className="mt-1">
              <Rating provider={booking.provider} />
            </div>
          </div>
        </div>
        <div className="flex justify-around gap-4 sm:justify-end">
          {[
            { label: isCalling ? 'Calling…' : 'Call', icon: FiPhone, onClick: actions.call, disabled: isCalling },
            { label: 'Chat', icon: FiMessageSquare, onClick: actions.chat },
            { label: 'View Profile', icon: FiUser, onClick: actions.profile },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled || !booking.provider?._id}
              className="group flex flex-col items-center gap-1.5 text-xs text-secondary disabled:opacity-50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors group-hover:border-primary group-hover:text-primary">
                <action.icon />
              </span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <h3 className="mt-6 font-body text-base font-medium text-secondary">Booking Details</h3>
      <dl className="mt-1">
        <DetailRow icon={FiCalendar} label="Date & Time">
          {formatDate(booking.bookingDate)}
          {booking.bookingTime && <span className="text-text-muted"> | </span>}
          {booking.bookingTime}
        </DetailRow>
        <DetailRow icon={FiMapPin} label="Service Location">
          {booking.address || '—'}
        </DetailRow>
        <DetailRow icon={FiFileText} label="Service">
          {booking.service?.title || 'Custom job (arranged in chat)'}
        </DetailRow>
        <DetailRow icon={FiCreditCard} label="Payment Method">
          {booking.paymentMethod === 'card' ? 'Card' : 'Cash on Service'}
        </DetailRow>
        <DetailRow icon={FiDollarSign} label="Total Amount">
          <span className="font-medium">{formatCurrency(booking.totalPrice)}</span>
        </DetailRow>
      </dl>

      {booking.notes && (
        <>
          <h3 className="mt-6 font-body text-base font-medium text-secondary">Your notes</h3>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-text-muted">{booking.notes}</p>
        </>
      )}

      {!['cancelled', 'rejected'].includes(booking.status) && (
        <>
          <h3 className="mt-6 font-body text-base font-medium text-secondary">Progress</h3>
          <div className="mt-3">
            <Timeline status={booking.status} />
          </div>
        </>
      )}

      {isChangeable(booking) && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {canReschedule(booking) && (
            <button
              type="button"
              onClick={actions.reschedule}
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-primary"
            >
              <FiCalendar /> Reschedule Booking
            </button>
          )}
          <button
            type="button"
            onClick={actions.cancel}
            className="flex items-center justify-center gap-2 rounded-xl border border-danger/60 px-4 py-3 text-sm font-medium text-danger hover:bg-danger-light"
          >
            <FiX /> Cancel Booking
          </button>
        </div>
      )}

      {booking.status === 'completed' && (
        <button
          type="button"
          onClick={actions.review}
          className="mt-6 w-full rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-primary"
        >
          Leave a review
        </button>
      )}

      <div className="mt-5">
        <StatusNote booking={booking} />
      </div>
    </div>
  );
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { startCall } = useCall();
  const { data, isLoading, error, refetch } = useFetch(() => bookingService.getMyBookings(), []);
  const bookings = useMemo(() => data?.data || [], [data]);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // Below xl the detail panel is an overlay, opened only on request.
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [reviewBooking, setReviewBooking] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.key,
          tab.statuses ? bookings.filter((b) => tab.statuses.includes(b.status)).length : bookings.length,
        ])
      ),
    [bookings]
  );

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    const needle = search.trim().toLowerCase();
    const sort = SORTS.find((s) => s.key === sortKey);
    return bookings
      .filter((b) => !tab.statuses || tab.statuses.includes(b.status))
      .filter(
        (b) =>
          !needle ||
          (b.service?.title || '').toLowerCase().includes(needle) ||
          providerName(b).toLowerCase().includes(needle)
      )
      .sort(sort.compare);
  }, [bookings, activeTab, search, sortKey]);

  // Scrolls to and flags the booking a notification (or the dashboard) linked
  // to. Arriving that way is a fresh navigation, so the tab is still "all".
  const { highlightId, isHighlighted } = useHighlight(filtered);

  // Derived rather than mirrored into state: an explicit pick wins, then the
  // linked booking, then the first one in view.
  const selected =
    filtered.find((b) => b._id === selectedId) ||
    filtered.find((b) => b._id === highlightId) ||
    filtered[0] ||
    null;

  const handleSelect = (id, { scrollTo } = {}) => {
    setSelectedId(id);
    setIsPanelOpen(true);
    if (scrollTo) {
      // The panel exists twice (side panel and mobile sheet); scroll whichever
      // one is actually displayed.
      requestAnimationFrame(() =>
        [...document.querySelectorAll('[data-timeline]')]
          .find((el) => el.offsetParent !== null)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
    }
  };

  const openConversation = async (booking) => {
    const response = await chatService.startConversation({
      providerId: booking.provider?._id,
      serviceId: booking.service?._id,
    });
    return response?.data?._id;
  };

  const actionsFor = (booking) => ({
    chat: async () => {
      try {
        const id = await openConversation(booking);
        if (id) navigate(`/messages/${id}`);
      } catch {
        // The chat page shows its own errors; nothing useful to add here.
      }
    },
    call: async () => {
      setIsCalling(true);
      try {
        const id = await openConversation(booking);
        if (id && booking.provider?.user?._id) {
          await startCall(
            {
              userId: booking.provider.user._id,
              name: providerName(booking),
              avatar: booking.provider.profileImage || booking.provider.user.profileImage,
            },
            id
          );
        }
      } finally {
        setIsCalling(false);
      }
    },
    profile: () => navigate(`/providers/${booking.provider?._id}`),
    reschedule: () => setRescheduleBooking(booking),
    review: () => setReviewBooking(booking),
    bookAgain: () => navigate(`/book/${booking.service?._id}`),
    cancel: () => {
      setCancelError('');
      setCancelTarget(booking);
    },
  });

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError('');
    try {
      await bookingService.cancel(cancelTarget._id);
      setCancelTarget(null);
      refetch();
    } catch (err) {
      setCancelError(err?.response?.data?.message || 'Could not cancel this booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const activeSort = SORTS.find((s) => s.key === sortKey);

  return (
    <CustomerLayout>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">
            My Bookings
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">Track and manage all your service bookings in one place.</p>
        </div>
        <label className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 lg:mt-2 lg:max-w-md">
          <FiSearch className="shrink-0 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings by service or provider..."
            aria-label="Search bookings"
            className="w-full bg-transparent text-sm text-secondary placeholder:text-text-muted focus:outline-none"
          />
        </label>
      </div>

      {/* ─── Tabs + sort ────────────────────────────────────────── */}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-secondary font-medium text-white'
                  : 'bg-surface-warm text-secondary hover:bg-border/60'
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen((open) => !open)}
            aria-expanded={sortOpen}
            className="flex w-full items-center justify-between gap-6 rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] text-secondary sm:w-auto"
          >
            Sort by: {activeSort.label}
            <FiChevronDown className="text-text-muted" />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <ul className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
                {SORTS.map((sort) => (
                  <li key={sort.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey(sort.key);
                        setSortOpen(false);
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-warm ${
                        sort.key === sortKey ? 'font-semibold text-primary' : 'text-secondary'
                      }`}
                    >
                      {sort.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !isLoading && filtered.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<FaCalendarCheck size={22} />}
            title={bookings.length === 0 ? 'No bookings yet' : 'No bookings here'}
            description={
              bookings.length === 0
                ? 'Once you book a service, it will show up here so you can track it.'
                : search
                  ? 'Nothing matches that search.'
                  : 'Nothing matches this filter yet.'
            }
            actionLabel={bookings.length === 0 ? 'Browse services' : undefined}
            onAction={bookings.length === 0 ? () => navigate('/services') : undefined}
          />
        </div>
      )}

      {!error && !isLoading && filtered.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            {filtered.map((booking) => (
              <BookingRow
                key={booking._id}
                booking={booking}
                isSelected={selected?._id === booking._id}
                isHighlighted={isHighlighted(booking._id)}
                onSelect={handleSelect}
                actions={actionsFor(booking)}
              />
            ))}
          </div>

          {selected && (
            <>
              {/* xl+: sticky side panel. */}
              <aside className="hidden min-w-0 xl:block">
                <div className="sticky top-[90px] max-h-[calc(100vh-110px)] overflow-y-auto rounded-2xl">
                  <DetailPanel
                    booking={selected}
                    actions={actionsFor(selected)}
                    isCalling={isCalling}
                    onBack={() => setIsPanelOpen(false)}
                  />
                </div>
              </aside>

              {/* Below xl: full-screen sheet. */}
              {isPanelOpen && (
                <div className="fixed inset-0 z-40 overflow-y-auto bg-background p-4 sm:p-6 xl:hidden">
                  <DetailPanel
                    booking={selected}
                    actions={actionsFor(selected)}
                    isCalling={isCalling}
                    onBack={() => setIsPanelOpen(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {reviewBooking && (
        <ReviewForm
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => setReviewBooking(null)}
        />
      )}

      <RescheduleModal
        key={rescheduleBooking?._id || 'none'}
        booking={rescheduleBooking}
        onClose={() => setRescheduleBooking(null)}
        onDone={() => {
          setRescheduleBooking(null);
          refetch();
        }}
      />

      <Modal isOpen={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Cancel this booking?" size="sm">
        <p className="text-sm leading-relaxed text-text-muted">
          {cancelTarget?.service?.title || 'This booking'} with {cancelTarget ? providerName(cancelTarget) : ''} on{' '}
          {formatDate(cancelTarget?.bookingDate, false)}. The provider will be notified. This can't be undone.
        </p>
        {cancelError && <p className="mt-3 rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{cancelError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCancelTarget(null)}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </Modal>
    </CustomerLayout>
  );
}
