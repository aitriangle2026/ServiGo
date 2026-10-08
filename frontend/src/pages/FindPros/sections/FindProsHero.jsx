import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaMapMarkerAlt,
  FaChevronDown,
  FaUsers,
  FaStar,
  FaBolt,
  FaShieldAlt,
} from 'react-icons/fa';
import heroImage from '/images/findpros-hero.webp';

const CITIES = ['All cities', 'Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];

// Three separate cards here rather than one divided panel, so each claim
// reads as its own badge against the photograph.
const TRUST_CARDS = [
  { key: 'pros', icon: FaUsers, value: '8,400+', label: 'Verified Professionals' },
  { key: 'rating', icon: FaStar, value: '4.8', label: 'Average Rating', sub: 'From real customers' },
  { key: 'ontime', icon: FaBolt, value: 'On-time Service', label: 'Trusted across Sri Lanka' },
];

const POPULAR = [
  'Electrician',
  'Plumber',
  'Cleaner',
  'AC Technician',
  'Carpenter',
  'Painter',
  'Tutor',
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function FindProsHero({
  query,
  onQueryChange,
  city,
  onCityChange,
  onSubmit,
  onPopularSelect,
}) {
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
          alt="A verified ServiGo professional"
          className="h-full w-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-warm from-10% via-surface-warm/70 via-40% to-transparent to-72%" />
      </div>

      <div className="px-6 pb-6 pt-10 lg:px-10 lg:pt-12">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0 max-w-2xl">
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-text-muted"
            >
              Find pros
              <span className="hidden h-px w-10 bg-border sm:block" />
            </motion.p>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.06 }}
              className="mt-3.5 font-display text-[2.3rem] font-medium leading-[1.04] text-secondary sm:text-[3.2rem]"
            >
              Find Verified
              <br />
              <em className="font-normal italic text-primary">Professionals</em>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-4 max-w-md text-[14px] leading-relaxed text-text-muted"
            >
              Compare profiles, ratings, reviews and prices. Book a trusted professional near you.
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
                  placeholder="Search by name, service or skill..."
                  aria-label="Search professionals"
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

            {/* ─── Popular shortcuts ──────────────────────────────── */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-5 flex flex-wrap items-center gap-2"
            >
              <span className="mr-1 text-[13px] font-semibold text-secondary">Popular:</span>
              {POPULAR.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onPopularSelect(term)}
                  className="rounded-full bg-surface px-4 py-2 text-[12.5px] font-medium text-secondary shadow-soft transition-colors hover:bg-primary hover:text-white"
                >
                  {term}
                </button>
              ))}
            </motion.div>
          </div>

          {/* ─── Trust cards ──────────────────────────────────────── */}
          <div className="hidden w-[15.5rem] shrink-0 flex-col gap-2.5 xl:flex">
            {TRUST_CARDS.map((card, index) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.22 + index * 0.08 }}
                className="flex items-center gap-3 rounded-2xl bg-surface/95 px-4 py-3.5 shadow-soft backdrop-blur"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                  <card.icon className="text-sm" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold leading-tight text-secondary">{card.value}</p>
                  <p className="mt-0.5 text-[11px] text-text-muted">{card.label}</p>
                  {card.sub && <p className="text-[10px] text-text-muted">{card.sub}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge over the photograph. Hidden below xl, where the
          photo is mostly covered by the scrim anyway. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="pointer-events-none absolute left-[46%] top-[22%] hidden items-center gap-2.5 rounded-2xl rounded-bl-sm bg-surface/95 px-4 py-3 shadow-soft-lg backdrop-blur xl:flex"
      >
        <FaShieldAlt className="shrink-0 text-base text-primary" />
        <p className="text-[12.5px] font-semibold leading-tight text-secondary">
          Local Professionals
          <br />
          You Can Trust
        </p>
      </motion.div>
    </section>
  );
}
