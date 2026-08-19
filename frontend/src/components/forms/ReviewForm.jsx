import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { reviewService } from '@/services/reviewService';

export default function ReviewForm({ booking, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setIsSaving(true);
    try {
      await reviewService.create({
        booking: booking._id,
        rating,
        review,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit your review.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${booking?.service?.title || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-secondary">Your rating</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl transition-transform hover:scale-110"
              >
                <FaStar className={(hoverRating || rating) >= star ? 'text-accent' : 'text-slate-200'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-secondary">Your review (optional)</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows="4"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="How was your experience?"
          />
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
          Submit Review
        </Button>
      </form>
    </Modal>
  );
}