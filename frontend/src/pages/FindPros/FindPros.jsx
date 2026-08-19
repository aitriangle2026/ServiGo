import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaUserFriends } from "react-icons/fa";

import Navbar from "@/components/layout/Navbar";
import ProviderCard from "../../components/cards/ProviderCard";
import ProviderCardSkeleton from "../../components/common/ProviderCardSkeleton";
import EmptyState from "../../components/common/EmptyState";
import SearchBar from "../../components/common/SearchBar";
import ProviderFilters from "../../components/common/ProviderFilters";
import Button from "../../components/common/Button";

import { providerService } from "../../services/providerService";
import { serviceService } from "../../services/serviceService";

const PAGE_SIZE = 8;

const DEFAULT_FILTERS = {
  category: "",
  location: "",
  rating: "",
  experience: "",
  availability: "",
  sort: "rating",
};

const FindPros = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Categories reused from serviceService, since provider categories match service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await serviceService.getCategories();
        const payload = response?.data ?? response;
        const list = payload?.categories ?? payload ?? [];
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const fetchProviders = useCallback(
    async (pageNumber, isAppend = false) => {
      try {
        isAppend ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const params = {
          query: appliedSearch || undefined,
          category: filters.category || undefined,
          location: filters.location || undefined,
          rating: filters.rating || undefined,
          experience: filters.experience || undefined,
          availability: filters.availability || undefined,
          sort: filters.sort || undefined,
          page: pageNumber,
          limit: PAGE_SIZE,
        };

        const response = await providerService.search(params);
        const list = response?.data ?? [];
        const pages = response?.totalPages ?? 1;

        setProviders((prev) => (isAppend ? [...prev, ...list] : list));
        setTotalPages(pages);
        setPage(pageNumber);
      } catch (err) {
        setError("Something went wrong while loading providers. Please try again.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [appliedSearch, filters]
  );

  useEffect(() => {
    fetchProviders(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, filters]);

  const handleSearchSubmit = (value) => {
    setAppliedSearch(value.trim());
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchProviders(page + 1, true);
    }
  };

  const handleBookNow = (provider) => {
    // Hook this up to your booking flow / modal / route
    console.log("Book now:", provider._id || provider.id);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
    setAppliedSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary py-20 md:py-28">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-white sm:text-4xl md:text-5xl"
          >
            Find the right pro for the job
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-base text-slate-300"
          >
            Compare verified professionals by rating, experience, and availability
            before you book.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearchSubmit}
              placeholder="Search by name, profession, or skill..."
            />
          </motion.div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="sticky top-16 z-20 -mt-16 mb-8">
          <ProviderFilters
            categories={categories}
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={<FaUserFriends size={24} />}
            title="No professionals match your search"
            description="Try a different keyword, or reset your filters to see all available pros."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {providers.map((provider, index) => (
                <ProviderCard
                  key={provider._id || provider.id}
                  provider={provider}
                  index={index % PAGE_SIZE}
                  onBookNow={handleBookNow}
                />
              ))}
            </div>

            {page < totalPages && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  className="px-8"
                >
                  {isLoadingMore ? "Loading..." : "Load More Pros"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default FindPros;