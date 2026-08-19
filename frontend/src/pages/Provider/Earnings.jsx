import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { bookingService } from '@/services/bookingService';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';

export default function ProviderEarnings() {
  const { data, isLoading, error } = useFetch(() => bookingService.getProviderBookings(), []);
  const bookings = data?.data || [];
  const completed = bookings.filter((b) => b.status === 'completed');
  const total = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <ProviderLayout title="Earnings">
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-text-muted">Total earned (all-time, from completed jobs)</p>
        <p className="mt-2 font-display text-3xl font-extrabold text-secondary">LKR {total.toLocaleString()}</p>
        <p className="mt-3 text-xs text-text-muted">
          Note: this is calculated from your completed bookings — there's no separate payments API yet,
          so actual payout status/history isn't tracked here.
        </p>
      </div>

      {error && <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">{error}</div>}
      {!error && isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}</div>}

      {!error && !isLoading && completed.length > 0 && (
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {completed.map((b) => (
            <div key={b._id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-secondary">{b.service?.title}</p>
                <p className="text-xs text-text-muted">{new Date(b.bookingDate).toLocaleDateString('en-LK')}</p>
              </div>
              <p className="font-display font-bold text-secondary">LKR {b.totalPrice?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </ProviderLayout>
  );
}