import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Calendar from '@/components/common/Calendar';
import { serviceService } from '@/services/serviceService';
import { bookingService } from '@/services/bookingService';

/**
 * Date + slot picker for moving an existing booking. Slots come from the
 * same availability endpoint the booking page uses, and the server re-checks
 * the slot on submit in case someone else took it meanwhile.
 *
 * @param {{ booking: object | null, onClose: () => void, onDone: () => void }} props
 */
export default function RescheduleModal({ booking, onClose, onDone }) {
  const serviceId = booking?.service?._id;
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        setTime((current) => (next.some((s) => s.time === current && s.available) ? current : ''));
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

  const handleSubmit = async () => {
    if (!date || !time) return;
    setError('');
    setIsSubmitting(true);
    try {
      await bookingService.reschedule(booking._id, { bookingDate: date, bookingTime: time });
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not reschedule this booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={Boolean(booking)} onClose={onClose} title="Reschedule booking" size="lg">
      <div className="min-h-0 overflow-y-auto">
        <p className="text-sm text-text-muted">
          {booking?.service?.title}
          {booking?.status === 'accepted' &&
            ' — the provider will need to confirm the new time, so the booking goes back to pending.'}
        </p>

        <div className="mt-4 rounded-xl bg-surface-warm p-4">
          <Calendar value={date} onChange={setDate} />
        </div>

        <p className="mt-4 text-[12.5px] font-medium text-secondary">
          {date ? 'Available time slots' : 'Pick a date to see open times'}
        </p>
        {date &&
          (isLoadingSlots ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-warm" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-text-muted">No times could be loaded for this date.</p>
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
                  className={`rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
                    time === slot.time
                      ? 'border-secondary bg-secondary text-white'
                      : slot.available
                        ? 'border-border bg-surface text-secondary hover:border-primary'
                        : 'cursor-not-allowed border-transparent bg-surface-warm/60 text-text-muted line-through'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          ))}

        {error && <p className="mt-4 rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
      </div>

      <div className="mt-5 grid shrink-0 grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
        >
          Keep current time
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!date || !time || isSubmitting}
          className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Confirm new time'}
        </button>
      </div>
    </Modal>
  );
}
