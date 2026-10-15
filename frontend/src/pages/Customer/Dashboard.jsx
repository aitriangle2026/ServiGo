import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiMapPin,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiArrowRight,
  FiMessageSquare,
  FiCheckCircle,
  FiCreditCard,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { FaBolt, FaFaucet, FaBroom, FaCarSide, FaHammer, FaBookOpen, FaHeart } from 'react-icons/fa';
import DashboardLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import { bookingService } from '@/services/bookingService';
import { favoriteService } from '@/services/favoriteService';
import { serviceService } from '@/services/serviceService';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { getNotificationMeta, TONE_CLASSES } from '@/utils/notificationMeta';
import { formatRelativeTime } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import BookingCard from '@/components/cards/BookingCard';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import heroImage from '/images/dashboard-hero.webp';

const PLACEHOLDER_IMAGE = '/images/service-placeholder.jpg';
const UPCOMING_STATUSES = ['pending', 'accepted', 'on_the_way'];

const CITIES = ['All cities', 'Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];

// Same quick picks as the homepage hero.
const QUICK_CATEGORIES = [
  { label: 'Electrician', icon: FaBolt, query: 'electrician' },
  { label: 'Plumber', icon: FaFaucet, query: 'plumber' },
  { label: 'Cleaner', icon: FaBroom, query: 'cleaning' },
  { label: 'Mechanic', icon: FaCarSide, query: 'mechanic' },
  { label: 'Carpenter', icon: FaHammer, query: 'carpenter' },
  { label: 'Tutor', icon: FaBookOpen, query: 'tutor' },
];

const STATUS_BADGES = {
  pending: { label: 'Pending', variant: 'accent' },
  accepted: { label: 'Confirmed', variant: 'success' },
  on_the_way: { label: 'On the way', variant: 'primary' },
};

const greetingFor = (hour) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

const fullName = (user) => `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
const serviceImage = (service) => service?.images?.[0] || PLACEHOLDER_IMAGE;
const idOf = (value) => (typeof value === 'object' && value !== null ? value._id : value);

/**
 * The booking to surface in "Your next booking": the soonest dated one from
 * today on, then any still-open booking without a slot yet (invoice-driven
 * bookings are scheduled over chat).
 */
function pickNextBooking(bookings) {
  const open = bookings.filter((b) => UPCOMING_STATUSES.includes(b.status));
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const dated = open
    .filter((b) => b.bookingDate && new Date(b.bookingDate) >= startOfToday)
    .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));

  return dated[0] || open.find((b) => !b.bookingDate) || null;
}

/**
 * Categories the customer has shown interest in, most-used first — from the
 * services they've booked and the services they've saved. There's no
 * recommendation engine; this is the honest version of "for you".
 */
function interestCategories(bookings, favorites) {
  const counts = new Map();
  const bump = (category) => {
    const id = idOf(category);
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  };
  bookings.forEach((b) => bump(b.service?.category));
  favorites.forEach((f) => bump(f.service?.category));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

function SectionCard({ title, viewAllTo, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-[1.35rem] text-secondary">{title}</h2>
        {viewAllTo && (
          <Link
            to={viewAllTo}
            className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary"
          >
            View all <FiArrowRight />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ServiceTile({ service }) {
  return (
    <Link
      to={`/services/${service._id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-soft"
    >
      <div className="aspect-[4/3.4] overflow-hidden bg-surface-warm">
        <img
          src={serviceImage(service)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-secondary">{service.title}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="truncate text-xs text-text-muted">From {formatCurrency(service.price)}</span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-secondary transition-colors group-hover:border-primary group-hover:text-primary">
            <FiArrowRight className="text-xs" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function TileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-xl bg-surface-warm" />
      ))}
    </div>
  );
}

function ProviderPhoto({ provider }) {
  const name = fullName(provider?.user);
  if (provider?.profileImage) {
    return <img src={provider.profileImage} alt={name} className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover" />;
  }
  return (
    <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-xl bg-primary-light font-display text-2xl text-primary">
      {(name || 'P').charAt(0)}
    </span>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Colombo');
  const [cityOpen, setCityOpen] = useState(false);
  const [savedTab, setSavedTab] = useState('services');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // GET /bookings/customer
  const { data, isLoading, error } = useFetch(() => bookingService.getMyBookings(), []);
  const favoritesFetch = useFetch(() => favoriteService.getMyFavorites(), []);
  // Reviews are left by customers after a completed job, so the review count
  // is the closest real measure of how often a service gets booked.
  const popularFetch = useFetch(
    () => serviceService.search({ sort: '-totalReviews -averageRating', limit: 3 }),
    []
  );

  const bookings = useMemo(() => data?.data || [], [data]);
  const favorites = useMemo(() => favoritesFetch.data?.data || [], [favoritesFetch.data]);
  const upcoming = bookings.filter((b) => UPCOMING_STATUSES.includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const totalSpent = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const nextBooking = pickNextBooking(bookings);

  const savedServices = favorites.filter((f) => f.service);
  const savedProviders = favorites.filter((f) => f.provider);

  // ── Recommended ────────────────────────────────────────────────────
  // Waits for bookings + favorites, then pulls top-rated services from the
  // customer's own categories. With no history at all it falls back to
  // top-rated overall and says so in the heading.
  const historyReady = !isLoading && !favoritesFetch.isLoading;
  const categories = useMemo(() => interestCategories(bookings, favorites), [bookings, favorites]);
  const bookedServiceIds = useMemo(
    () => new Set(bookings.map((b) => idOf(b.service)).filter(Boolean)),
    [bookings]
  );
  const categoryKey = categories.slice(0, 3).join(',');

  const recommendedFetch = useFetch(async () => {
    if (!historyReady) return null;
    const ids = categoryKey ? categoryKey.split(',') : [];

    if (ids.length > 0) {
      const results = await Promise.all(
        ids.map((category) => serviceService.search({ category, sort: '-averageRating', limit: 6 }))
      );
      const seen = new Set();
      const picks = results
        .flatMap((r) => r?.data || [])
        .filter((s) => !bookedServiceIds.has(s._id) && !seen.has(s._id) && seen.add(s._id));
      if (picks.length > 0) return { personalised: true, services: picks.slice(0, 3) };
    }

    const top = await serviceService.search({ sort: '-averageRating', limit: 3 });
    return { personalised: false, services: top?.data || [] };
  }, [historyReady, categoryKey]);

  const recommended = recommendedFetch.data;
  const popularServices = popularFetch.data?.data || [];

  // ── Handlers ───────────────────────────────────────────────────────
  const goToSearch = (searchQuery = query) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    params.set('city', city);
    navigate(`/services?${params.toString()}`);
  };

  const handleChat = async () => {
    if (!nextBooking) return;
    setIsChatLoading(true);
    try {
      const response = await chatService.startConversation({
        providerId: nextBooking.provider?._id,
        serviceId: nextBooking.service?._id,
      });
      const conversationId = response?.data?._id;
      if (conversationId) navigate(`/messages/${conversationId}`);
      else setIsChatLoading(false);
    } catch {
      setIsChatLoading(false);
    }
  };

  const handleUnsave = async (favoriteId) => {
    await favoriteService.remove(favoriteId);
    favoritesFetch.refetch();
  };

  const handleActivityClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const stats = [
    { label: 'Upcoming bookings', value: upcoming.length, icon: FiCalendar },
    { label: 'Jobs completed', value: completed.length, icon: FiCheckCircle },
    { label: 'Total spent', value: formatCurrency(totalSpent), icon: FiCreditCard },
  ];

  const nextStatus = nextBooking ? STATUS_BADGES[nextBooking.status] || STATUS_BADGES.pending : null;
  const recentActivity = notifications.slice(0, 5);
  const savedList = savedTab === 'services' ? savedServices : savedProviders;

  return (
    <DashboardLayout fullBleed>
      {/* ═══ Hero ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-surface-warm">
        {/* Photo and scrim share this one box (README page conventions). */}
        <div className="pointer-events-none absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-warm via-surface-warm/80 via-40% to-surface-warm/0 to-75%" />
        </div>

        <div className="relative flex flex-col gap-8 px-4 pb-10 pt-10 sm:px-6 lg:px-10 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 xl:max-w-[640px] xl:flex-1">
            <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Welcome back
              <span className="hidden h-px w-14 bg-border sm:block" />
            </p>
            <h1 className="mt-4 font-display text-[2.4rem] font-medium leading-[1.05] text-secondary sm:text-[3.2rem]">
              {greetingFor(new Date().getHours())},
              <br />
              <em className="font-normal italic text-primary">{user?.firstName || 'there'}.</em>{' '}
              <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-4 text-[17px] text-text-muted">What would you like to get done today?</p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                goToSearch();
              }}
              className="mt-7 flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-soft-lg"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <FiSearch className="shrink-0 text-text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for a service (e.g. electrician, cleaning, AC repair...)"
                  aria-label="Search for a service"
                  className="w-full bg-transparent py-2.5 text-sm text-secondary placeholder:text-text-muted focus:outline-none"
                />
              </div>

              <div className="hidden h-7 w-px shrink-0 bg-border sm:block" />

              <div className="relative hidden shrink-0 sm:block">
                <button
                  type="button"
                  onClick={() => setCityOpen((open) => !open)}
                  aria-expanded={cityOpen}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary"
                >
                  <FiMapPin className="text-text-muted" />
                  {city}
                  <FiChevronDown className="ml-4 text-text-muted" />
                </button>
                {cityOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCityOpen(false)} />
                    <ul className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-soft-lg">
                      {CITIES.map((option) => (
                        <li key={option}>
                          <button
                            type="button"
                            onClick={() => {
                              setCity(option);
                              setCityOpen(false);
                            }}
                            className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-warm ${
                              option === city ? 'font-semibold text-primary' : 'text-secondary'
                            }`}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <button
                type="submit"
                aria-label="Search services"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-white transition-colors hover:bg-primary"
              >
                <FiSearch />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-4 sm:gap-x-7">
              {QUICK_CATEGORIES.map((category) => (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => goToSearch(category.query)}
                  className="group flex w-16 flex-col items-center gap-2"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface text-secondary transition-colors group-hover:border-primary group-hover:text-primary">
                    <category.icon className="text-[16px]" />
                  </span>
                  <span className="text-xs text-text-muted group-hover:text-secondary">{category.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="group flex w-16 flex-col items-center gap-2"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface text-secondary transition-colors group-hover:border-primary group-hover:text-primary">
                  <FiMoreHorizontal className="text-[18px]" />
                </span>
                <span className="text-xs text-text-muted group-hover:text-secondary">More</span>
              </button>
            </div>
          </div>

          {/* The customer's own numbers — real, unlike the homepage's
              marketplace-wide figures. */}
          <aside className="w-full shrink-0 rounded-2xl bg-surface/90 p-5 shadow-soft-lg backdrop-blur sm:max-w-sm xl:w-72">
            <Link to="/customer/bookings" className="group flex items-center gap-3 border-b border-border pb-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
                <FiCalendar />
              </span>
              <span className="flex-1 font-display text-[15px] leading-snug text-secondary">
                Your ServiGo at a glance
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-secondary group-hover:border-primary group-hover:text-primary">
                <FiArrowRight />
              </span>
            </Link>
            <dl>
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 border-b border-border py-3.5 last:border-b-0 last:pb-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-secondary">
                    <stat.icon />
                  </span>
                  <div className="min-w-0">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="truncate text-[17px] font-medium text-secondary">
                      {isLoading ? '—' : stat.value}
                    </dd>
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
            {error}
          </div>
        )}

        {/* ═══ Row 1: next booking + recommended ════════════════════ */}
        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SectionCard title="Your next booking">
            {isLoading && <div className="h-56 animate-pulse rounded-xl bg-surface-warm" />}

            {!isLoading && !nextBooking && (
              <EmptyState
                icon={<FiCalendar size={22} />}
                title="Nothing booked yet"
                description="Your next confirmed job will show up here with its time, address and provider."
                actionLabel="Browse services"
                onAction={() => navigate('/services')}
              />
            )}

            {!isLoading && nextBooking && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="flex min-w-0 flex-col">
                  <div className="flex gap-4">
                    <ProviderPhoto provider={nextBooking.provider} />
                    <div className="min-w-0">
                      <Badge variant={nextStatus.variant} className="!px-2.5 !py-0.5 !text-[11px]">
                        {nextStatus.label}
                      </Badge>
                      <h3 className="mt-2 font-display text-lg leading-snug text-secondary">
                        {nextBooking.service?.title || 'Service'}
                      </h3>
                      <p className="text-sm text-text-muted">
                        with {fullName(nextBooking.provider?.user) || 'your provider'}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm text-text">
                    <li className="flex items-center gap-3">
                      <FiCalendar className="shrink-0 text-text-muted" />
                      {nextBooking.bookingDate
                        ? new Date(nextBooking.bookingDate).toLocaleDateString('en-LK', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'To be scheduled'}
                    </li>
                    {nextBooking.bookingTime && (
                      <li className="flex items-center gap-3">
                        <FiClock className="shrink-0 text-text-muted" />
                        {nextBooking.bookingTime}
                      </li>
                    )}
                    {nextBooking.address && (
                      <li className="flex items-start gap-3">
                        <FiMapPin className="mt-0.5 shrink-0 text-text-muted" />
                        <span className="min-w-0 break-words">{nextBooking.address}</span>
                      </li>
                    )}
                  </ul>

                  <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => navigate(`/customer/bookings?highlight=${nextBooking._id}`)}
                      className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={handleChat}
                      disabled={isChatLoading}
                      className="flex items-center justify-center gap-2 rounded-xl border border-secondary px-4 py-3 text-sm font-medium text-secondary transition-colors hover:bg-surface-warm disabled:opacity-60"
                    >
                      <FiMessageSquare /> {isChatLoading ? 'Opening…' : 'Chat with Provider'}
                    </button>
                  </div>
                </div>

                <div className="hidden min-h-[240px] overflow-hidden rounded-xl bg-surface-warm md:block">
                  <img src={serviceImage(nextBooking.service)} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={recommended && !recommended.personalised ? 'Top rated for you' : 'Recommended for you'}
            viewAllTo="/services"
          >
            {(!recommended || recommendedFetch.isLoading) && !recommendedFetch.error && <TileGridSkeleton />}
            {recommendedFetch.error && <p className="text-sm text-text-muted">Couldn’t load suggestions.</p>}
            {recommended && !recommendedFetch.isLoading && recommended.services.length === 0 && (
              <p className="text-sm text-text-muted">No services available in your area yet.</p>
            )}
            {recommended && !recommendedFetch.isLoading && recommended.services.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recommended.services.map((service) => (
                  <ServiceTile key={service._id} service={service} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ═══ Row 2: activity · popular · saved ════════════════════ */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
          <SectionCard title="Recent activity" viewAllTo="/customer/notifications">
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                Bookings, payments and reviews will show up here.
              </p>
            ) : (
              <ol className="relative">
                {recentActivity.map((n) => {
                  const { icon: Icon, tone } = getNotificationMeta(n.type);
                  return (
                    <li key={n._id} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleActivityClick(n)}
                        className="flex w-full items-start gap-3 py-3 text-left"
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${TONE_CLASSES[tone]}`}>
                          <Icon size={13} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[13px] text-secondary ${n.isRead ? '' : 'font-semibold'}`}>
                            {n.title}
                          </span>
                          <span className="block truncate text-xs text-text-muted">{n.message}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-text-muted">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>

          <SectionCard title="Popular services" viewAllTo="/services">
            {popularFetch.isLoading && <TileGridSkeleton />}
            {!popularFetch.isLoading && popularServices.length === 0 && (
              <p className="text-sm text-text-muted">No services available in your area yet.</p>
            )}
            {!popularFetch.isLoading && popularServices.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {popularServices.map((service) => (
                  <ServiceTile key={service._id} service={service} />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Saved services & professionals" viewAllTo="/customer/favorites" className="xl:col-span-2 2xl:col-span-1">
            <div className="mb-4 flex gap-1 rounded-xl bg-surface-warm p-1">
              {[
                { key: 'services', label: 'Saved Services', count: savedServices.length },
                { key: 'providers', label: 'Saved Professionals', count: savedProviders.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSavedTab(tab.key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    savedTab === tab.key ? 'bg-surface text-secondary shadow-soft' : 'text-text-muted hover:text-secondary'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {favoritesFetch.isLoading && <div className="h-40 animate-pulse rounded-xl bg-surface-warm" />}

            {!favoritesFetch.isLoading && savedList.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted">
                {savedTab === 'services'
                  ? 'Tap the heart on any service to save it here.'
                  : 'Save a professional from their profile to find them here.'}
              </p>
            )}

            {!favoritesFetch.isLoading && savedList.length > 0 && (
              <ul className="space-y-3">
                {savedList.slice(0, 3).map((fav) => {
                  const isService = Boolean(fav.service);
                  const providerName = fullName(fav.provider?.user) || 'Professional';
                  return (
                    <li key={fav._id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                      {isService ? (
                        <img src={serviceImage(fav.service)} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                      ) : fav.provider?.profileImage ? (
                        <img src={fav.provider.profileImage} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-primary-light font-display text-xl text-primary">
                          {providerName.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-secondary">
                          {isService ? fav.service.title : providerName}
                        </p>
                        <p className="mt-1 truncate text-xs text-text-muted">
                          {isService
                            ? `From ${formatCurrency(fav.service.price)}`
                            : fav.provider?.experience
                              ? `${fav.provider.experience} yrs experience`
                              : 'Saved professional'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnsave(fav._id)}
                        aria-label="Remove from saved"
                        title="Remove from saved"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger-light text-danger transition-opacity hover:opacity-80"
                      >
                        <FaHeart className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(isService ? `/book/${fav.service._id}` : `/providers/${fav.provider._id}`)
                        }
                        className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                      >
                        {isService ? 'Book Now' : 'View'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* ═══ Recent bookings (kept from the previous dashboard) ═══ */}
        <SectionCard title="Recent bookings" viewAllTo="/customer/bookings">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          )}
          {!isLoading && !error && bookings.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">
              Once you book a service, it’ll show up here so you can track it.
            </p>
          )}
          {!isLoading && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.slice(0, 6).map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
