import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import useFetch from '@/hooks/useFetch';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/utils/formatCurrency';

export default function AdminInvoices() {
  const { data, isLoading, error, refetch } = useFetch(() => invoiceService.pendingAdminReview(), []);
  const invoices = data?.data || [];
  const [busyId, setBusyId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');

  const handleApprove = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await invoiceService.adminReview(id, { action: 'approve' });
      refetch();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not approve this invoice.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await invoiceService.adminReview(id, { action: 'reject', rejectionReason: reason });
      setDecliningId(null);
      setReason('');
      refetch();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not reject this invoice.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title="Invoices">
      <p className="mb-6 text-sm text-text-muted">
        Invoices providers have sent — review each one before it becomes visible to the customer as an
        actionable quote.
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
        <p className="text-sm text-text-muted">No invoices waiting for review right now.</p>
      )}

      {!error && !isLoading && invoices.length > 0 && (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const providerName = inv.provider?.user
              ? `${inv.provider.user.firstName || ''} ${inv.provider.user.lastName || ''}`.trim()
              : '—';
            const customerName = inv.customer
              ? `${inv.customer.firstName || ''} ${inv.customer.lastName || ''}`.trim()
              : '—';

            return (
              <div key={inv._id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-secondary">{providerName} → {customerName}</p>
                    {inv.service?.title && <p className="text-xs text-text-muted">Re: {inv.service.title}</p>}
                  </div>
                  <p className="font-display text-lg font-bold text-secondary">{formatCurrency(inv.subtotal)}</p>
                </div>

                <div className="mt-3 space-y-1 border-t border-border pt-3">
                  {inv.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm text-text-muted">
                      <span>{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>

                {inv.notes && <p className="mt-2 text-xs text-text-muted">Notes: {inv.notes}</p>}

                {decliningId === inv._id ? (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <Input
                      placeholder="Reason for rejecting (optional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setDecliningId(null); setReason(''); }} disabled={busyId === inv._id}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" isLoading={busyId === inv._id} onClick={() => handleReject(inv._id)}>
                        Confirm rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" onClick={() => setDecliningId(inv._id)} disabled={busyId === inv._id}>
                      Reject
                    </Button>
                    <Button variant="primary" size="sm" isLoading={busyId === inv._id} onClick={() => handleApprove(inv._id)}>
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}