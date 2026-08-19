import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaCheckCircle, FaDollarSign, FaTools } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { bookingService } from '@/services/bookingService';
import BookingCard from '@/components/cards/BookingCard';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import Button from '@/components/common/Button';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetch(() => bookingService.getProviderBookings(), []);
  const bookings = data?.data || [];

  const pending = bookings.filter((b) => b.status === 'pending');
  const active = bookings.filter((b) => ['accepted', 'on_the_way'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const totalEarnings = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const stats = [
    { label: 'New requests', value: pending.length, icon: FaTools, color: 'text-accent' },
    { label: 'Active jobs', value: active.length, icon: FaCalendarCheck, color: 'text-primary' },
    { label: 'Completed', value: completed.length, icon: FaCheckCircle, color: 'text-success' },
    { label: 'Total earned', value: `LKR ${totalEarnings.toLocaleString()}`, icon: FaDollarSign, color: 'text-secondary' },
  ];

  return (
    <ProviderLayout title="Overview">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-primary-light p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-[15px] font-bold text-secondary">Manage your listings</p>
          <p className="text-sm text-text-muted">Add a new service or update your existing ones.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/provider/services')}>
          Manage Services
        </Button>
      </div>

      <h2 className="mb-4 font-display text-lg font-bold text-secondary">Recent booking requests</h2>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}
      {!error && isLoading && (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}</div>
      )}
      {!error && !isLoading && bookings.length === 0 && (
        <EmptyState icon={<FaCalendarCheck size={22} />} title="No bookings yet" description="Once a customer books one of your services, it'll show up here." />
      )}
      {!error && !isLoading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.slice(0, 6).map((b) => <BookingCard key={b._id} booking={b} />)}
        </div>
      )}
    </ProviderLayout>
  );
}