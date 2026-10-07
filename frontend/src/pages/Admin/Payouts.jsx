import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import Button from '@/components/common/Button';
import useFetch from '@/hooks/useFetch';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/utils/formatCurrency';

export default function AdminPayouts() {
  const { data, isLoading, error, refetch } = useFetch(() => invoiceService.pendingPayouts(), []);
  const invoices = data?.data || [];
  const [releasingId, setReleasingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleRelease = async (id) => {
    setReleasingId(id);
    setActionError('');
    try {
      await invoiceService.release(id);
      refetch();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not release this payout.');
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <AdminLayout title="Payouts">
      <p className="mb-6 text-sm text-text-muted">
        Invoices customers have paid for — funds are held here until you release each provider's share
        (invoice total minus platform commission).
      </p>

      {actionError && (
        <p className="mb-4 rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">
          {actionError}
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!error && !isLoading && invoices.length === 0 && (
        <p className="text-sm text-text-muted">No payouts waiting right now.</p>
      )}

      {!error && !isLoading && invoices.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3">Commission</th>
                <th className="px-5 py-3">Payout</th>
                <th className="px-5 py-3">Paid on</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => {
                const providerName = inv.provider?.user
                  ? `${inv.provider.user.firstName || ''} ${inv.provider.user.lastName || ''}`.trim()
                  : '—';
                const customerName = inv.customer
                  ? `${inv.customer.firstName || ''} ${inv.customer.lastName || ''}`.trim()
                  : '—';
                return (
                  <tr key={inv._id}>
                    <td className="px-5 py-3 font-medium text-secondary">{providerName}</td>
                    <td className="px-5 py-3 text-text-muted">{customerName}</td>
                    <td className="px-5 py-3 font-medium text-secondary">{formatCurrency(inv.subtotal)}</td>
                    <td className="px-5 py-3 text-text-muted">
                      {formatCurrency(inv.commissionAmount)}{' '}
                      <span className="text-xs">({((inv.commissionRate || 0) * 100).toFixed(0)}%)</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-success">{formatCurrency(inv.providerPayoutAmount)}</td>
                    <td className="px-5 py-3 text-text-muted">
                      {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-LK') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={releasingId === inv._id}
                        onClick={() => handleRelease(inv._id)}
                      >
                        Release payout
                      </Button>
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