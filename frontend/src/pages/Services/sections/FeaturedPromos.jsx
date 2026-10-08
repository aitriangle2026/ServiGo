import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import acImage from '/images/promo-ac.webp';
import cleaningImage from '/images/promo-cleaning.webp';
import carpentryImage from '/images/promo-carpentry.webp';

// The first promo is wide and inverted; the other two are standing cards on
// the warm paper. Driven by `wide` so the grid stays one map.
const PROMOS = [
  {
    key: 'ac',
    wide: true,
    title: ['Stay cool', 'all year round.'],
    body: 'Professional AC installation, repair and maintenance by verified experts.',
    cta: 'Explore AC Services',
    query: 'ac repair',
    image: acImage,
    alt: 'A technician servicing a wall-mounted air conditioner',
  },
  {
    key: 'cleaning',
    wide: false,
    title: ['A cleaner,', 'healthier home.'],
    body: 'Trusted home cleaning professionals.',
    cta: 'Book a Cleaner',
    query: 'cleaning',
    image: cleaningImage,
    alt: 'A cleaner polishing a wooden table in a bright living room',
  },
  {
    key: 'repairs',
    wide: false,
    title: ['Repairs done', 'right.'],
    body: 'Skilled professionals for every repair.',
    cta: 'Find a Handyman',
    query: 'carpenter',
    image: carpentryImage,
    alt: 'A carpenter drilling into a timber frame',
  },
];

export default function FeaturedPromos({ onSelect }) {
  const navigate = useNavigate();

  const go = (query) => {
    if (onSelect) onSelect(query);
    else navigate(`/services?q=${encodeURIComponent(query)}`);
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-4 font-display text-[1.35rem] font-medium text-secondary">
          Featured Services
          <span className="hidden h-px w-16 bg-border sm:block" />
        </h2>
        <button
          type="button"
          onClick={() => navigate('/services')}
          className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-text-muted transition-colors hover:text-secondary"
        >
          View all
          <FaArrowRight className="text-[10px]" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
        {PROMOS.map((promo, index) => (
          <motion.article
            key={promo.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className={`relative flex min-h-[13rem] overflow-hidden rounded-2xl ${
              promo.wide ? 'bg-primary text-white' : 'bg-surface-warm text-secondary'
            }`}
          >
            {/* Copy sits on the left half; the photo fills the right and
                fades into the card colour so there's no hard seam. */}
            <div className="relative z-10 flex max-w-[58%] flex-col justify-center p-5 sm:p-6">
              <h3
                className={`font-display text-[1.25rem] font-medium leading-[1.2] sm:text-[1.4rem] ${
                  promo.wide ? 'text-white' : 'text-secondary'
                }`}
              >
                {promo.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h3>

              <p
                className={`mt-2.5 text-[12.5px] leading-relaxed ${
                  promo.wide ? 'text-white/80' : 'text-text-muted'
                }`}
              >
                {promo.body}
              </p>

              <button
                type="button"
                onClick={() => go(promo.query)}
                className={`mt-4 inline-flex w-fit items-center gap-2 text-[12.5px] font-semibold transition-colors ${
                  promo.wide
                    ? 'rounded-full bg-white/15 px-4 py-2.5 text-white hover:bg-white/25'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {promo.cta}
                <FaArrowRight className="text-[10px]" />
              </button>
            </div>

            <div className="absolute inset-y-0 right-0 w-[52%]">
              <img src={promo.image} alt={promo.alt} className="h-full w-full object-cover" />
              <div
                className={`absolute inset-0 bg-gradient-to-r to-transparent to-45% ${
                  promo.wide ? 'from-primary' : 'from-surface-warm'
                }`}
              />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
