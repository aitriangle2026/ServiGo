import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaStar,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaHeart,
  FaRegHeart,
} from 'react-icons/fa';
import { formatCurrency } from '@/utils/formatCurrency';

const PLACEHOLDER = '/images/service-placeholder.jpg';

const AVAILABILITY = {
  today: { label: 'Available Today', dot: 'bg-success', text: 'text-success' },
  week: { label: 'Available This Week', dot: 'bg-accent', text: 'text-accent-hover' },
  flexible: { label: 'Flexible', dot: 'bg-text-muted', text: 'text-text-muted' },
};

/**
 * A professional in the Find Pros grid.
 *
 * @param {{
 *   provider: object,
 *   index?: number,
 *   isFavorite?: boolean,
 *   onToggleFavorite?: (provider: object) => void,
 *   view?: 'grid' | 'list',
 * }} props
 */
export default function ProviderGridCard({
  provider,
  index = 0,
  isFavorite = false,
  onToggleFavorite,
  view = 'grid',
}) {
  const navigate = useNavigate();

  const id = provider._id || provider.id;
  const user = provider.user || {};
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ServiGo Pro';
  const image = provider.profileImage || provider.portfolioImages?.[0] || PLACEHOLDER;

  const categoryNames = (provider.categories || [])
    .map((category) => category?.name)
    .filter(Boolean);
  const role = categoryNames[0] || 'Service Professional';

  const rating = Number(provider.averageRating || 0);
  const reviews = Number(provider.totalReviews || 0);
  const city = provider.workingArea?.city || provider.workingArea?.district || '';

  // Nothing models a provider's calendar yet, so this reflects their
  // availability flag rather than a real free slot.
  const availability = provider.isAvailable === false ? AVAILABILITY.flexible : AVAILABILITY.today;

  // Providers don't carry a price of their own — it lives on their services.
  // Shown only when the API has supplied one rather than rendering "LKR —".
  const startingPrice = provider.startingPrice ?? provider.minPrice ?? null;

  const isList = view === 'list';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 7) * 0.04 }}
      className={`group overflow-hidden rounded-2xl bg-surface shadow-soft transition-shadow hover:shadow-soft-lg ${
        isList ? 'flex gap-4' : 'flex flex-col'
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden ${isList ? 'w-48' : 'aspect-[4/3]'}`}>
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-[10.5px] font-medium backdrop-blur">
          <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
          <span className={availability.text}>{availability.label}</span>
        </span>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(provider);
            }}
            aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
            aria-pressed={isFavorite}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 backdrop-blur transition-colors hover:bg-surface"
          >
            {isFavorite ? (
              <FaHeart className="text-[13px] text-danger" />
            ) : (
              <FaRegHeart className="text-[13px] text-secondary" />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="flex items-center gap-1.5 text-[14.5px] font-semibold text-secondary">
          {name}
          {provider.isVerified && (
            <FaCheckCircle className="text-[12px] text-primary" title="Verified professional" />
          )}
        </h3>

        <p className="mt-0.5 text-[12.5px] text-text-muted">{role}</p>

        <div className="mt-2 flex items-center gap-1 text-[12px]">
          <FaStar className="text-[11px] text-accent" />
          <span className="font-semibold text-secondary">{rating.toFixed(1)}</span>
          <span className="text-text-muted">({reviews} reviews)</span>
        </div>

        {city && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-text-muted">
            <FaMapMarkerAlt className="text-[10px]" />
            {city}
          </p>
        )}

        {startingPrice != null && (
          <p className="mt-2 text-[12px] text-text-muted">
            From{' '}
            <span className="text-[13.5px] font-bold text-secondary">
              {formatCurrency(startingPrice)}
            </span>
          </p>
        )}

        {categoryNames.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categoryNames.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-warm px-2 py-1 text-[10.5px] font-medium text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/providers/${id}`)}
            className="rounded-xl border border-border px-3 py-2.5 text-[12.5px] font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            View Profile
          </button>
          <button
            type="button"
            onClick={() => navigate(`/providers/${id}?book=1`)}
            className="rounded-xl bg-primary px-3 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.article>
  );
}
