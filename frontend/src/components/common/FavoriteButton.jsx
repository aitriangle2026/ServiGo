import { FaHeart, FaRegHeart } from 'react-icons/fa';

/**
 * "Save" / "Saved" pill for detail pages. State and the API call live in
 * useFavorites — this only renders.
 *
 * @param {{ isFavorite: boolean, onToggle: () => void, className?: string }} props
 */
export default function FavoriteButton({ isFavorite, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
        isFavorite
          ? 'border-danger/30 bg-danger-light text-danger'
          : 'border-border bg-surface text-secondary hover:border-primary hover:text-primary'
      } ${className}`}
    >
      {isFavorite ? <FaHeart /> : <FaRegHeart />}
      {isFavorite ? 'Saved' : 'Save'}
    </button>
  );
}
