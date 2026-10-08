import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaMapMarkerAlt,
  FaChevronDown,
  FaShieldAlt,
  FaStar,
  FaUsers,
} from 'react-icons/fa';
import heroImage from '/images/services-hero.webp';

const CITIES = ['All cities', 'Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];

const TRUST_POINTS = [
  { key: 'pros', icon: FaUsers, value: '8,400+', label: 'Verified Professionals' },
  { key: 'pricing', icon: FaShieldAlt, value: 'Transparent Pricing', label: 'No hidden costs' },
  { key: 'rating', icon: FaStar, value: '4.8 Average Rating', label: 'From real customers' },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Compact catalogue header. Shorter than the home hero on purpose — someone
 * on this page has already decided to browse, so the results need to be
 * close to the fold rather than pushed below a full-height banner.
 */
export default function ServicesHero({ query, onQueryChange, city, onCityChange, onSubmit }) {
  const [cityOpen, setCityOpen] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="A ServiGo professional fitting a pendant light"
          className="h-full w-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-warm from-8% via-surface-warm/70 via-42% to-transparent to-78%" />
      </div>

      <div className="px-6 py-10 lg:px-10 lg:py-12">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0 max-w-xl">
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-text-muted"
            >
              Services
              <span className="hidden h-px w-10 bg-border sm:block" />
            </motion.p>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.06 }}
              className="mt-3.5 font-display text-[2.1rem] font-medium leading-[1.08] text-secondary sm:text-[2.7rem]"
            >
              Find the right
              <br />
              service for your <em className="font-normal italic text-primary">home.</em>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-3.5 max-w-md text-[14px] leading-relaxed text-text-muted"
            >
              Compare verified professionals, read real reviews and book with confidence.
            </motion.p>

            <motion.form
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.18 }}
              onSubmit={handleSubmit}
              className="mt-7 flex items-center gap-2 rounded-full bg-surface p-2 shadow-soft-lg sm:gap-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
                <FaSearch className="shrink-0 text-[13px] text-text-muted" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search for a service (e.g. AC repair, plumbing...)"
                  aria-label="Search for a service"
                  className="w-full bg-transparent py-2 text-[14px] text-secondary placeholder:text-text-muted focus:outline-none"
                />
              </div>

              <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />

              <div className="relative hidden shrink-0 sm:block">
                <button
                  type="button"
                  onClick={() => setCityOpen((open) => !open)}
                  aria-expanded={cityOpen}
                  className="flex items-center gap-2 px-4 py-2 text-[14px] text-secondary"
                >
                  <FaMapMarkerAlt className="text-[12px] text-text-muted" />
                  {city}
                  <FaChevronDown className="ml-1 text-[9px] text-text-muted" />
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
                              onCityChange(option);
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
                className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <FaSearch className="text-[12px]" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </motion.form>
          </div>

          {/* ─── Trust card ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="hidden w-[15rem] shrink-0 divide-y divide-border overflow-hidden rounded-2xl bg-surface/95 shadow-soft backdrop-blur xl:block"
          >
            {TRUST_POINTS.map((point) => (
              <div key={point.key} className="flex items-center gap-3 px-4 py-3.5">
                <point.icon className="shrink-0 text-base text-secondary" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-secondary">
                    {point.value}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-text-muted">{point.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
