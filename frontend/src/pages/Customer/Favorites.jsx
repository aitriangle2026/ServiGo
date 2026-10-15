import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiGrid,
  FiUser,
  FiChevronRight,
  FiChevronDown,
  FiMapPin,
  FiBriefcase,
  FiCheckSquare,
  FiMoreHorizontal,
  FiHeart,
  FiArrowRight,
} from 'react-icons/fi';
import { FaHeart, FaStar, FaCheckCircle } from 'react-icons/fa';
import CustomerLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import { favoriteService } from '@/services/favoriteService';
import { chatService } from '@/services/chatService';
import { formatCurrency } from '@/utils/formatCurrency';
import EmptyState from '@/components/common/EmptyState';

const PLACEHOLDER_IMAGE = '/images/service-placeholder.jpg';

const TABS = [
  { key: 'all', label: 'All', icon: FiHeart },
  { key: 'services', label: 'Saved Services', icon: FiGrid },
  { key: 'providers', label: 'Saved Professionals', icon: FiUser },
];

const nameOf = (fav) =>
  fav.service
    ? fav.service.title || ''
    : `${fav.provider?.user?.firstName || ''} ${fav.provider?.user?.lastName || ''}`.trim() || 'Professional';

const ratingOf = (fav) => (fav.service || fav.provider)?.averageRating || 0;

const SORTS = [
  { key: 'recent', label: 'Recently Added', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  { key: 'oldest', label: 'Oldest First', compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  { key: 'name', label: 'Name (A–Z)', compare: (a, b) => nameOf(a).localeCompare(nameOf(b)) },
  { key: 'rating', label: 'Top Rated', compare: (a, b) => ratingOf(b) - ratingOf(a) },
];

function Rating({ average, total, withLabel = false }) {
  if (!total) return <span className="text-[13px] text-text-muted">No reviews yet</span>;
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-secondary">
      <FaStar className="text-accent" />
      {average.toFixed(1)}
      <span className="text-text-muted">({withLabel ? `${total} reviews` : total})</span>
    </span>
  );
}

function ServiceFavoriteCard({ fav, onRemove }) {
  const navigate = useNavigate();
  const { service } = fav;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[16/9] bg-surface-warm">
        <img src={service.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onRemove(fav)}
          aria-label={`Remove ${service.title} from favorites`}
          title="Remove from favorites"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-surface text-danger shadow-soft transition-transform hover:scale-105"
        >
          <FaHeart />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/services/${service._id}`} className="group flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-body text-[16px] font-medium text-secondary group-hover:text-primary">
            {service.title}
          </h3>
          <FiChevronRight className="mt-1 shrink-0 text-secondary group-hover:text-primary" />
        </Link>
        {service.description && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-text-muted">{service.description}</p>
        )}
        <p className="mt-3 text-[15px] text-secondary">
          From <span className="font-medium">{formatCurrency(service.price)}</span>
          {service.priceType === 'hourly' && <span className="text-text-muted"> / hr</span>}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Rating average={service.averageRating || 0} total={service.totalReviews} />
          <button
            type="button"
            onClick={() => navigate(`/book/${service._id}`)}
            className="rounded-lg bg-surface-warm px-5 py-2.5 text-[13px] font-medium text-secondary transition-colors hover:bg-secondary hover:text-white"
          >
            Book Now
          </button>
        </div>
      </div>
    </article>
  );
}

function ProviderFavoriteCard({ fav, onRemove }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { provider } = fav;
  const name = nameOf(fav);
  const photo = provider.profileImage || provider.user?.profileImage;
  const trade = (provider.categories || []).map((c) => c?.name).filter(Boolean).join(', ');
  const city = provider.workingArea?.city || provider.workingArea?.district;

  const handleChat = async () => {
    try {
      const response = await chatService.startConversation({ providerId: provider._id });
      const id = response?.data?._id;
      if (id) navigate(`/messages/${id}`);
    } catch {
      toast.error('Could not open the chat.');
    }
  };

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-4">
      <div className="flex gap-4">
        {photo ? (
          <img src={photo} alt="" className="h-32 w-28 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="grid h-32 w-28 shrink-0 place-items-center rounded-xl bg-primary-light font-display text-4xl text-primary">
            {name.charAt(0)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {provider.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-success-light px-2 py-0.5 text-[11px] font-medium text-success">
                <FaCheckCircle className="text-[10px]" /> Verified
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onRemove(fav)}
              aria-label={`Remove ${name} from favorites`}
              title="Remove from favorites"
              className="text-danger transition-transform hover:scale-110"
            >
              <FaHeart />
            </button>
          </div>

          <div className="mt-1.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-body text-[17px] font-medium text-secondary">{name}</h3>
              {trade && <p className="truncate text-[13px] text-text-muted">{trade}</p>}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="More actions"
                aria-expanded={menuOpen}
                className="grid h-7 w-7 place-items-center rounded-full text-secondary hover:bg-surface-warm"
              >
                <FiMoreHorizontal />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <ul className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          handleChat();
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-secondary hover:bg-surface-warm"
                      >
                        Message
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRemove(fav);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-warm"
                      >
                        Remove from favorites
                      </button>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <ul className="mt-2 space-y-1.5 text-[13px] text-text">
            <li>
              <Rating average={provider.averageRating || 0} total={provider.totalReviews} withLabel />
            </li>
            {city && (
              <li className="flex items-center gap-1.5">
                <FiMapPin className="shrink-0 text-text-muted" />
                <span className="truncate capitalize">{city}</span>
              </li>
            )}
            {provider.experience > 0 && (
              <li className="flex items-center gap-1.5">
                <FiBriefcase className="shrink-0 text-text-muted" />
                {provider.experience} {provider.experience === 1 ? 'year' : 'years'} experience
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <FiCheckSquare className="shrink-0 text-text-muted" />
              {provider.completedJobs || 0} completed {provider.completedJobs === 1 ? 'job' : 'jobs'}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate(`/providers/${provider._id}`)}
          className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          View Profile
        </button>
        {/* A professional can offer several services, so booking starts on
            their profile where the customer picks which one. */}
        <button
          type="button"
          onClick={() => navigate(`/providers/${provider._id}#services`)}
          className="rounded-lg bg-secondary px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary"
        >
          Book Now
        </button>
      </div>
    </article>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-4 sm:p-5">
      <h2 className="mb-4 font-body text-lg font-medium text-secondary">
        {title} ({count})
      </h2>
      {children}
    </section>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetch(() => favoriteService.getMyFavorites(), []);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);
  // Removed rows disappear straight away; they come back if the server refuses.
  const [removedIds, setRemovedIds] = useState(() => new Set());

  const favorites = useMemo(
    () => (data?.data || []).filter((f) => (f.service || f.provider) && !removedIds.has(f._id)),
    [data, removedIds]
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const sort = SORTS.find((s) => s.key === sortKey);
    return favorites.filter((f) => !needle || nameOf(f).toLowerCase().includes(needle)).sort(sort.compare);
  }, [favorites, search, sortKey]);

  const services = visible.filter((f) => f.service);
  const providers = visible.filter((f) => f.provider);
  const totalServices = favorites.filter((f) => f.service).length;
  const totalProviders = favorites.length - totalServices;
  const counts = { all: favorites.length, services: totalServices, providers: totalProviders };

  const handleRemove = async (fav) => {
    setRemovedIds((current) => new Set(current).add(fav._id));
    try {
      await favoriteService.remove(fav._id);
      toast.success(`Removed ${nameOf(fav)} from favorites`);
    } catch {
      setRemovedIds((current) => {
        const next = new Set(current);
        next.delete(fav._id);
        return next;
      });
      toast.error('Could not remove that favorite.');
    }
  };

  const showServices = activeTab !== 'providers' && services.length > 0;
  const showProviders = activeTab !== 'services' && providers.length > 0;
  const activeSort = SORTS.find((s) => s.key === sortKey);

  return (
    <CustomerLayout>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-medium leading-tight text-secondary sm:text-5xl">
            My Favorites
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">Your saved services and professionals for quick access.</p>
        </div>
        <label className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 lg:mt-2 lg:max-w-md">
          <FiSearch className="shrink-0 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your favorites..."
            aria-label="Search your favorites"
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
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-secondary font-medium text-white'
                  : 'bg-surface-warm text-secondary hover:bg-border/60'
              }`}
            >
              <tab.icon /> {tab.label} ({counts[tab.key]})
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
              <ul className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
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

      <div className="mt-6 space-y-5">
        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
            {error}
          </div>
        )}

        {!error && isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-surface-warm" />
            ))}
          </div>
        )}

        {!error && !isLoading && favorites.length === 0 && (
          <EmptyState
            icon={<FaHeart size={22} />}
            title="No favorites yet"
            description="Save services or providers you like to find them here later."
            actionLabel="Browse services"
            onAction={() => navigate('/services')}
          />
        )}

        {!error && !isLoading && favorites.length > 0 && !showServices && !showProviders && (
          <p className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-muted">
            {search ? 'Nothing in your favorites matches that search.' : 'Nothing saved in this group yet.'}
          </p>
        )}

        {showServices && (
          <Section title="Saved Services" count={services.length}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {services.map((fav) => (
                <ServiceFavoriteCard key={fav._id} fav={fav} onRemove={handleRemove} />
              ))}
            </div>
          </Section>
        )}

        {showProviders && (
          <Section title="Saved Professionals" count={providers.length}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {providers.map((fav) => (
                <ProviderFavoriteCard key={fav._id} fav={fav} onRemove={handleRemove} />
              ))}
            </div>
          </Section>
        )}

        {/* ─── CTA ───────────────────────────────────────────────── */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-4 rounded-2xl bg-surface-warm p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-light text-xl text-primary">
                <FiHeart />
              </span>
              <div>
                <p className="text-[15px] font-medium text-secondary">Save your favorite services and professionals</p>
                <p className="mt-0.5 text-[13px] text-text-muted">
                  Quickly access them anytime and book again with just a few clicks.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary"
            >
              Explore More Services <FiArrowRight />
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
