import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaTools } from "react-icons/fa";

import Navbar from "@/components/layout/Navbar";
import ServiceCard from "../../components/cards/ServiceCard";
import ServiceCardSkeleton from "../../components/common/ServiceCardSkeleton";
import EmptyState from "../../components/common/EmptyState";
import SearchBar from "../../components/common/SearchBar";
import ServiceFilters from "../../components/common/ServiceFilters";
import Button from "../../components/common/Button";

import { serviceService } from "../../services/serviceService";

const PAGE_SIZE = 8;

const DEFAULT_FILTERS = {
  category: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
  location: "",
};

const Services = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchServices = useCallback(
    async (pageNumber, isAppend = false) => {
      try {
        isAppend ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const params = {
          query: appliedSearch || undefined,
          category: filters.category || undefined,
          location: filters.location || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          rating: filters.rating || undefined,
          page: pageNumber,
          limit: PAGE_SIZE,
        };

        const response = await serviceService.search(params);
        const list = response?.data ?? [];
        const pages = response?.totalPages ?? 1;

        setServices((prev) => (isAppend ? [...prev, ...list] : list));
        setTotalPages(pages);
        setPage(pageNumber);
      } catch (err) {
        setError("Something went wrong while loading services. Please try again.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [appliedSearch, filters]
  );
  
  useEffect(() => {
    fetchServices(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, filters]);

  const handleSearchSubmit = (value) => {
    setAppliedSearch(value.trim());
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchServices(page + 1, true);
    }
  };

  const handleBookNow = (service) => {
    console.log("Book now:", service._id || service.id);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
    setAppliedSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
            Find trusted pros for every job
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-base text-slate-300"
          >
            Browse verified service providers near you and book with confidence.
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
            />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="sticky top-16 z-20 -mt-16 mb-8">
          <ServiceFilters
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
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon={<FaTools size={24} />}
            title="No services match your search"
            description="Try a different keyword, or reset your filters to see all available services."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service, index) => (
                <ServiceCard
                  key={service._id || service.id}
                  service={service}
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
                  {isLoadingMore ? "Loading..." : "Load More Services"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Services;