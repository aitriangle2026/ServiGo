import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import useFetch from '@/hooks/useFetch';
import axios from '@/api/axios';

const adminBookingService = {
  getAll: async (params) => {
    const { data } = await axios.get('/bookings', { params });
    return data;
  },
};

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'On the way', value: 'on_the_way' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-accent',
  accepted: 'bg-primary-light text-primary',
  on_the_way: 'bg-primary-light text-primary',
  completed: 'bg-success-light text-success',
  rejected: 'bg-danger-light text-danger',
  cancelled: 'bg-slate-100 text-text-muted',
};

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useFetch(
    () => adminBookingService.getAll({ status: statusFilter || undefined, limit: 50 }),
    [statusFilter]
  );

  const bookings = data?.data || [];

  return (
    <AdminLayout title="Bookings">
      <div className="mb-6 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-text-muted hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && bookings.length === 0 && (
        <p className="text-sm text-text-muted">No bookings found.</p>
      )}

      {!error && !isLoading && bookings.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => {
                const customerName = b.customer
                  ? `${b.customer.firstName || ''} ${b.customer.lastName || ''}`.trim()
                  : '—';
                const providerName = b.provider?.user
                  ? `${b.provider.user.firstName || ''} ${b.provider.user.lastName || ''}`.trim()
                  : '—';
                return (
                  <tr key={b._id}>
                    <td className="px-5 py-3 font-medium text-secondary">{b.service?.title || '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{customerName}</td>
                    <td className="px-5 py-3 text-text-muted">{providerName}</td>
                    <td className="px-5 py-3 text-text-muted">
                      {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-LK') : '—'} {b.bookingTime}
                    </td>
                    <td className="px-5 py-3 font-medium text-secondary">
                      LKR {b.totalPrice?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.status] || 'bg-slate-100 text-text-muted'}`}>
                        {b.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}