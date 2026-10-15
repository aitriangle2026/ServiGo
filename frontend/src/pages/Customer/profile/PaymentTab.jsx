import { FiDollarSign, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { Panel } from './fields';

// No card gateway is connected (README → Known gaps), so there's nothing to
// save here yet. This states what actually works rather than showing an
// "Add card" form that can't do anything.
export default function PaymentTab() {
  return (
    <Panel title="Payment Methods" description="How you pay for bookings.">
      <div className="space-y-3">
        <div className="flex items-center gap-4 rounded-xl border border-primary/40 bg-primary-light/40 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-primary">
            <FiDollarSign />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-secondary">Cash on Service</p>
            <p className="text-[13px] text-text-muted">Pay the professional when the job is done.</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <FiCheckCircle /> Active
          </span>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border p-4 opacity-70">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-warm text-secondary">
            <FiCreditCard />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-secondary">Credit / Debit Card</p>
            <p className="text-[13px] text-text-muted">Card payments aren't available yet.</p>
          </div>
          <span className="rounded-md bg-surface-warm px-2 py-1 text-[11px] font-medium text-text-muted">Coming soon</span>
        </div>
      </div>
    </Panel>
  );
}
