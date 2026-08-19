import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaMapMarkerAlt, FaCheckCircle, FaStar } from 'react-icons/fa';
import Button from '@/components/common/Button';

const CITIES = ['Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Colombo');
  const [cityOpen, setCityOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    params.set('city', city);
    navigate(`/services?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-20 lg:px-8">
        {/* Left: copy + search */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-primary shadow-soft"
          >
            <FaCheckCircle /> 8,400+ verified pros across Sri Lanka
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-secondary sm:text-5xl lg:text-[3.4rem]"
          >
            Trusted help for every job around your home
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-5 max-w-lg text-base leading-relaxed text-text-muted sm:text-lg"
          >
            Search, compare and book background-checked electricians, plumbers, cleaners and 20+
            other service categories — with upfront pricing and real reviews.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            onSubmit={handleSearch}
            className="glass mt-8 flex flex-col gap-2 rounded-2xl p-2 shadow-soft-lg sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
              <FaSearch className="text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need help with?"
                className="w-full bg-transparent text-sm text-secondary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCityOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-xl border-t border-border px-4 py-3 text-sm text-secondary sm:w-auto sm:border-l sm:border-t-0"
              >
                <FaMapMarkerAlt className="text-primary" />
                {city}
              </button>
              {cityOpen && (
                <div className="absolute left-0 top-full z-10 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-soft-lg">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setCityOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-secondary hover:bg-slate-100"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" size="lg" className="sm:ml-1">
              Search
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.34 }}
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted"
          >
            <span className="flex items-center gap-1.5">
              <FaStar className="text-accent" /> 4.8 average rating
            </span>
            <span>152,000+ jobs completed</span>
            <span>Money-back guarantee</span>
          </motion.div>
        </div>

        {/* Right: visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <div className="relative overflow-hidden rounded-3xl shadow-soft-lg">
            <img
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80"
              alt="Verified electrician completing a home repair"
              className="h-[520px] w-full object-cover"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass absolute -left-8 top-10 flex items-center gap-3 rounded-2xl p-4 shadow-soft-lg"
          >
            <img src="https://i.pravatar.cc/60?img=12" className="h-10 w-10 rounded-full" alt="" />
            <div>
              <p className="text-xs font-semibold text-secondary">Sunil P. is on the way</p>
              <p className="text-xs text-text-muted">Arriving in 12 min</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="glass absolute -bottom-6 -right-6 rounded-2xl p-4 shadow-soft-lg"
          >
            <div className="flex items-center gap-1 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar key={i} className="text-sm" />
              ))}
            </div>
            <p className="mt-1 text-xs font-medium text-secondary">"Fixed it in 20 minutes!"</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
