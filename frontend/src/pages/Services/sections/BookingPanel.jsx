import { useEffect, useRef, useState } from 'react';
import {
  FaRegCalendarAlt,
  FaArrowRight,
  FaRegCommentDots,
  FaRegClock,
  FaShieldAlt,
  FaChevronDown,
} from 'react-icons/fa';
import { formatCurrency } from '@/utils/formatCurrency';
import { serviceService } from '@/services/serviceService';

const MODES = [
  { value: 'one_time', label: 'One-time Service' },
  { value: 'custom', label: 'Custom Request' },
];

// A date input wants YYYY-MM-DD; the label above it reads better spelled out.
const toInputDate = (date) => date.toISOString().slice(0, 10);

const formatLabel = (value) => {
  if (!value) return 'Choose a date';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-LK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Price, date and slot picker. Slots come from the availability endpoint, so
 * times the provider is already booked for are shown struck through and
 * cannot be selected.
 *
 * @param {{
 *   service: object,
 *   onBook: (details: { date: string, time: string, mode: string }) => void,
 *   onChat: () => void,
 *   isChatLoading?: boolean,
 * }} props
 */
export default function BookingPanel({ service, onBook, onChat, isChatLoading }) {
  const [mode, setMode] = useState('one_time');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toInputDate(tomorrow);
  });
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const dateInputRef = useRef(null);

  // showPicker() is the reliable way to raise the native calendar from a
  // custom-styled row. It needs user activation (satisfied inside a click)
  // and isn't in every browser, so focus is the fallback.
  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Some browsers throw if the picker is already open — ignore.
      }
    }
    input.focus();
  };

  const serviceId = service?._id || service?.id;

  useEffect(() => {
    if (!serviceId || !date) return undefined;

    let cancelled = false;

    // Queued off the commit path, as above.
    queueMicrotask(() => {
      if (!cancelled) setIsLoadingSlots(true);
    });

    serviceService
      .getAvailability(serviceId, date)
      .then((response) => {
        if (cancelled) return;
        const next = response?.slots || [];
        setSlots(next);
        // Drop a previously picked time if that slot is taken on the new day.
        setTime((current) =>
          next.some((slot) => slot.time === current && slot.available) ? current : ''
        );
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  const isAvailableToday = service?.provider?.isAvailable !== false;
  const canBook = Boolean(date && time);

  return (
    <aside className="rounded-2xl bg-surface-warm p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-text-muted">From</p>
          <p className="font-display text-[1.75rem] font-medium leading-tight text-secondary">
            {formatCurrency(service?.price)}
          </p>
        </div>

        <span className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isAvailableToday ? 'bg-success' : 'bg-border'}`}
          />
          {isAvailableToday ? 'Available Today' : 'Currently unavailable'}
        </span>
      </div>

      <p className="mt-1.5 text-[11.5px] text-text-muted">
        Final price may vary based on your requirements
      </p>

      {/* ─── Mode ─────────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1">
        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            className={`rounded-lg px-3 py-2.5 text-[12.5px] font-semibold transition-colors ${
              mode === option.value
                ? 'bg-secondary text-white'
                : 'text-text-muted hover:text-secondary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* ─── Date ─────────────────────────────────────────────────── */}
      <div className="mt-5">
        <p className="text-[12.5px] font-semibold text-secondary">Select date</p>

        {/* The real input is stretched transparently over the styled row, so
            a click lands on the control itself. An earlier version sized it
            to 0×0 and relied on the label, which only moved focus — the
            native calendar never opened and the date couldn't be changed.
            showPicker() is called too, since not every browser opens the
            calendar from a bare click. */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3">
            <FaRegCalendarAlt className="shrink-0 text-[13px] text-text-muted" />
            <span className="flex-1 text-[13px] text-secondary">{formatLabel(date)}</span>
            <FaChevronDown className="shrink-0 text-[9px] text-text-muted" />
          </div>

          <input
            ref={dateInputRef}
            type="date"
            value={date}
            min={toInputDate(new Date())}
            onChange={(event) => setDate(event.target.value)}
            onClick={openDatePicker}
            aria-label="Booking date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>

      {/* ─── Time ─────────────────────────────────────────────────── */}
      <div className="mt-5">
        <p className="text-[12.5px] font-semibold text-secondary">Select time</p>

        {isLoadingSlots ? (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="mt-2 text-[12px] text-text-muted">
            Couldn't load times. Pick another date or try again.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setTime(slot.time)}
                aria-pressed={time === slot.time}
                title={slot.available ? undefined : 'Already booked'}
                className={`rounded-xl border px-2 py-2.5 text-[12px] font-medium transition-colors ${
                  time === slot.time
                    ? 'border-secondary bg-surface text-secondary ring-1 ring-secondary'
                    : slot.available
                      ? 'border-border bg-surface text-secondary hover:border-primary'
                      : 'cursor-not-allowed border-transparent bg-surface/50 text-text-muted line-through'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canBook}
        onClick={() => onBook({ date, time, mode })}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-secondary px-5 py-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mode === 'custom' ? 'Send Custom Request' : 'Book This Service'}
        <FaArrowRight className="text-[11px]" />
      </button>

      <button
        type="button"
        onClick={onChat}
        disabled={isChatLoading}
        className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface px-5 py-3.5 text-[13.5px] font-semibold text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      >
        <FaRegCommentDots className="text-[13px]" />
        {isChatLoading ? 'Opening chat…' : 'Chat with Provider'}
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <p className="flex items-start gap-2 text-[11px] leading-tight text-text-muted">
          <FaRegClock className="mt-0.5 shrink-0 text-[12px]" />
          <span>
            Free cancellation
            <br />
            (up to 2 hours)
          </span>
        </p>
        <p className="flex items-start gap-2 text-[11px] leading-tight text-text-muted">
          <FaShieldAlt className="mt-0.5 shrink-0 text-[12px]" />
          <span>
            Secure booking
            <br />
            and payment
          </span>
        </p>
      </div>
    </aside>
  );
}
