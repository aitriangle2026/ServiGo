import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaStar, FaCheckCircle } from 'react-icons/fa';
import { FiCalendar, FiClock, FiBriefcase, FiCheckSquare } from 'react-icons/fi';
import useFetch from '@/hooks/useFetch';
import Modal from '@/components/common/Modal';
import { jobRequestService } from '@/services/jobRequestService';
import { formatCurrency } from '@/utils/formatCurrency';

const STATUS = {
  pending: null,
  accepted: { label: 'Accepted', classes: 'bg-success-light text-success' },
  rejected: { label: 'Declined', classes: 'bg-surface-warm text-text-muted' },
};

const providerName = (p) => `${p?.user?.firstName || ''} ${p?.user?.lastName || ''}`.trim() || 'Professional';
const formatDay = (value) =>
  value ? new Date(value).toLocaleDateString('en-LK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : null;

/**
 * The quotes professionals have sent on one job request. Accepting one books
 * that professional and closes the request to everyone else.
 *
 * @param {{ jobRequest: object, onAwarded: () => void }} props
 */
export default function ProposalsSection({ jobRequest, onAwarded }) {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useFetch(() => jobRequestService.getProposals(jobRequest._id), [jobRequest._id]);
  const proposals = data?.data || [];
  const [confirming, setConfirming] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const isOpen = jobRequest.status === 'open';

  const accept = async (proposal) => {
    setBusyId(proposal._id);
    try {
      const response = await jobRequestService.acceptProposal(proposal._id);
      toast.success(`Booked ${providerName(proposal.provider)}`);
      onAwarded();
      const bookingId = response?.data?.booking?._id;
      navigate(bookingId ? `/customer/bookings?highlight=${bookingId}` : '/customer/bookings');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not accept this quote.');
      setBusyId(null);
      setConfirming(null);
    }
  };

  const decline = async (proposal) => {
    setBusyId(proposal._id);
    try {
      await jobRequestService.rejectProposal(proposal._id);
      toast.success('Quote declined');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not decline this quote.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-base font-bold text-secondary">
        Quotes{proposals.length > 0 && ` (${proposals.length})`}
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        {isOpen
          ? 'Compare quotes from professionals. Accepting one books them at that price and closes the request.'
          : jobRequest.status === 'awarded'
            ? 'You accepted a quote — the booking is in My Bookings.'
            : 'This request is closed.'}
      </p>

      {isLoading && <div className="mt-4 h-28 animate-pulse rounded-xl bg-surface-warm" />}

      {!isLoading && proposals.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
          {isOpen ? "No quotes yet. Matching professionals have been notified — you'll get a notification when one arrives." : 'No quotes were received.'}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {proposals.map((proposal) => {
          const provider = proposal.provider;
          const photo = provider?.profileImage || provider?.user?.profileImage;
          const status = STATUS[proposal.status];
          const when = [formatDay(proposal.proposedDate), proposal.proposedTime].filter(Boolean).join(' · ');
          return (
            <li key={proposal._id} className={`rounded-xl border p-4 ${proposal.status === 'accepted' ? 'border-success/40' : 'border-border'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 gap-3">
                  {photo ? (
                    <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-light font-display text-xl text-primary">
                      {providerName(provider).charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[15px] font-medium text-secondary">
                      {provider?._id ? (
                        <Link to={`/providers/${provider._id}`} className="truncate hover:text-primary">
                          {providerName(provider)}
                        </Link>
                      ) : (
                        providerName(provider)
                      )}
                      {provider?.isVerified && <FaCheckCircle className="shrink-0 text-success" title="Verified" />}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      {provider?.totalReviews > 0 ? (
                        <span className="flex items-center gap-1">
                          <FaStar className="text-accent" /> {provider.averageRating.toFixed(1)} ({provider.totalReviews})
                        </span>
                      ) : (
                        <span>No reviews yet</span>
                      )}
                      <span className="flex items-center gap-1">
                        <FiCheckSquare /> {provider?.completedJobs || 0} jobs done
                      </span>
                      {provider?.experience > 0 && (
                        <span className="flex items-center gap-1">
                          <FiBriefcase /> {provider.experience} yrs
                        </span>
                      )}
                    </p>
                    {when && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text">
                        <FiCalendar className="text-text-muted" /> {when}
                      </p>
                    )}
                    {!when && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text-muted">
                        <FiClock /> Timing flexible
                      </p>
                    )}
                    {proposal.message && <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-text">{proposal.message}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <p className="text-lg font-medium text-secondary">{formatCurrency(proposal.amount)}</p>
                  {status && <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${status.classes}`}>{status.label}</span>}
                  {isOpen && proposal.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => decline(proposal)}
                        className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-secondary hover:border-danger hover:text-danger disabled:opacity-60"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => setConfirming(proposal)}
                        className="rounded-lg bg-secondary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary disabled:opacity-60"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal isOpen={Boolean(confirming)} onClose={() => busyId === null && setConfirming(null)} title="Accept this quote?" size="sm">
        {confirming && (
          <>
            <p className="text-sm leading-relaxed text-text-muted">
              {providerName(confirming.provider)} will be booked for {formatCurrency(confirming.amount)}
              {formatDay(confirming.proposedDate) && ` on ${formatDay(confirming.proposedDate)}`}
              {confirming.proposedTime && ` at ${confirming.proposedTime}`}. Payment is cash on service. The other quotes will be
              declined and the request closed.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={busyId !== null}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary hover:bg-surface-warm"
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={() => accept(confirming)}
                disabled={busyId !== null}
                className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-primary disabled:opacity-60"
              >
                {busyId ? 'Booking…' : 'Accept & book'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
