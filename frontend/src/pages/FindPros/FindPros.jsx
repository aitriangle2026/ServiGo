import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaUserFriends,
  FaThLarge,
  FaList,
  FaChevronDown,
  FaSlidersH,
  FaTimes,
  FaRegMap,
  FaUser,
  FaBuilding,
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import FindProsHero from './sections/FindProsHero';
import ProviderGridCard from '@/components/cards/ProviderGridCard';
import FilterSidebar, { ALL_CITIES } from '@/components/common/FilterSidebar';
import ProviderCardSkeleton from '@/components/common/ProviderCardSkeleton';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';

import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'experience', label: 'Most Experienced' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'today', label: 'Available Today', dot: 'bg-success' },
  { value: 'week', label: 'Available This Week', dot: 'bg-accent' },
  { value: 'flexible', label: 'Flexible', dot: 'bg-border' },
];

const PRO_TYPE_SECTION = {
  key: 'proTypes',
  title: 'Pro Type',
  icon: FaUserFriends,
  options: [
    { value: 'individual', label: 'Individual', icon: FaUser },
    { value: 'company', label: 'Company', icon: FaBuilding },
  ],
};

const DEFAULT_FILTERS = {
  city: ALL_CITIES,
  radius: 'Within 10 km',
  categories: [],
  maxPrice: 20000,
  rating: '',
  availability: [],
  proTypes: [],
};

const FindPros = () => {
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || ALL_CITIES);

  // `filters` is what the sidebar edits; `appliedFilters` is what the query
  // runs on. They diverge until "Apply Filters" is pressed, so ticking
  // several boxes doesn't fire several requests.
  const initialFilters = {
    ...DEFAULT_FILTERS,
    city: searchParams.get('city') || ALL_CITIES,
  };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [sort, setSort] = useState('relevant');
  const [view, setView] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
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

  const fetchProviders = useCallback(
    async (pageNumber, isAppend = false) => {
      if (isAppend) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      try {
        const response = await providerService.search({
          search: appliedSearch || undefined,
          // The sidebar allows several categories; the API takes one, so the
          // remainder are narrowed client-side.
          category: appliedFilters.categories?.[0] || undefined,
          location:
            appliedFilters.city && appliedFilters.city !== ALL_CITIES
              ? appliedFilters.city
              : undefined,
          rating: appliedFilters.rating || undefined,
          sort,
          page: pageNumber,
          limit: PAGE_SIZE,
        });

        const list = response?.data ?? [];
        setProviders((prev) => (isAppend ? [...prev, ...list] : list));
        setTotalPages(response?.totalPages ?? 1);
        setTotal(response?.total ?? list.length);
        setPage(pageNumber);
      } catch {
        setError('Something went wrong while loading professionals. Please try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [appliedSearch, appliedFilters, sort]
  );

  useEffect(() => {
    // Queued off the effect's commit path: fetchProviders flips isLoading on
    // immediately, and doing that during commit cascades an extra render
    // before the request has even started.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) fetchProviders(1, false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchProviders]);

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
    setQuery('');
    setAppliedSearch('');
  };

  const handlePopularSelect = (term) => {
    setQuery(term);
    setAppliedSearch(term);
    scrollToResults();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        {/* Height excludes the sticky navbar (lg:h-20) so the pinned
            "Apply Filters" button stays inside the viewport. */}
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-[17.5rem] shrink-0 border-r border-border lg:block">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
            onApply={handleApplyFilters}
            availabilityOptions={AVAILABILITY_OPTIONS}
            extraSection={PRO_TYPE_SECTION}
          />
        </aside>

        <main className="min-w-0 flex-1">
          <FindProsHero
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
            onPopularSelect={handlePopularSelect}
          />

          <div className="px-6 pb-20 pt-8 lg:px-10">
            {/* Filters live in a slide-over below lg, where a permanent rail
                would leave no room for results. */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-surface px-5 py-3 text-[13px] font-semibold text-secondary shadow-soft lg:hidden"
            >
              <FaSlidersH className="text-xs text-text-muted" />
              Filters
            </button>

            <section ref={resultsRef} className="scroll-mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[1.45rem] font-medium text-secondary">
                  {isLoading ? 'Finding professionals…' : `${total} Professionals found`}
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

                  <button
                    type="button"
                    disabled
                    title="Map view needs provider coordinates, which aren't captured yet"
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-[12.5px] font-medium text-text-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaRegMap className="text-[12px]" />
                    View on Map
                  </button>
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
                    <ProviderCardSkeleton key={index} />
                  ))}
                </div>
              )}

              {!error && !isLoading && providers.length === 0 && (
                <div className="mt-5">
                  <EmptyState
                    icon={<FaUserFriends size={22} />}
                    title="No professionals match your search"
                    description="Try a different keyword, or clear your filters to see everyone available."
                    actionLabel="Clear filters"
                    onAction={handleClearFilters}
                  />
                </div>
              )}

              {!error && !isLoading && providers.length > 0 && (
                <>
                  <div
                    className={`mt-5 grid gap-4 ${
                      view === 'grid'
                        ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                        : 'grid-cols-1'
                    }`}
                  >
                    {providers.map((provider, index) => (
                      <ProviderGridCard
                        key={provider._id || provider.id}
                        provider={provider}
                        index={index}
                        view={view}
                      />
                    ))}
                  </div>

                  {page < totalPages && (
                    <div className="mt-10 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchProviders(page + 1, true)}
                        isLoading={isLoadingMore}
                      >
                        Load more professionals
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
              extraSection={PRO_TYPE_SECTION}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FindPros;
