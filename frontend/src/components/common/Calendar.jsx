import { useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Month-grid date picker.
 *
 * Dates are handled as local Y-M-D rather than ISO strings throughout —
 * `toISOString()` converts to UTC first, which rolls the date backwards for
 * anyone east of Greenwich and would show Sri Lankan users the wrong day.
 *
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   minDate?: Date,
 *   maxMonthsAhead?: number,
 * }} props
 */
export default function Calendar({ value, onChange, minDate = new Date(), maxMonthsAhead = 6 }) {
  const min = startOfDay(minDate);
  const selected = value ? startOfDay(new Date(`${value}T00:00:00`)) : null;

  const [cursor, setCursor] = useState(() => {
    const base = selected || min;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const limit = useMemo(() => {
    const end = new Date(min.getFullYear(), min.getMonth() + maxMonthsAhead, 1);
    return end;
  }, [min, maxMonthsAhead]);

  // Six rows of seven keeps the grid a constant height, so the panel beside
  // it doesn't jump when you page between months.
  const days = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [cursor]);

  const canGoBack = cursor > new Date(min.getFullYear(), min.getMonth(), 1);
  const canGoForward = cursor < limit;

  const shiftMonth = (delta) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="grid h-8 w-8 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FaChevronLeft className="text-[11px]" />
        </button>

        <p aria-live="polite" className="text-[14px] font-semibold text-secondary">
          {cursor.toLocaleDateString('en-LK', { month: 'long', year: 'numeric' })}
        </p>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FaChevronRight className="text-[11px]" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-2 text-[11px] font-medium text-text-muted">
            {day}
          </span>
        ))}

        {days.map((date) => {
          const key = toKey(date);
          const isCurrentMonth = date.getMonth() === cursor.getMonth();
          const isPast = date < min;
          const isSelected = selected && toKey(selected) === key;
          const isToday = toKey(new Date()) === key;

          return (
            <div key={key} className="py-0.5">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onChange(key)}
                aria-pressed={isSelected}
                aria-label={date.toLocaleDateString('en-LK', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-[12.5px] transition-colors ${
                  isSelected
                    ? 'bg-secondary font-semibold text-white'
                    : isPast
                      ? 'cursor-not-allowed text-border'
                      : isCurrentMonth
                        ? 'text-secondary hover:bg-surface-warm'
                        : 'text-text-muted/50 hover:bg-surface-warm'
                } ${isToday && !isSelected ? 'ring-1 ring-border' : ''}`}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
