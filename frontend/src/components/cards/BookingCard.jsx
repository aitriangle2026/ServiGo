import { FaMapMarkerAlt, FaClock, FaCalendarAlt } from 'react-icons/fa';
import Badge from '@/components/common/Badge';

const STATUS_STYLES = {
  pending: { label: 'Pending', variant: 'accent' },
  accepted: { label: 'Accepted', variant: 'primary' },
  on_the_way: { label: 'On the way', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};

/**
 * @param {{ booking: {
 *   _id: string, bookingDate: string, bookingTime: string, address: string,
 *   totalPrice: number, status: string,
 *   service: { title: string, price?: number },
 *   provider: { user?: { firstName: string, lastName: string } },
 * } }} props
 */
export default function BookingCard({ booking, onReview }) {
  const status = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  const providerName = booking.provider?.user
    ? `${booking.provider.user.firstName} ${booking.provider.user.lastName}`
    : 'Provider';

  const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-LK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-[15px] font-bold text-secondary">
            {booking.service?.title || 'Service'}
          </h3>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-text-muted">with {providerName}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <FaCalendarAlt className="text-primary" /> {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <FaClock className="text-primary" /> {booking.bookingTime}
          </span>
          <span className="flex items-center gap-1.5">
            <FaMapMarkerAlt className="text-primary" />
            <span className="max-w-[180px] truncate">{booking.address}</span>
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-display text-lg font-extrabold text-secondary">
          LKR {booking.totalPrice?.toLocaleString()}
        </p>
        {booking.status === 'completed' && onReview && (
          <button
            onClick={() => onReview(booking)}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            {booking.hasReview ? 'View review' : 'Leave a review'}
          </button>
        )}
      </div>
    </div>
  );
}