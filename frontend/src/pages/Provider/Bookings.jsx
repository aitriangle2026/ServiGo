import { useState } from 'react';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import useHighlight from '@/hooks/useHighlight';
import { bookingService } from '@/services/bookingService';
import BookingCard from '@/components/cards/BookingCard';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import Button from '@/components/common/Button';
import { FaCalendarCheck } from 'react-icons/fa';

const NEXT_STATUS = {
  pending: [{ label: 'Accept', value: 'accepted', variant: 'primary' }, { label: 'Reject', value: 'rejected', variant: 'danger' }],
  accepted: [{ label: 'Mark on the way', value: 'on_the_way', variant: 'primary' }],
  on_the_way: [{ label: 'Mark completed', value: 'completed', variant: 'primary' }],
};

export default function ProviderBookings() {
  const { data, isLoading, error, refetch } = useFetch(() => bookingService.getProviderBookings(), []);
  const [updatingId, setUpdatingId] = useState(null);
  const bookings = data?.data || [];

  // Scrolls to and flags the booking a notification linked to.
  const { isHighlighted } = useHighlight(bookings);

  const handleUpdate = async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      await bookingService.updateStatus(bookingId, status);
      refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ProviderLayout title="Bookings">
      {error && <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}

      {!error && isLoading && <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)}</div>}

      {!error && !isLoading && bookings.length === 0 && (
        <EmptyState icon={<FaCalendarCheck size={22} />} title="No bookings yet" description="Booking requests from customers will appear here." />
      )}

      {!error && !isLoading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              id={`item-${booking._id}`}
              className={`rounded-2xl border border-border bg-surface p-5 transition-shadow ${
                isHighlighted(booking._id) ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            >
              <BookingCard booking={booking} />
              {NEXT_STATUS[booking.status] && (
                <div className="mt-4 flex gap-2 border-t border-border pt-4">
                  {NEXT_STATUS[booking.status].map((action) => (
                    <Button
                      key={action.value}
                      variant={action.variant}
                      size="sm"
                      isLoading={updatingId === booking._id}
                      onClick={() => handleUpdate(booking._id, action.value)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ProviderLayout>
  );
}