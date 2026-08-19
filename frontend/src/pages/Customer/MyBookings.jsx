import { useState } from 'react';
import CustomerLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import { bookingService } from '@/services/bookingService';
import BookingCard from '@/components/cards/BookingCard';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import { FaCalendarCheck } from 'react-icons/fa';
import ReviewForm from '@/components/forms/ReviewForm';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('all');
  const { data, isLoading, error } = useFetch(() => bookingService.getMyBookings(), []);
  const bookings = data?.data || [];
  const [reviewBooking, setReviewBooking] = useState(null);

  const filtered = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return ['pending', 'accepted', 'on_the_way'].includes(b.status);
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'rejected'].includes(b.status);
    return true;
  });

  return (
    <CustomerLayout title="My Bookings">
      <div className="mb-6 flex gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      )}

      {!error && !isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<FaCalendarCheck size={22} />}
          title="No bookings here"
          description="Nothing matches this filter yet."
        />
      )}

      {!error && !isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingCard key={booking._id} booking={booking} onReview={setReviewBooking} />
          ))}
        </div>
      )}

      {reviewBooking && (
        <ReviewForm
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => setReviewBooking(null)}
        />
      )}
      
    </CustomerLayout>
  );
}