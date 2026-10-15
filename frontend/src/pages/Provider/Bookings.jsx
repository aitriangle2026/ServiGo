import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMessageSquare,
  FiMoreVertical,
  FiChevronRight,
  FiTool,
  FiFileText,
  FiCreditCard,
  FiHash,
} from 'react-icons/fi';
import { FaCalendarCheck } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import useHighlight from '@/hooks/useHighlight';
import { bookingService } from '@/services/bookingService';
import { chatService } from '@/services/chatService';
import { useCall } from '@/context/CallContext';
import { formatCurrency } from '@/utils/formatCurrency';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';

const PLACEHOLDER_IMAGE = '/images/service-placeholder.jpg';

const TABS = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'pending', label: 'Requests', statuses: ['pending'] },
  { key: 'upcoming', label: 'Upcoming', statuses: ['accepted'] },
  { key: 'ongoing', label: 'Ongoing', statuses: ['on_the_way'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'rejected'] },
];

const STATUS = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-accent-hover' },
  accepted: { label: 'Upcoming', classes: 'bg-primary-light text-primary' },
  on_the_way: { label: 'Ongoing', classes: 'bg-success-light text-success' },
  completed: { label: 'Completed', classes: 'bg-success-light text-success' },
  cancelled: { label: 'Cancelled', classes: 'bg-danger-light text-danger' },
  rejected: { label: 'Declined', classes: 'bg-danger-light text-danger' },
};

// The provider-side transitions the server allows (booking.service.js →
// updateBookingStatus). "Start Job" is the on-the-way step: it tells the
// customer you've set off.
const ACTIONS = {
  pending: [
    { status: 'accepted', label: 'Accept' },
    { status: 'rejected', label: 'Decline', danger: true, confirm: true },
  ],
  accepted: [{ status: 'on_the_way', label: 'Start Job' }],
  on_the_way: [{ status: 'completed', label: 'Mark Completed' }],
};

const DATE_FILTERS = [
  { key: 'all', label: 'All dates' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const SORTS = [
  { key: 'newest', label: 'Newest request', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  { key: 'soonest', label: 'Service date (soonest)', compare: (a, b) => dayKey(a).localeCompare(dayKey(b)) || minutesOf(a.bookingTime) - minutesOf(b.bookingTime) },
  { key: 'latest', label: 'Service date (latest)', compare: (a, b) => dayKey(b).localeCompare(dayKey(a)) || minutesOf(b.bookingTime) - minutesOf(a.bookingTime) },
  { key: 'price', label: 'Price: high to low', compare: (a, b) => (b.totalPrice || 0) - (a.totalPrice || 0) },
];

// bookingDate is UTC midnight of the chosen day; unscheduled sorts last.
function dayKey(b) {
  return b.bookingDate ? new Date(b.bookingDate).toISOString().slice(0, 10) : '9999-12-31';
}
const localKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function minutesOf(time = '') {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(time.trim());
  if (!match) return 24 * 60;
  let hours = Number(match[1]);
  if (match[3]) hours = (hours % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return hours * 60 + Number(match[2]);
}

function dateWindow(key) {
  const now = new Date();
  if (key === 'today') return [localKey(now), localKey(now)];
  if (key === 'week') {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return [localKey(monday), localKey(sunday)];
  }
  if (key === 'month') {
    return [localKey(new Date(now.getFullYear(), now.getMonth(), 1)), localKey(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
  }
  return null;
}

const customerName = (b) => `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim() || 'Customer';
// Addresses are saved as "line, city" — the last part is the area.
const areaOf = (b) => (b.address ? b.address.split(',').pop().trim() : '');
const formatDate = (b, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-LK', { ...opts, timeZone: 'UTC' }) : 'To be scheduled';

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.pending;
  return <span className={`inline-block rounded-lg px-3 py-1 text-xs font-medium ${meta.classes}`}>{meta.label}</span>;
}

function Select({ value, onChange, label, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-secondary focus:border-primary focus:outline-none"
    >
      {children}
    </select>
  );
}

function RowMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="More actions"
        aria-expanded={isOpen}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-secondary hover:bg-surface-warm"
      >
        <FiMoreVertical />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
            {items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-warm ${item.danger ? 'text-danger' : 'text-secondary'}`}
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

export default function ProviderBookings() {
  const navigate = useNavigate();
  const { startCall } = useCall();
  const { data, isLoading, error, refetch } = useFetch(() => bookingService.getProviderBookings(), []);
  const conversationsFetch = useFetch(() => chatService.getConversations(), []);
  const bookings = useMemo(() => data?.data || [], [data]);

  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [updatingId, setUpdatingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);

  // Only a customer can open a chat thread, so message/call are offered where
  // one already exists.
  const conversationByCustomer = useMemo(() => {
    const map = new Map();
    (conversationsFetch.data?.data || []).forEach((c) => {
      const id = c.customer?._id || c.customer;
      if (id && !map.has(String(id))) map.set(String(id), c._id);
    });
    return map;
  }, [conversationsFetch.data]);

  const serviceOptions = [...new Set(bookings.map((b) => b.service?.title).filter(Boolean))].sort();
  const areaOptions = [...new Set(bookings.map(areaOf).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  // Tab counts follow every filter except the tab itself.
  const dateRange = dateWindow(dateFilter);
  const needle = search.trim().toLowerCase();
  const baseFiltered = bookings.filter((b) => {
    if (dateRange && (dayKey(b) < dateRange[0] || dayKey(b) > dateRange[1])) return false;
    if (serviceFilter !== 'all' && b.service?.title !== serviceFilter) return false;
    if (areaFilter !== 'all' && areaOf(b) !== areaFilter) return false;
    if (
      needle &&
      ![customerName(b), b.service?.title, b.address, b.reference].some((field) => (field || '').toLowerCase().includes(needle))
    ) {
      return false;
    }
    return true;
  });
  const counts = Object.fromEntries(
    TABS.map((tab) => [tab.key, tab.statuses ? baseFiltered.filter((b) => tab.statuses.includes(b.status)).length : baseFiltered.length])
  );
  const activeStatuses = TABS.find((t) => t.key === activeTab).statuses;
  const visible = baseFiltered
    .filter((b) => !activeStatuses || activeStatuses.includes(b.status))
    .sort(SORTS.find((s) => s.key === sortKey).compare);

  // Scrolls to and flags the booking a notification (or the dashboard)
  // linked to. Arriving that way is a fresh load, so no filter hides it.
  const { isHighlighted } = useHighlight(visible);

  const hasFilters = dateFilter !== 'all' || serviceFilter !== 'all' || areaFilter !== 'all' || needle;

  // ── Actions ─────────────────────────────────────────────────────────
  const applyStatus = async (booking, status) => {
    setUpdatingId(booking._id);
    try {
      await bookingService.updateStatus(booking._id, status);
      toast.success(
        status === 'on_the_way'
          ? `${customerName(booking)} has been told you're on the way`
          : `Booking ${STATUS[status].label.toLowerCase()}`
      );
      setDetail(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update this booking.');
    } finally {
      setUpdatingId(null);
      setDeclineTarget(null);
    }
  };

  const runAction = (booking, action) => (action.confirm ? setDeclineTarget(booking) : applyStatus(booking, action.status));

  const threadFor = (booking) => conversationByCustomer.get(String(booking.customer?._id));

  const message = (booking) => {
    const id = threadFor(booking);
    if (id) navigate(`/messages/${id}`);
  };

  const call = (booking) => {
    const id = threadFor(booking);
    if (!id) return;
    startCall({ userId: booking.customer._id, name: customerName(booking), avatar: booking.customer.profileImage }, id);
  };

  const menuItems = (booking) => [
    ...(threadFor(booking)
      ? [
          { label: 'Message customer', onClick: () => message(booking) },
          { label: 'Call in app', onClick: () => call(booking) },
        ]
      : []),
    { label: 'View details', onClick: () => setDetail(booking) },
    ...(booking.service?._id ? [{ label: 'View service listing', onClick: () => navigate(`/services/${booking.service._id}`) }] : []),
    ...(ACTIONS[booking.status] || [])
      .filter((a) => a.danger)
      .map((a) => ({ label: a.label + ' booking', danger: true, onClick: () => runAction(booking, a) })),
  ];

  return (
    <ProviderLayout>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-text-muted">
        <Link to="/provider/dashboard" className="hover:text-secondary">
          Home
        </Link>
        <FiChevronRight className="text-[11px]" />
        <span className="text-secondary">My Bookings</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">My Bookings</h1>
          <p className="mt-2 text-[15px] text-text-muted">View and manage all your service bookings in one place.</p>
        </div>
      </div>

      {/* ─── Tabs + date ─────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary/40 bg-primary-light font-medium text-secondary'
                  : 'border-border bg-surface text-secondary hover:border-primary/40'
              }`}
            >
              {tab.label}
              <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs ${activeTab === tab.key ? 'bg-surface' : 'bg-surface-warm'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-surface pl-3">
          <FiCalendar className="text-text-muted" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Service date"
            className="bg-transparent py-2.5 pr-3 text-sm text-secondary focus:outline-none"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ─── Filters ─────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 lg:flex-row lg:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-surface-warm px-4 py-2.5">
          <FiSearch className="shrink-0 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, service, location or booking ID…"
            aria-label="Search bookings"
            className="w-full bg-transparent text-[13px] text-secondary placeholder:text-text-muted focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
          <Select value={serviceFilter} onChange={setServiceFilter} label="Service">
            <option value="all">All Services</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={areaFilter} onChange={setAreaFilter} label="Location">
            <option value="all">All Locations</option>
            {areaOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select value={sortKey} onChange={setSortKey} label="Sort by">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* ─── List ────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {error && <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}

        {!error && isLoading && Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)}

        {!error && !isLoading && visible.length === 0 && (
          <EmptyState
            icon={<FaCalendarCheck size={22} />}
            title={bookings.length === 0 ? 'No bookings yet' : 'No bookings match'}
            description={
              bookings.length === 0
                ? 'Booking requests from customers will appear here.'
                : hasFilters
                  ? 'Try a different search or clear the filters.'
                  : 'Nothing in this tab right now.'
            }
          />
        )}

        {visible.map((booking) => {
          const actions = ACTIONS[booking.status] || [];
          const primary = actions.find((a) => !a.danger);
          const hasThread = Boolean(threadFor(booking));
          const busy = updatingId === booking._id;
          return (
            <article
              key={booking._id}
              id={`item-${booking._id}`}
              className={`grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-4 transition-shadow md:grid-cols-[6rem_minmax(0,1.3fr)_minmax(0,1fr)] xl:grid-cols-[6rem_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center ${
                isHighlighted(booking._id) ? 'ring-2 ring-primary ring-offset-2' : ''
              } ${busy ? 'opacity-60' : ''}`}
            >
              <img
                src={booking.service?.images?.[0] || PLACEHOLDER_IMAGE}
                alt=""
                className="h-40 w-full rounded-xl object-cover md:h-24 md:w-24"
              />

              {/* Customer */}
              <div className="min-w-0">
                <p className="flex items-center gap-2">
                  <span className="truncate text-[16px] font-medium text-secondary">{customerName(booking)}</span>
                  {hasThread && (
                    <button
                      type="button"
                      onClick={() => message(booking)}
                      aria-label={`Message ${customerName(booking)}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border text-secondary hover:border-primary hover:text-primary"
                    >
                      <FiMessageSquare size={13} />
                    </button>
                  )}
                </p>
                {booking.customer?.phone && (
                  <a href={`tel:${booking.customer.phone}`} className="mt-1.5 flex items-center gap-2 text-[13px] text-text hover:text-primary">
                    <FiPhone className="shrink-0 text-text-muted" /> {booking.customer.phone}
                  </a>
                )}
                {booking.reference && <p className="mt-1 text-xs text-text-muted">#{booking.reference}</p>}
              </div>

              {/* Service + when */}
              <div className="min-w-0 space-y-2 text-[13px]">
                <p className="flex items-start gap-2">
                  <FiTool className="mt-0.5 shrink-0 text-text-muted" />
                  <span className="min-w-0">
                    <span className="block font-medium text-secondary">{booking.service?.title || 'Custom job'}</span>
                    {booking.service?.category?.name && <span className="block text-text-muted">{booking.service.category.name}</span>}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-text xl:hidden">
                  <FiCalendar className="shrink-0 text-text-muted" /> {formatDate(booking)}
                  {booking.bookingTime && ` · ${booking.bookingTime}`}
                </p>
              </div>

              <div className="hidden min-w-0 space-y-1.5 text-[13px] text-text xl:block">
                <p className="flex items-center gap-2">
                  <FiCalendar className="shrink-0 text-text-muted" /> {formatDate(booking)}
                </p>
                {booking.bookingTime && (
                  <p className="flex items-center gap-2">
                    <FiClock className="shrink-0 text-text-muted" /> {booking.bookingTime}
                  </p>
                )}
              </div>

              <div className="min-w-0 text-[13px] text-text md:col-start-2 xl:col-start-auto">
                {booking.address ? (
                  <p className="flex items-start gap-2">
                    <FiMapPin className="mt-0.5 shrink-0 text-text-muted" />
                    <span className="min-w-0 break-words">{booking.address}</span>
                  </p>
                ) : (
                  <p className="text-text-muted">No address yet</p>
                )}
              </div>

              {/* Price, status, actions */}
              <div className="flex flex-wrap items-center gap-3 md:col-span-2 md:justify-end xl:col-span-1 xl:flex-nowrap">
                <div className="mr-auto text-left xl:mr-2 xl:text-center">
                  <p className="text-lg font-medium text-secondary">{formatCurrency(booking.totalPrice)}</p>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex w-40 flex-col gap-2">
                  {primary ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runAction(booking, primary)}
                      className="rounded-lg bg-secondary px-4 py-2.5 text-[13px] font-medium text-white hover:bg-primary disabled:opacity-60"
                    >
                      {primary.label}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setDetail(booking)}
                    className={`rounded-lg px-4 py-2.5 text-[13px] font-medium ${
                      primary ? 'border border-border text-secondary hover:border-primary hover:text-primary' : 'bg-secondary text-white hover:bg-primary'
                    }`}
                  >
                    View Details
                  </button>
                </div>
                <RowMenu items={menuItems(booking)} />
              </div>
            </article>
          );
        })}
      </div>

      {/* ─── Details ─────────────────────────────────────────── */}
      <Modal isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.service?.title || 'Booking details'} size="lg">
        {detail && (
          <div className="min-h-0 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={detail.status} />
              <p className="text-lg font-medium text-secondary">{formatCurrency(detail.totalPrice)}</p>
            </div>
            <dl className="divide-y divide-border rounded-xl border border-border text-sm">
              {[
                { icon: FiHash, label: 'Booking ID', value: detail.reference ? `#${detail.reference}` : '—' },
                { icon: FiCalendar, label: 'Date & time', value: `${formatDate(detail, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${detail.bookingTime ? ` · ${detail.bookingTime}` : ''}` },
                { icon: FiMapPin, label: 'Location', value: detail.address || '—' },
                { icon: FiPhone, label: 'Customer', value: `${customerName(detail)}${detail.customer?.phone ? ` · ${detail.customer.phone}` : ''}` },
                { icon: FiCreditCard, label: 'Payment', value: detail.invoice ? 'Paid online (held by ServiGo)' : detail.paymentMethod === 'card' ? 'Card' : 'Cash on service' },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[1.25rem_7rem_minmax(0,1fr)] gap-3 px-4 py-3">
                  <row.icon className="mt-0.5 text-text-muted" />
                  <dt className="text-text-muted">{row.label}</dt>
                  <dd className="min-w-0 break-words text-secondary">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                <FiFileText /> Customer's notes
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-text-muted">
                {detail.notes || 'No notes were added.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(ACTIONS[detail.status] || []).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={updatingId === detail._id}
                  onClick={() => runAction(detail, action)}
                  className={`rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-60 ${
                    action.danger ? 'border border-danger/50 text-danger hover:bg-danger-light' : 'bg-secondary text-white hover:bg-primary'
                  }`}
                >
                  {action.label}
                </button>
              ))}
              {threadFor(detail) && (
                <button
                  type="button"
                  onClick={() => message(detail)}
                  className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-secondary hover:border-primary"
                >
                  <FiMessageSquare /> Message
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(declineTarget)} onClose={() => setDeclineTarget(null)} title="Decline this booking?" size="sm">
        <p className="text-sm leading-relaxed text-text-muted">
          {declineTarget?.service?.title} for {declineTarget ? customerName(declineTarget) : ''}. The customer will be notified.
          This can't be undone.
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
            disabled={updatingId !== null}
            onClick={() => applyStatus(declineTarget, 'rejected')}
            className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      </Modal>
    </ProviderLayout>
  );
}
