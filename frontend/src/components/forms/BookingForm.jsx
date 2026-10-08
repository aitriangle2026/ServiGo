import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { bookingService } from '@/services/bookingService';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * @param {{
 *   service: object, isOpen?: boolean, onClose: () => void,
 *   initialDate?: string, initialTime?: string, onSuccess?: () => void,
 * }} props `initialDate`/`initialTime` come from the detail page's slot
 *   picker. When a slot was chosen there, it is shown back as a summary
 *   rather than re-asked: the slot label ("09:00 AM") is also what the
 *   availability endpoint matches on, and a native time input would submit
 *   "09:00" instead, quietly breaking the booked-slot check.
 */
export default function BookingForm({
  service,
  isOpen = true,
  onClose,
  initialDate = '',
  initialTime = '',
  onSuccess,
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    bookingDate: initialDate,
    bookingTime: initialTime,
    address: '',
    notes: '',
  });

  // A slot picked upstream is fixed here; only address and notes are asked.
  const hasPickedSlot = Boolean(initialDate && initialTime);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      onClose();
      navigate('/login');
      return;
    }

    if (!form.bookingDate || !form.bookingTime || !form.address.trim()) {
      setError('Please fill in date, time, and address.');
      return;
    }

    setIsSaving(true);
    try {
      await bookingService.create({
        service: service._id || service.id,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        address: form.address,
        notes: form.notes,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ bookingDate: initialDate, bookingTime: initialTime, address: '', notes: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={success ? 'Booking requested!' : `Book: ${service?.title || ''}`}>
      {success ? (
        <div className="text-center">
          <p className="text-sm text-text-muted">
            Your booking request has been sent to the provider. You can track its status from your dashboard.
          </p>
          <Button variant="primary" fullWidth className="mt-5" onClick={() => { handleClose(); navigate('/customer/bookings'); }}>
            View My Bookings
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>
          )}

          {hasPickedSlot ? (
            <div className="rounded-xl bg-surface-warm px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Your slot
              </p>
              <p className="mt-1 text-sm font-semibold text-secondary">
                {new Date(`${form.bookingDate}T00:00:00`).toLocaleDateString('en-LK', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' at '}
                {form.bookingTime}
              </p>
            </div>
          ) : (
            <>
              <Input
                label="Date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.bookingDate}
                onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))}
              />

              <Input
                label="Time"
                type="time"
                value={form.bookingTime}
                onChange={(e) => setForm((f) => ({ ...f, bookingTime: e.target.value }))}
              />
            </>
          )}

          <Input
            label="Address"
            placeholder="Where should the provider come?"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows="3"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Anything the provider should know?"
            />
          </div>

          <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm text-secondary">
            Total: <span className="font-bold">{formatCurrency(service?.price)}</span>
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
            {isAuthenticated ? 'Confirm Booking' : 'Log in to Book'}
          </Button>
        </form>
      )}
    </Modal>
  );
}