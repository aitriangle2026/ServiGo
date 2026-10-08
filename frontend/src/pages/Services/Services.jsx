import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaTools,
  FaThLarge,
  FaList,
  FaChevronDown,
  FaSlidersH,
  FaTimes,
  FaClipboardCheck,
  FaDownload,
  FaWrench,
  FaCog,
  FaSearch,
  FaBroom,
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import ServicesHero from './sections/ServicesHero';
import CategoryTabs from './sections/CategoryTabs';
import { CATEGORY_GROUPS } from './categoryGroups';
import FeaturedPromos from './sections/FeaturedPromos';
import ServiceGridCard from '@/components/cards/ServiceGridCard';
import FilterSidebar, { ALL_CITIES } from '@/components/common/FilterSidebar';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';

import { serviceService } from '@/services/serviceService';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'today', label: 'Available Today', dot: 'bg-success' },
  { value: 'tomorrow', label: 'Available Tomorrow', dot: 'bg-accent' },
  { value: 'flexible', label: 'Flexible', dot: 'bg-border' },
];

const SERVICE_TYPE_SECTION = {
  key: 'serviceTypes',
  title: 'Service Type',
  icon: FaClipboardCheck,
  options: [
    { value: 'installation', label: 'Installation', icon: FaDownload },
    { value: 'repair', label: 'Repair', icon: FaWrench },
    { value: 'maintenance', label: 'Maintenance', icon: FaCog },
    { value: 'inspection', label: 'Inspection', icon: FaSearch },
    { value: 'cleaning', label: 'Cleaning', icon: FaBroom },
  ],
};

const DEFAULT_FILTERS = {
  city: ALL_CITIES,
  radius: 'Within 10 km',
  categories: [],
  maxPrice: 20000,
  rating: '',
  availability: [],
  serviceTypes: [],
};

const Services = () => {
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || ALL_CITIES);

  // `filters` is what the sidebar edits; `appliedFilters` is what the query
  // actually runs on. They diverge until "Apply Filters" is pressed, so
  // ticking five boxes doesn't fire five requests.
  const initialFilters = {
    ...DEFAULT_FILTERS,
    city: searchParams.get('city') || ALL_CITIES,
  };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [activeGroup, setActiveGroup] = useState('all');
  const [sort, setSort] = useState('popular');
  const [view, setView] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const resultsRef = useRef(null);

  // Brings the results into view after a filter is applied, so the effect of
  // the change is visible instead of happening somewhere off screen.
  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    serviceService
      .getCategories()
      .then((response) => {
        const payload = response?.data ?? response;
        const list = payload?.categories ?? payload ?? [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => setCategories([]));
  }, []);

  const fetchServices = useCallback(
    async (pageNumber, isAppend = false) => {
      if (isAppend) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      try {
        const response = await serviceService.search({
          query: appliedSearch || undefined,
          // The sidebar allows several categories; the API takes one, so the
          // remainder are narrowed client-side below.
          category: appliedFilters.categories?.[0] || undefined,
          location:
            appliedFilters.city && appliedFilters.city !== ALL_CITIES
              ? appliedFilters.city
              : undefined,
          maxPrice: appliedFilters.maxPrice || undefined,
          rating: appliedFilters.rating || undefined,
          sort,
          page: pageNumber,
          limit: PAGE_SIZE,
        });

        const list = response?.data ?? [];
        setServices((prev) => (isAppend ? [...prev, ...list] : list));
        setTotalPages(response?.totalPages ?? 1);
        setTotal(response?.total ?? list.length);
        setPage(pageNumber);
      } catch {
        setError('Something went wrong while loading services. Please try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [appliedSearch, appliedFilters, sort]
  );

  useEffect(() => {
    // Queued off the effect's commit path: fetchServices flips isLoading on
    // immediately, and doing that during commit cascades an extra render
    // before the request has even started.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) fetchServices(1, false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchServices]);

  // The category tabs are broad groupings rather than real category ids, so
  // they narrow the loaded page by category name instead of hitting the API.
  const visibleServices = useMemo(() => {
    const group = CATEGORY_GROUPS.find((entry) => entry.key === activeGroup);
    if (!group?.match) return services;

    return services.filter((service) => {
      const name = (service.category?.name || '').toLowerCase();
      return group.match.some((token) => name.includes(token));
    });
  }, [services, activeGroup]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setCity(filters.city);
    setMobileFiltersOpen(false);
    scrollToResults();
  };

  const handleClearFilters = () => {
    const cleared = { ...DEFAULT_FILTERS, city };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setActiveGroup('all');
    setQuery('');
    setAppliedSearch('');
  };

  const handleGroupChange = (key) => {
    setActiveGroup(key);
    scrollToResults();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        {/* ─── Filters rail ─────────────────────────────────────────
            Full height beside the content rather than stacked above it, so
            the catalogue starts at the top of the page. */}
        {/* Height excludes the sticky navbar (lg:h-20) — a plain h-screen
            starts below it and so runs past the viewport, pushing the
            pinned "Apply Filters" button out of reach. */}
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-[17.5rem] shrink-0 border-r border-border lg:block">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
            onApply={handleApplyFilters}
            availabilityOptions={AVAILABILITY_OPTIONS}
            extraSection={SERVICE_TYPE_SECTION}
          />
        </aside>

        <main className="min-w-0 flex-1">
          <ServicesHero
            query={query}
            onQueryChange={setQuery}
            city={city}
            onCityChange={(next) => {
              setCity(next);
              setFilters((current) => ({ ...current, city: next }));
              setAppliedFilters((current) => ({ ...current, city: next }));
            }}
            onSubmit={() => {
              setAppliedSearch(query.trim());
              scrollToResults();
            }}
          />

          <CategoryTabs active={activeGroup} onChange={handleGroupChange} />

          <div className="space-y-10 px-6 pb-20 lg:px-10">
            {/* Filters live in a slide-over below the lg breakpoint, where a
                permanent rail would leave no room for the results. */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 text-[13px] font-semibold text-secondary shadow-soft lg:hidden"
            >
              <FaSlidersH className="text-xs text-text-muted" />
              Filters
            </button>

            <FeaturedPromos
              onSelect={(next) => {
                setQuery(next);
                setAppliedSearch(next);
                scrollToResults();
              }}
            />

            <section ref={resultsRef} className="scroll-mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex flex-wrap items-baseline gap-2.5 font-display text-[1.35rem] font-medium text-secondary">
                  All Services
                  {!isLoading && (
                    <span className="text-[12.5px] font-normal text-text-muted">
                      ({total} {total === 1 ? 'service' : 'services'} available)
                    </span>
                  )}
                </h2>

                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-2 text-[12.5px] text-text-muted">
                    Sort by
                    <div className="relative">
                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="appearance-none rounded-xl border border-border bg-surface py-2 pl-3 pr-8 text-[12.5px] text-secondary focus:border-primary focus:outline-none"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-text-muted" />
                    </div>
                  </label>

                  <div className="flex overflow-hidden rounded-xl border border-border">
                    {[
                      { key: 'grid', icon: FaThLarge, label: 'Grid view' },
                      { key: 'list', icon: FaList, label: 'List view' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setView(option.key)}
                        aria-label={option.label}
                        aria-pressed={view === option.key}
                        className={`grid h-9 w-9 place-items-center transition-colors ${
                          view === option.key
                            ? 'bg-primary text-white'
                            : 'bg-surface text-text-muted hover:text-secondary'
                        }`}
                      >
                        <option.icon className="text-[12px]" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-danger/20 bg-danger-light p-5 text-center text-sm text-danger">
                  {error}
                </div>
              )}

              {!error && isLoading && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <ServiceCardSkeleton key={index} />
                  ))}
                </div>
              )}

              {!error && !isLoading && visibleServices.length === 0 && (
                <div className="mt-5">
                  <EmptyState
                    icon={<FaTools size={22} />}
                    title="No services match your search"
                    description="Try a different keyword, or clear your filters to see everything available."
                    actionLabel="Clear filters"
                    onAction={handleClearFilters}
                  />
                </div>
              )}

              {!error && !isLoading && visibleServices.length > 0 && (
                <>
                  <div
                    className={`mt-5 grid gap-4 ${
                      view === 'grid'
                        ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                        : 'grid-cols-1'
                    }`}
                  >
                    {visibleServices.map((service, index) => (
                      <ServiceGridCard
                        key={service._id || service.id}
                        service={service}
                        index={index}
                        view={view}
                      />
                    ))}
                  </div>

                  {page < totalPages && activeGroup === 'all' && (
                    <div className="mt-10 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchServices(page + 1, true)}
                        isLoading={isLoadingMore}
                      >
                        Load more services
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* ─── Mobile filters slide-over ──────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[85vw] flex-col bg-surface shadow-soft-lg">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close filters"
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-full text-text-muted hover:bg-surface-warm hover:text-secondary"
            >
              <FaTimes className="text-xs" />
            </button>

            <FilterSidebar
              categories={categories}
              filters={filters}
              onChange={setFilters}
              onClear={handleClearFilters}
              onApply={handleApplyFilters}
              availabilityOptions={AVAILABILITY_OPTIONS}
              extraSection={SERVICE_TYPE_SECTION}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
