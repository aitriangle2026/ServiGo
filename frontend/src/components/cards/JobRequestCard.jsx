import { FaMapMarkerAlt, FaCalendarAlt, FaPaperclip } from 'react-icons/fa';
import Badge from '@/components/common/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

const STATUS_STYLES = {
  open: { label: 'Open', variant: 'accent' },
  awarded: { label: 'Awarded', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};

/**
 * One posted job request — used on the customer's "My Job Requests" list
 * and the provider's "Browse Job Requests" list. `actions` (optional) lets
 * each page slot in its own buttons (View Proposals / Submit Proposal)
 * without this card needing to know which role is viewing it.
 */
export default function JobRequestCard({ jobRequest, actions, showCustomer = false }) {
  const status = STATUS_STYLES[jobRequest.status] || STATUS_STYLES.open;
  const customerName = jobRequest.customer
    ? `${jobRequest.customer.firstName || ''} ${jobRequest.customer.lastName || ''}`.trim()
    : '';
  const locationLabel = [jobRequest.location?.city, jobRequest.location?.district, jobRequest.location?.country]
    .filter(Boolean)
    .join(', ');
  const formattedDate = jobRequest.preferredDate
    ? new Date(jobRequest.preferredDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Flexible';

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
              {jobRequest.category?.name || 'General'}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
            {typeof jobRequest.proposalCount === 'number' && (
              <span className="text-xs text-text-muted">
                {jobRequest.proposalCount} proposal{jobRequest.proposalCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {showCustomer && customerName && (
            <p className="mt-1 text-sm text-text-muted">Posted by {customerName}</p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-secondary">{jobRequest.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-primary" /> {formattedDate}
            </span>
            {locationLabel && (
              <span className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-primary" />
                <span className="max-w-[220px] truncate">{locationLabel}</span>
              </span>
            )}
            {jobRequest.attachments?.length > 0 && (
              <span className="flex items-center gap-1.5">
                <FaPaperclip className="text-primary" /> {jobRequest.attachments.length}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          {jobRequest.budget != null && (
            <p className="font-display text-base font-extrabold text-secondary">
              {formatCurrency(jobRequest.budget)}
            </p>
          )}
          {jobRequest.budget == null && <p className="text-xs text-text-muted">Budget open</p>}
        </div>
      </div>

      {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{actions}</div>}
    </div>
  );
}