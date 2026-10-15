import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronRight, FiCalendar, FiClock, FiMapPin, FiTool, FiMoreVertical, FiUsers, FiThumbsUp, FiSmile } from 'react-icons/fi';
import { FaStar, FaRegStar } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { reviewService } from '@/services/reviewService';
import { chatService } from '@/services/chatService';
import EmptyState from '@/components/common/EmptyState';

const PERIODS = [
  { key: 'all', label: 'All time' },
  { key: 'month', label: 'This Month' },
  { key: '3m', label: 'Last 3 Months' },
  { key: 'year', label: 'This Year' },
];

const periodStart = (key) => {
  const now = new Date();
  if (key === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === '3m') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (key === 'year') return new Date(now.getFullYear(), 0, 1);
  return null;
};

const customerName = (r) => `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim() || 'Customer';
const formatDay = (value, utc = false) =>
  new Date(value).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric', ...(utc ? { timeZone: 'UTC' } : {}) });

function Stars({ rating, size = 'text-sm' }) {
  return (
    <span className={`flex gap-0.5 ${size}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < Math.round(rating) ? <FaStar key={i} className="text-accent" /> : <FaRegStar key={i} className="text-border" />
      )}
    </span>
  );
}

function RowMenu({ review, conversationId }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const items = [
    review.booking?._id && { label: 'View booking', onClick: () => navigate(`/provider/bookings?highlight=${review.booking._id}`) },
    conversationId && { label: 'Message customer', onClick: () => navigate(`/messages/${conversationId}`) },
    review.service?._id && { label: 'View service listing', onClick: () => navigate(`/services/${review.service._id}`) },
  ].filter(Boolean);
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
                  className="block w-full px-4 py-2.5 text-left text-sm text-secondary hover:bg-surface-warm"
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

export default function ProviderReviews() {
  const { data, isLoading, error } = useFetch(() => reviewService.getMine(), []);
  const conversationsFetch = useFetch(() => chatService.getConversations(), []);

  const [starFilter, setStarFilter] = useState('all');
  const [period, setPeriod] = useState('all');

  const conversationByCustomer = useMemo(() => {
    const map = new Map();
    (conversationsFetch.data?.data || []).forEach((c) => {
      const id = c.customer?._id || c.customer;
      if (id && !map.has(String(id))) map.set(String(id), c._id);
    });
    return map;
  }, [conversationsFetch.data]);

  // Summary and star counts follow the period; the star tabs then narrow the list.
  const start = periodStart(period);
  const inPeriod = (data?.data || []).filter((r) => !start || new Date(r.createdAt) >= start);
  const total = inPeriod.length;
  const average = total > 0 ? inPeriod.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const byStar = [5, 4, 3, 2, 1].map((star) => ({ star, count: inPeriod.filter((r) => r.rating === star).length }));
  const positive = inPeriod.filter((r) => r.rating >= 4).length;
  const visible = starFilter === 'all' ? inPeriod : inPeriod.filter((r) => r.rating === Number(starFilter));

  const tiles = [
    { label: 'Total Reviews', value: total, icon: FiUsers },
    { label: 'Positive Reviews', value: positive, icon: FiThumbsUp, hint: '4 or 5 stars' },
    { label: 'Satisfaction Rate', value: total > 0 ? `${Math.round((positive / total) * 100)}%` : '—', icon: FiSmile, hint: 'Share rated 4★ or more' },
  ];

  return (
    <ProviderLayout>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-text-muted">
        <Link to="/provider/dashboard" className="hover:text-secondary">
          Home
        </Link>
        <FiChevronRight className="text-[11px]" />
        <span className="text-secondary">Reviews</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">Reviews</h1>
          <p className="mt-2 text-[15px] text-text-muted">See what customers say about your services and performance.</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-surface pl-3 sm:self-auto">
          <FiCalendar className="text-text-muted" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Period"
            className="bg-transparent py-2.5 pr-3 text-sm text-secondary focus:outline-none"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="mt-6 rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}

      {/* ─── Summary ─────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
          <div className="shrink-0 sm:w-44 sm:border-r sm:border-border sm:pr-6">
            <p className="text-[15px] font-medium text-secondary">Overall Rating</p>
            <p className="mt-1 text-5xl font-medium text-secondary">{total > 0 ? average.toFixed(1) : '—'}</p>
            {total > 0 && <Stars rating={average} size="text-xl" />}
            <p className="mt-2 text-[13px] text-text-muted">
              {total > 0 ? `Based on ${total} ${total === 1 ? 'review' : 'reviews'}` : 'No reviews in this period'}
            </p>
          </div>
          <ul className="min-w-0 flex-1 space-y-2.5" aria-label="Rating distribution">
            {byStar.map(({ star, count }) => {
              const share = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <li key={star} className="grid grid-cols-[2.25rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-secondary">
                    {star} <FaStar className="text-xs text-secondary" />
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-warm">
                    <span className="block h-full rounded-full bg-success" style={{ width: `${share}%` }} />
                  </span>
                  <span className="text-text-muted">
                    {count} ({share}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface p-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="flex flex-col items-center justify-center rounded-xl bg-primary-light/50 px-2 py-5 text-center" title={tile.hint}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-lg text-primary">
                <tile.icon />
              </span>
              <p className="mt-3 text-2xl font-medium text-secondary">{isLoading ? '—' : tile.value}</p>
              <p className="text-[13px] text-text-muted">{tile.label}</p>
            </div>
          ))}
        </section>
      </div>

      {/* ─── Star tabs ───────────────────────────────────────── */}
      <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ key: 'all', label: 'All Reviews', count: total }, ...byStar.map((b) => ({ key: String(b.star), label: `${b.star} ${b.star === 1 ? 'Star' : 'Stars'}`, count: b.count }))].map(
          (tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStarFilter(tab.key)}
              className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm transition-colors ${
                starFilter === tab.key ? 'border-secondary bg-secondary font-medium text-white' : 'border-border bg-surface text-secondary hover:border-primary/40'
              }`}
            >
              {tab.label} <span className={starFilter === tab.key ? 'text-white/70' : 'text-text-muted'}>({tab.count})</span>
            </button>
          )
        )}
      </div>

      {/* ─── List ────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-warm" />)}

        {!isLoading && !error && visible.length === 0 && (
          <EmptyState
            icon={<FaStar size={22} />}
            title={(data?.data || []).length === 0 ? 'No reviews yet' : 'No reviews here'}
            description={
              (data?.data || []).length === 0
                ? 'Customers can review you after a job is marked completed.'
                : 'Try another star rating or a longer period.'
            }
          />
        )}

        {visible.map((review) => {
          const photo = review.customer?.profileImage;
          const booking = review.booking;
          return (
            <article
              key={review._id}
              className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,19rem)_auto] lg:items-start"
            >
              <div className="flex gap-3">
                {photo ? (
                  <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-light font-display text-xl text-primary">
                    {customerName(review).charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-secondary">{customerName(review)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                    <Stars rating={review.rating} />
                    <span className="font-medium text-secondary">{Number(review.rating).toFixed(1)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">{formatDay(review.createdAt)}</p>
                </div>
              </div>

              <p className="whitespace-pre-line text-[14px] leading-relaxed text-text">
                {review.review || <span className="italic text-text-muted">No written comment — rating only.</span>}
              </p>

              <div className="rounded-xl bg-surface-warm/70 p-3.5 text-[13px]">
                <p className="text-xs font-medium text-secondary">Booking Details</p>
                <p className="mt-2 flex items-start gap-2 font-medium text-secondary">
                  <FiTool className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    {review.service?.title || 'Custom job'}
                    {review.service?.category?.name && <span className="block text-xs font-normal text-text-muted">{review.service.category.name}</span>}
                  </span>
                </p>
                {booking?.bookingDate && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-text">
                    <span className="flex items-center gap-2">
                      <FiCalendar className="shrink-0 text-text-muted" /> {formatDay(booking.bookingDate, true)}
                    </span>
                    {booking.bookingTime && (
                      <span className="flex items-center gap-2">
                        <FiClock className="shrink-0 text-text-muted" /> {booking.bookingTime}
                      </span>
                    )}
                  </p>
                )}
                {booking?.address && (
                  <p className="mt-1.5 flex items-start gap-2 text-text">
                    <FiMapPin className="mt-0.5 shrink-0 text-text-muted" /> <span className="min-w-0 break-words">{booking.address}</span>
                  </p>
                )}
              </div>

              <div className="lg:justify-self-end">
                <RowMenu review={review} conversationId={conversationByCustomer.get(String(review.customer?._id))} />
              </div>
            </article>
          );
        })}
      </div>
    </ProviderLayout>
  );
}
