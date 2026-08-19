import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";

const RATING_OPTIONS = [
  { label: "Any Rating", value: "" },
  { label: "4.5 & up", value: "4.5" },
  { label: "4 & up", value: "4" },
  { label: "3 & up", value: "3" },
];

const ServiceFilters = ({ categories = [], filters, onChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState({
    min: filters.minPrice,
    max: filters.maxPrice,
  });

  const handleSelectChange = (key) => (e) => {
    onChange({ ...filters, [key]: e.target.value });
  };

  const handleLocationChange = (e) => {
    onChange({ ...filters, location: e.target.value });
  };

  const applyPrice = () => {
    onChange({ ...filters, minPrice: priceDraft.min, maxPrice: priceDraft.max });
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
          Filters
        </span>
        <FaChevronDown
          className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        <motion.div
          initial={false}
          animate={{ height: "auto", opacity: 1 }}
          className={`mt-4 flex-col gap-4 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center ${
            mobileOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={filters.category}
              onChange={handleSelectChange("category")}
              className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Price Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={priceDraft.min}
                onChange={(e) => setPriceDraft((prev) => ({ ...prev, min: e.target.value }))}
                className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={priceDraft.max}
                onChange={(e) => setPriceDraft((prev) => ({ ...prev, max: e.target.value }))}
                className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={applyPrice}
                className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Rating</label>
            <select
              value={filters.rating}
              onChange={handleSelectChange("rating")}
              className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Location</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <FaMapMarkerAlt className="text-slate-400" size={14} />
              <input
                type="text"
                placeholder="City or area"
                value={filters.location}
                onChange={handleLocationChange}
                className="w-32 bg-transparent text-sm text-secondary placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ServiceFilters;