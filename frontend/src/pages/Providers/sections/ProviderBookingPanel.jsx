import { useEffect, useRef, useState } from 'react';
import {
  FaRegCalendarAlt,
  FaChevronDown,
  FaArrowRight,
  FaRegClock,
  FaShieldAlt,
  FaTools,
} from 'react-icons/fa';
import { formatCurrency } from '@/utils/formatCurrency';
import { serviceService } from '@/services/serviceService';

const MODES = [
  { value: 'book', label: 'Book a Service' },
  { value: 'quote', label: 'Request a Quote' },
];

const toInputDate = (date) => date.toISOString().slice(0, 10);

const formatLabel = (value) => {
  if (!value) return 'Choose a date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Unlike the service page's panel, this one starts by asking *which* service
 * — a provider offers several, each with its own price and availability.
 *
 * @param {{
 *   provider: object,
 *   services: Array<object>,
 *   onBook: (details: object) => void,
 *   onQuote: (details: object) => void,
 * }} props
 */
export default function ProviderBookingPanel({ provider, services = [], onBook, onQuote }) {
  const [mode, setMode] = useState('book');
  // Only an explicit pick lives in state; the effective id falls back to
  // the first service. Deriving it avoids an effect that mirrored props into
  // state just to keep the two in sync.
  const [pickedServiceId, setPickedServiceId] = useState('');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toInputDate(tomorrow);
  });
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const dateInputRef = useRef(null);

  const serviceId =
    (pickedServiceId && services.some((item) => item._id === pickedServiceId)
      ? pickedServiceId
      : services[0]?._id) || '';
  const selectedService = services.find((item) => item._id === serviceId);

  useEffect(() => {
    if (!serviceId || !date) return undefined;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoadingSlots(true);
    });

    serviceService
      .getAvailability(serviceId, date)
      .then((response) => {
        if (cancelled) return;
        const next = response?.slots || [];
        setSlots(next);
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

  // showPicker() is the reliable way to raise the native calendar from a
  // custom-styled row; focus is the fallback where it isn't supported.
  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Some browsers throw if it's already open — ignore.
      }
    }
    input.focus();
  };

  const isQuote = mode === 'quote';
  const canSubmit = isQuote ? Boolean(selectedService) : Boolean(selectedService && date && time);

  return (
    <aside className="rounded-2xl bg-surface-warm p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-text-muted">From</p>
          <p className="font-display text-[1.7rem] font-medium leading-tight text-secondary">
            {selectedService ? formatCurrency(selectedService.price) : '—'}
          </p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              provider?.isAvailable === false ? 'bg-border' : 'bg-success'
            }`}
          />
          {provider?.isAvailable === false ? 'Currently unavailable' : 'Available Today'}
        </span>
      </div>

      <p className="mt-1.5 text-[11.5px] text-text-muted">
        Final price may vary based on your requirements
      </p>

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

      {/* ─── Service ──────────────────────────────────────────────── */}
      <div className="mt-5">
        <p className="text-[12.5px] font-semibold text-secondary">Select service</p>
        {services.length === 0 ? (
          <p className="mt-2 text-[12px] text-text-muted">
            This provider hasn't published any services yet.
          </p>
        ) : (
          <div className="relative mt-2">
            <FaTools className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-text-muted" />
            <select
              value={serviceId}
              onChange={(event) => setPickedServiceId(event.target.value)}
              aria-label="Service"
              className="w-full appearance-none rounded-xl border border-border bg-surface py-3 pl-9 pr-9 text-[13px] text-secondary focus:border-primary focus:outline-none"
            >
              {services.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title}
                </option>
              ))}
            </select>
            <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted" />
          </div>
        )}
      </div>

      {/* Date and slots only matter for a real booking; a quote is a
          conversation, and pinning a time before the price is agreed would
          be putting the cart before the horse. */}
      {!isQuote && services.length > 0 && (
        <>
          <div className="mt-5">
            <p className="text-[12.5px] font-semibold text-secondary">Select date</p>
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

          <div className="mt-5">
            <p className="text-[12.5px] font-semibold text-secondary">Select time</p>
            {isLoadingSlots ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-xl bg-surface" />
                ))}
              </div>
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
                        ? 'border-secondary bg-secondary text-white'
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
        </>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          isQuote
            ? onQuote({ service: selectedService })
            : onBook({ service: selectedService, date, time })
        }
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-secondary px-5 py-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isQuote ? 'Request a Quote' : 'Book Now'}
        <FaArrowRight className="text-[11px]" />
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
