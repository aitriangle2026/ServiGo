import { useState } from 'react';
import { FaFileInvoiceDollar, FaCheck, FaTimes } from 'react-icons/fa';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/utils/formatCurrency';

const STATUS_STYLE = {
  pending_admin: 'bg-slate-100 text-text-muted',
  rejected_by_admin: 'bg-danger-light text-danger',
  awaiting_customer: 'bg-accent-light text-accent',
  approved: 'bg-primary-light text-primary',
  rejected: 'bg-danger-light text-danger',
  paid: 'bg-success-light text-success',
  payout_released: 'bg-success-light text-success',
};

const STATUS_LABEL = {
  pending_admin: 'Awaiting ServiGo review',
  rejected_by_admin: 'Rejected by ServiGo',
  awaiting_customer: 'Awaiting response',
  approved: 'Approved — awaiting payment',
  rejected: 'Declined',
  paid: 'Paid — held by ServiGo',
  payout_released: 'Paid out to provider',
};

/**
 * @param {{ invoice: object, viewerRole: 'customer'|'provider', onUpdated: (invoice:object) => void }} props
 */
export default function InvoiceCard({ invoice, viewerRole, onUpdated }) {
  const [isDeclining, setIsDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [address, setAddress] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  if (!invoice) return null;

  const respond = async (action) => {
    setError('');
    setIsBusy(true);
    try {
      const { data } = await invoiceService.respond(invoice._id, { action, rejectionReason: reason });
      onUpdated?.(data);
      setIsDeclining(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsBusy(false);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Enter the address for this job.');
      return;
    }
    setError('');
    setIsBusy(true);
    try {
      const { data } = await invoiceService.pay(invoice._id, { address });
      onUpdated?.(data.invoice);
      setIsPaying(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment could not be completed.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:w-80">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
          <FaFileInvoiceDollar className="text-primary" /> Invoice
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[invoice.status] || ''}`}>
          {STATUS_LABEL[invoice.status] || invoice.status}
        </span>
      </div>

      <div className="space-y-1.5 px-4 py-3">
        {invoice.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{item.description}</span>
            <span className="font-medium text-secondary">{formatCurrency(item.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-bold">
          <span className="text-secondary">Total</span>
          <span className="text-secondary">{formatCurrency(invoice.subtotal)}</span>
        </div>
        {invoice.notes && <p className="pt-1 text-xs text-text-muted">{invoice.notes}</p>}
        {(invoice.proposedDate || invoice.proposedTime) && (
          <p className="pt-1 text-xs text-text-muted">
            Proposed: {invoice.proposedDate ? new Date(invoice.proposedDate).toLocaleDateString() : ''}{' '}
            {invoice.proposedTime}
          </p>
        )}

        {invoice.status === 'rejected' && invoice.rejectionReason && (
          <p className="rounded-lg bg-danger-light p-2 text-xs text-danger">Reason: {invoice.rejectionReason}</p>
        )}

        {invoice.status === 'rejected_by_admin' && viewerRole === 'provider' && (
          <p className="rounded-lg bg-danger-light p-2 text-xs text-danger">
            ServiGo rejected this invoice before it reached the customer
            {invoice.adminRejectionReason ? `: ${invoice.adminRejectionReason}` : '.'}
          </p>
        )}

        {invoice.status === 'pending_admin' && viewerRole === 'provider' && (
          <p className="rounded-lg bg-slate-100 p-2 text-xs text-text-muted">
            Sent to ServiGo for review — the customer will see it once it's approved.
          </p>
        )}

        {invoice.status === 'payout_released' && viewerRole === 'provider' && (
          <p className="rounded-lg bg-success-light p-2 text-xs text-success">
            You received {formatCurrency(invoice.providerPayoutAmount)} (ServiGo commission:{' '}
            {formatCurrency(invoice.commissionAmount)})
          </p>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      {/* Customer: respond to an admin-approved invoice */}
      {viewerRole === 'customer' && invoice.status === 'awaiting_customer' && !isDeclining && (
        <div className="flex gap-2 border-t border-border p-3">
          <Button variant="outline" size="sm" fullWidth onClick={() => setIsDeclining(true)} disabled={isBusy}>
            <FaTimes size={11} className="mr-1" /> Decline
          </Button>
          <Button variant="primary" size="sm" fullWidth onClick={() => respond('approve')} isLoading={isBusy}>
            <FaCheck size={11} className="mr-1" /> Approve
          </Button>
        </div>
      )}

      {viewerRole === 'customer' && invoice.status === 'awaiting_customer' && isDeclining && (
        <div className="space-y-2 border-t border-border p-3">
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" fullWidth onClick={() => setIsDeclining(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={() => respond('reject')} isLoading={isBusy}>
              Confirm decline
            </Button>
          </div>
        </div>
      )}

      {/* Customer: pay an approved invoice */}
      {viewerRole === 'customer' && invoice.status === 'approved' && !isPaying && (
        <div className="border-t border-border p-3">
          <Button variant="primary" size="sm" fullWidth onClick={() => setIsPaying(true)}>
            Pay {formatCurrency(invoice.subtotal)}
          </Button>
        </div>
      )}

      {viewerRole === 'customer' && invoice.status === 'approved' && isPaying && (
        <form onSubmit={submitPayment} className="space-y-2 border-t border-border p-3">
          <Input
            placeholder="Address for this job"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <p className="text-[11px] text-text-muted">
            Payment is held by ServiGo and released to the provider (minus commission) once the job is confirmed.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" fullWidth type="button" onClick={() => setIsPaying(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" fullWidth type="submit" isLoading={isBusy}>
              Confirm payment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}