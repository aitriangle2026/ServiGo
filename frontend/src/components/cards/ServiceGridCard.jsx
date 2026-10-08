import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaArrowRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import { formatCurrency } from '@/utils/formatCurrency';

const PLACEHOLDER = '/images/service-placeholder.jpg';

/**
 * A service in the Services page grid, matching the catalogue design: photo,
 * favourite toggle, rating, price and an availability pill.
 *
 * @param {{
 *   service: object,
 *   index?: number,
 *   isFavorite?: boolean,
 *   onToggleFavorite?: (service: object) => void,
 *   view?: 'grid' | 'list',
 * }} props
 */
export default function ServiceGridCard({
  service,
  index = 0,
  isFavorite = false,
  onToggleFavorite,
  view = 'grid',
}) {
  const navigate = useNavigate();

  const id = service._id || service.id;
  const image = service.images?.[0] || service.portfolioImages?.[0] || PLACEHOLDER;
  const rating = Number(service.averageRating || 0);
  const reviews = Number(service.totalReviews || 0);
  const city =
    service.provider?.workingArea?.city || service.location?.city || service.city || '';

  // Nothing in the schema models a provider's daily calendar yet, so this
  // reflects the provider's availability flag rather than a real free slot.
  const availableToday = service.provider?.isAvailable !== false;

  const open = () => navigate(`/services/${id}`);

  const isList = view === 'list';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 7) * 0.04 }}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
      role="button"
      tabIndex={0}
      className={`group cursor-pointer overflow-hidden rounded-2xl bg-surface shadow-soft transition-shadow hover:shadow-soft-lg ${
        isList ? 'flex gap-4' : 'flex flex-col'
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden ${isList ? 'w-44' : 'aspect-[4/3]'}`}>
        <img
          src={image}
          alt={service.title || 'Service'}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(event) => {
              // The whole card navigates — don't follow it when favouriting.
              event.stopPropagation();
              onToggleFavorite(service);
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

      <div className={`flex flex-1 flex-col p-4 ${isList ? 'pl-0' : ''}`}>
        <h3 className="text-[14px] font-semibold leading-snug text-secondary">
          {service.title || 'Untitled service'}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-text-muted">
          <span className="flex items-center gap-1">
            <FaStar className="text-[10px] text-accent" />
            <span className="font-semibold text-secondary">{rating.toFixed(1)}</span>
            <span>({reviews})</span>
          </span>

          {city && (
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-[10px]" />
              {city}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div>
            <p className="text-[13px] font-bold text-secondary">
              From {formatCurrency(service.price)}
            </p>

            <span
              className={`mt-2 inline-block rounded-md px-2 py-1 text-[10.5px] font-medium ${
                availableToday
                  ? 'bg-success-light text-success'
                  : 'bg-amber-50 text-accent-hover'
              }`}
            >
              {availableToday ? 'Available Today' : 'Available Tomorrow'}
            </span>
          </div>

          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-secondary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
            <FaArrowRight className="text-[11px]" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
