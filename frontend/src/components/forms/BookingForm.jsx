import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { bookingService } from '@/services/bookingService';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BookingForm({ service, isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    bookingDate: '',
    bookingTime: '',
    address: '',
    notes: '',
  });
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
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ bookingDate: '', bookingTime: '', address: '', notes: '' });
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
            Total: <span className="font-bold">Rs. {service?.price?.toLocaleString()}</span>
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
            {isAuthenticated ? 'Confirm Booking' : 'Log in to Book'}
          </Button>
        </form>
      )}
    </Modal>
  );
}