import { useState } from 'react';
import {
  FaMapMarkerAlt,
  FaThList,
  FaTag,
  FaStar,
  FaRegClock,
  FaChevronDown,
  FaFilter,
} from 'react-icons/fa';

// "All cities" leads so a first visit isn't silently narrowed to one place.
// Defaulting to a single city made the page open on an empty result set for
// anyone whose providers happen to work elsewhere.
export const ALL_CITIES = 'All cities';
const CITIES = [ALL_CITIES, 'Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];
const RADIUS_OPTIONS = ['Within 5 km', 'Within 10 km', 'Within 25 km', 'Anywhere'];
const RATING_OPTIONS = [4.5, 4.0, 3.5];
const PRICE_CEILING = 20000;

// Only the first few categories show until "Show more" is clicked — the full
// list runs long enough to push price and rating out of reach.
const COLLAPSED_CATEGORY_COUNT = 8;

const Section = ({ icon: Icon, title, children }) => (
  <div className="border-t border-border px-5 py-4 first:border-t-0">
    <h3 className="flex items-center gap-2 text-[12.5px] font-semibold text-secondary">
      <Icon className="text-[11px] text-text-muted" />
      {title}
    </h3>
    <div className="mt-3">{children}</div>
  </div>
);

const Checkbox = ({ checked, onChange, children }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-[5px] text-[12.5px] text-text-muted transition-colors hover:text-secondary">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-3.5 w-3.5 shrink-0 rounded-[4px] border-border accent-primary"
    />
    {children}
  </label>
);

const Select = ({ value, onChange, options, ariaLabel }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2 pr-7 text-[12px] text-secondary focus:border-primary focus:outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <FaChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-text-muted" />
  </div>
);

/**
 * The filter rail shared by the Services catalogue and Find Pros. The
 * sections above "availability" are identical on both pages; the two that
 * differ are passed in, rather than forking the whole component.
 *
 * @param {{
 *   categories: Array<{ _id: string, name: string }>,
 *   filters: object,
 *   onChange: (next: object) => void,
 *   onClear: () => void,
 *   onApply: () => void,
 *   availabilityOptions: Array<{ value: string, label: string, dot: string }>,
 *   extraSection?: {
 *     key: string,
 *     title: string,
 *     icon: React.ComponentType,
 *     options: Array<{ value: string, label: string, icon?: React.ComponentType }>,
 *   },
 * }} props
 */
export default function FilterSidebar({
  categories = [],
  filters,
  onChange,
  onClear,
  onApply,
  availabilityOptions = [],
  extraSection,
}) {
  const [showAllCategories, setShowAllCategories] = useState(false);

  const set = (patch) => onChange({ ...filters, ...patch });

  const toggleIn = (key, value) => {
    const current = filters[key] || [];
    set({
      [key]: current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    });
  };

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, COLLAPSED_CATEGORY_COUNT);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2 className="font-display text-xl font-medium text-secondary">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] font-medium text-text-muted transition-colors hover:text-primary"
        >
          Clear all
        </button>
      </div>

      {/* The list scrolls on its own so "Apply Filters" stays pinned and
          reachable however long the category list gets. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section icon={FaMapMarkerAlt} title="Location">
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.city || CITIES[0]}
              onChange={(city) => set({ city })}
              options={CITIES}
              ariaLabel="City"
            />
            <Select
              value={filters.radius || RADIUS_OPTIONS[1]}
              onChange={(radius) => set({ radius })}
              options={RADIUS_OPTIONS}
              ariaLabel="Search radius"
            />
          </div>
        </Section>

        <Section icon={FaThList} title="Service Category">
          {categories.length === 0 ? (
            <p className="text-[12.5px] text-text-muted">No categories yet.</p>
          ) : (
            <>
              {visibleCategories.map((category) => (
                <Checkbox
                  key={category._id}
                  checked={(filters.categories || []).includes(category._id)}
                  onChange={() => toggleIn('categories', category._id)}
                >
                  {category.name}
                </Checkbox>
              ))}

              {categories.length > COLLAPSED_CATEGORY_COUNT && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((open) => !open)}
                  className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-secondary"
                >
                  {showAllCategories ? 'Show less' : 'Show more'}
                  <FaChevronDown
                    className={`text-[8px] transition-transform ${showAllCategories ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </>
          )}
        </Section>

        <Section icon={FaTag} title="Price Range">
          <input
            type="range"
            min={0}
            max={PRICE_CEILING}
            step={500}
            value={filters.maxPrice ?? PRICE_CEILING}
            onChange={(event) => set({ maxPrice: Number(event.target.value) })}
            aria-label="Maximum price"
            className="w-full accent-primary"
          />
          <p className="mt-2 text-center text-[12px] font-medium text-secondary">
            LKR 0 – LKR {Number(filters.maxPrice ?? PRICE_CEILING).toLocaleString('en-LK')}
          </p>
        </Section>

        <Section icon={FaStar} title="Rating">
          {RATING_OPTIONS.map((rating) => (
            <Checkbox
              key={rating}
              checked={Number(filters.rating) === rating}
              // Radio behaviour in a checkbox's clothing: clicking the active
              // option again clears it, which is what people expect here.
              onChange={() => set({ rating: Number(filters.rating) === rating ? '' : rating })}
            >
              <span className="flex items-center gap-1.5">
                <FaStar className="text-[11px] text-accent" />
                {rating.toFixed(1)} &amp; above
              </span>
            </Checkbox>
          ))}
        </Section>

        {availabilityOptions.length > 0 && (
          <Section icon={FaRegClock} title="Availability">
            {availabilityOptions.map((option) => (
              <Checkbox
                key={option.value}
                checked={(filters.availability || []).includes(option.value)}
                onChange={() => toggleIn('availability', option.value)}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${option.dot}`} />
                  {option.label}
                </span>
              </Checkbox>
            ))}
          </Section>
        )}

        {extraSection && (
          <Section icon={extraSection.icon} title={extraSection.title}>
            {extraSection.options.map((option) => (
              <Checkbox
                key={option.value}
                checked={(filters[extraSection.key] || []).includes(option.value)}
                onChange={() => toggleIn(extraSection.key, option.value)}
              >
                <span className="flex items-center gap-2">
                  {option.icon && <option.icon className="text-[10px] text-text-muted" />}
                  {option.label}
                </span>
              </Checkbox>
            ))}
          </Section>
        )}
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <FaFilter className="text-[11px]" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
