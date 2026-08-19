import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaCheckCircle, FaHeart, FaSearch } from 'react-icons/fa';
import DashboardLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import { bookingService } from '@/services/bookingService';
import BookingCard from '@/components/cards/BookingCard';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';

export default function CustomerDashboard() {
  const navigate = useNavigate();

  // Real backend call — GET /bookings/customer
  const { data, isLoading, error } = useFetch(() => bookingService.getMyBookings(), []);

  const bookings = data?.data || [];
  const upcoming = bookings.filter((b) => ['pending', 'accepted', 'on_the_way'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const totalSpent = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const stats = [
    { label: 'Upcoming', value: upcoming.length, icon: FaCalendarCheck, color: 'text-primary' },
    { label: 'Completed', value: completed.length, icon: FaCheckCircle, color: 'text-success' },
    { label: 'Total spent', value: `LKR ${totalSpent.toLocaleString()}`, icon: FaHeart, color: 'text-accent' },
  ];

  return (
    <DashboardLayout title="Overview">
      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{stat.label}</span>
                <Icon className={stat.color} />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-secondary">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-primary-light p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-[15px] font-bold text-secondary">Need something done?</p>
          <p className="text-sm text-text-muted">Browse services or find a trusted pro near you.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={FaSearch} onClick={() => navigate('/find-pros')}>
            Find Pros
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/services')}>
            Browse Services
          </Button>
        </div>
      </div>

      {/* Recent bookings */}
      <h2 className="mb-4 font-display text-lg font-bold text-secondary">Recent bookings</h2>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !isLoading && bookings.length === 0 && (
        <EmptyState
          icon={<FaCalendarCheck size={22} />}
          title="No bookings yet"
          description="Once you book a service, it'll show up here so you can track it."
          actionLabel="Browse services"
          onAction={() => navigate('/services')}
        />
      )}

      {!error && !isLoading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.slice(0, 6).map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}