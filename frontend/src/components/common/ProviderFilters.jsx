import { useState } from "react";
import { motion } from "framer-motion";
import { FaFilter, FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";

const RATING_OPTIONS = [
  { label: "Any Rating", value: "" },
  { label: "4.5 & up", value: "4.5" },
  { label: "4 & up", value: "4" },
  { label: "3 & up", value: "3" },
];

const EXPERIENCE_OPTIONS = [
  { label: "Any Experience", value: "" },
  { label: "1+ years", value: "1" },
  { label: "3+ years", value: "3" },
  { label: "5+ years", value: "5" },
  { label: "10+ years", value: "10" },
];

const AVAILABILITY_OPTIONS = [
  { label: "Any Availability", value: "" },
  { label: "Available Today", value: "available" },
  { label: "Busy", value: "busy" },
];

const SORT_OPTIONS = [
  { label: "Highest Rated", value: "rating" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Experienced", value: "experience" },
];

const ProviderFilters = ({ categories = [], filters, onChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleChange = (key) => (e) => {
    onChange({ ...filters, [key]: e.target.value });
  };

  return (
    <div className="relative z-10 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-slate-100">
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-sm font-medium text-secondary md:hidden"
      >
        <span className="flex items-center gap-2">
          <FaFilter className="text-primary" />
          Filters &amp; Sort
        </span>
        <FaChevronDown
          className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: "auto", opacity: 1 }}
        className={`mt-4 flex-col gap-4 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center ${
          mobileOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Category</label>
          <select
            value={filters.category}
            onChange={handleChange("category")}
            className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Location</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FaMapMarkerAlt className="text-slate-400" size={14} />
            <input
              type="text"
              placeholder="City or area"
              value={filters.location}
              onChange={handleChange("location")}
              className="w-28 bg-transparent text-sm text-secondary placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Rating</label>
          <select
            value={filters.rating}
            onChange={handleChange("rating")}
            className="min-w-[130px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {RATING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Experience */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Experience</label>
          <select
            value={filters.experience}
            onChange={handleChange("experience")}
            className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Availability */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Availability</label>
          <select
            value={filters.availability}
            onChange={handleChange("availability")}
            className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1 md:ml-auto">
          <label className="text-xs font-medium text-slate-500">Sort By</label>
          <select
            value={filters.sort}
            onChange={handleChange("sort")}
            className="min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>
    </div>
  );
};

export default ProviderFilters;