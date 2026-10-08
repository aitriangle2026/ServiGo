import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaStar,
  FaBolt,
  FaFaucet,
  FaBroom,
  FaCarSide,
  FaHammer,
  FaBookOpen,
  FaEllipsisH,
  FaUsers,
  FaShieldAlt,
  FaHome,
  FaChevronDown,
  FaArrowRight,
} from 'react-icons/fa';
import heroImage from '/images/hero-electrician.webp';

const CITIES = ['All cities', 'Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];

// Quick-pick categories sitting directly under the search bar. These are the
// shortest path to a result — most people recognise their job here faster
// than they can phrase it as a search query.
const QUICK_CATEGORIES = [
  { label: 'Electrician', icon: FaBolt, query: 'electrician' },
  { label: 'Plumber', icon: FaFaucet, query: 'plumber' },
  { label: 'Cleaner', icon: FaBroom, query: 'cleaning' },
  { label: 'Mechanic', icon: FaCarSide, query: 'mechanic' },
  { label: 'Carpenter', icon: FaHammer, query: 'carpenter' },
  { label: 'Tutor', icon: FaBookOpen, query: 'tutor' },
];

const STATS = [
  { icon: FaUsers, value: '8,400+', label: 'Verified Professionals' },
  { icon: FaShieldAlt, value: '152,000+', label: 'Jobs Completed' },
  { icon: FaStar, value: '4.8', label: 'Average Rating' },
  { icon: FaHome, value: 'Trusted by homes', label: 'across Sri Lanka' },
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Colombo');
  const [cityOpen, setCityOpen] = useState(false);

  const goToSearch = (searchQuery = query) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    params.set('city', city);
    navigate(`/services?${params.toString()}`);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    goToSearch();
  };

  return (
    <section className="relative overflow-hidden bg-surface-warm">
      {/* The photograph bleeds off the right edge and fades into the warm
          background, so the headline keeps a clean field to sit on rather
          than being set over busy pixels. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] lg:block">
        <img
          src={heroImage}
          alt="A verified ServiGo electrician fitting a pendant light in a living room"
          className="h-full w-full object-cover object-center"
        />
        {/* The fade only has to cover the sliver of photo that sits behind
            the headline, so it finishes by ~55% across. A gradient that
            stayed semi-opaque the whole way (via-…/70) greyed out the
            subject and made the whole image read as fogged. */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface-warm from-0% via-surface-warm/25 via-32% to-transparent to-55%" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="lg:max-w-[55%]">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted"
          >
            Trusted local professionals
            <span className="hidden h-px w-14 bg-border sm:block" />
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="mt-5 font-display text-[2.6rem] font-medium leading-[1.04] text-secondary sm:text-6xl lg:text-[4.2rem]"
          >
            People you trust
            <br />
            for every <em className="font-normal italic text-primary">home need.</em>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-text-muted sm:text-base"
          >
            Find verified professionals for your home, office and everyday needs. Transparent
            pricing. Real reviews. A smoother way to get things done.
          </motion.p>

          {/* ─── Search ─────────────────────────────────────────────── */}
          <motion.form
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.18 }}
            onSubmit={handleSearch}
            className="mt-9 flex items-center gap-2 rounded-full bg-surface p-2 shadow-soft-lg sm:gap-0 sm:p-2.5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <FaSearch className="shrink-0 text-text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What service do you need?"
                aria-label="What service do you need?"
                className="w-full bg-transparent py-2.5 text-[15px] text-secondary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div className="hidden h-7 w-px shrink-0 bg-border sm:block" />

            <div className="relative hidden shrink-0 sm:block">
              <button
                type="button"
                onClick={() => setCityOpen((open) => !open)}
                aria-expanded={cityOpen}
                className="flex items-center gap-2 px-4 py-2.5 text-[15px] text-secondary"
              >
                <FaMapMarkerAlt className="text-text-muted" />
                {city}
                <FaChevronDown className="ml-1 text-[10px] text-text-muted" />
              </button>

              {cityOpen && (
                <>
                  {/* Click-away layer, so the menu closes without a document
                      listener fighting the button's own click. */}
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
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover"
            >
              <FaSearch />
            </button>
          </motion.form>

          {/* ─── Quick categories ───────────────────────────────────── */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-5 sm:gap-x-8"
          >
            {QUICK_CATEGORIES.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => goToSearch(category.query)}
                className="group flex w-14 flex-col items-center gap-2"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-surface/60 text-secondary transition-colors group-hover:border-primary group-hover:bg-surface group-hover:text-primary">
                  <category.icon className="text-[17px]" />
                </span>
                <span className="text-[11px] font-medium text-text-muted transition-colors group-hover:text-secondary">
                  {category.label}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate('/services')}
              className="group flex w-14 flex-col items-center gap-2"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-surface/60 text-secondary transition-colors group-hover:border-primary group-hover:bg-surface group-hover:text-primary">
                <FaEllipsisH className="text-[17px]" />
              </span>
              <span className="text-[11px] font-medium text-text-muted transition-colors group-hover:text-secondary">
                More
              </span>
            </button>
          </motion.div>

          {/* ─── Stats ──────────────────────────────────────────────── */}
          <motion.dl
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-border pt-7 sm:grid-cols-4 sm:gap-x-4"
          >
            {/* A 4-column grid rather than a wrapping flex row: with flex the
                last stat dropped onto its own line at common desktop widths,
                which broke the single rule of figures the design relies on. */}
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-start gap-2">
                <stat.icon className="mt-1 shrink-0 text-[13px] text-text-muted" />
                <div className="min-w-0">
                  <dt className="font-display text-[15px] font-medium leading-tight text-secondary">
                    {stat.value}
                  </dt>
                  <dd className="mt-0.5 text-[10.5px] leading-tight text-text-muted">
                    {stat.label}
                  </dd>
                </div>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ─── Floating proof cards ─────────────────────────────────
            Positioned over the photograph on large screens only; below that
            the photo is hidden and these would have nothing to sit on. */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="pointer-events-none absolute right-8 top-20 hidden w-[17rem] rounded-2xl bg-surface p-4 shadow-soft-lg xl:block"
        >
          <div className="flex items-center gap-2.5">
            <FaCheckCircle className="text-lg text-primary" />
            <p className="text-sm font-semibold text-secondary">Verified Professional</p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-primary-light text-[10px] font-semibold text-primary"
                  >
                    {['A', 'K', 'M', 'S'][index]}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">500+</p>
                <p className="text-[11px] text-text-muted">Happy Customers</p>
              </div>
            </div>
            <FaArrowRight className="text-sm text-text-muted" />
          </div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="pointer-events-none absolute bottom-24 right-16 hidden w-[16rem] rounded-2xl bg-surface/95 p-4 shadow-soft-lg backdrop-blur xl:block"
        >
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light text-sm font-semibold text-primary">
              T
            </span>
            <div className="min-w-0">
              <div className="flex gap-0.5 text-accent">
                {[0, 1, 2, 3, 4].map((index) => (
                  <FaStar key={index} className="text-[11px]" />
                ))}
              </div>
              <blockquote className="mt-1.5 text-[13px] leading-snug text-secondary">
                “Fixed it in 20 minutes! Very professional.”
              </blockquote>
              <figcaption className="mt-1.5 text-[11px] text-text-muted">
                Tharushi <span className="mx-1">•</span> Colombo
              </figcaption>
            </div>
          </div>
        </motion.figure>
      </div>

      {/* The photo moves below the copy on tablet and narrower, where the
          side-by-side split would squeeze both. */}
      <div className="relative h-64 w-full sm:h-80 lg:hidden">
        <img
          src={heroImage}
          alt="A verified ServiGo electrician fitting a pendant light in a living room"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
};

export default HeroSection;
