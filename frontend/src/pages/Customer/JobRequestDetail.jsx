import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaPaperclip,
  FaWallet,
} from 'react-icons/fa';
import CustomerLayout from '@/layouts/CustomerLayout';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Spinner from '@/components/common/Spinner';
import useFetch from '@/hooks/useFetch';
import { jobRequestService } from '@/services/jobRequestService';
import { formatCurrency } from '@/utils/formatCurrency';

const STATUS_STYLES = {
  open: { label: 'Open for quotes', variant: 'accent' },
  awarded: { label: 'Awarded', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};

// Cloudinary serves job-request attachments from both the image and raw
// pipelines (see jobRequest.controller.js), so decide on the URL rather
// than assuming everything is previewable.
const isImageUrl = (url) => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url);

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-0.5 text-sm text-secondary">{value}</p>
      </div>
    </div>
  );
}

export default function JobRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useFetch(() => jobRequestService.getById(id), [id]);
  const jobRequest = data?.data;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const handleCancel = async () => {
    setCancelError('');
    setIsCancelling(true);
    try {
      await jobRequestService.cancel(id);
      setIsConfirmOpen(false);
      await refetch();
    } catch (err) {
      setCancelError(err?.response?.data?.message || 'Could not cancel this job request.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout title="Job Request">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </CustomerLayout>
    );
  }

  if (error || !jobRequest) {
    return (
      <CustomerLayout title="Job Request">
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error || 'Job request not found.'}
        </div>
        <div className="mt-6">
          <Button variant="outline" icon={FaArrowLeft} onClick={() => navigate('/customer/job-requests')}>
            Back to my job requests
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const status = STATUS_STYLES[jobRequest.status] || STATUS_STYLES.open;
  const locationLabel =
    [jobRequest.location?.city, jobRequest.location?.district, jobRequest.location?.country]
      .filter(Boolean)
      .join(', ') || 'Not specified';
  const postedOn = new Date(jobRequest.createdAt).toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const preferredDate = jobRequest.preferredDate
    ? new Date(jobRequest.preferredDate).toLocaleDateString('en-LK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Flexible';

  return (
    <CustomerLayout title="Job Request">
      <button
        onClick={() => navigate('/customer/job-requests')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-secondary"
      >
        <FaArrowLeft size={12} /> Back to my job requests
      </button>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
              {jobRequest.category?.name || 'General'}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-xs text-text-muted">Posted {postedOn}</span>
          </div>

          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-secondary">
            {jobRequest.description}
          </p>

          <div className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
            <DetailRow icon={FaMapMarkerAlt} label="Location" value={locationLabel} />
            <DetailRow
              icon={FaWallet}
              label="Budget"
              value={jobRequest.budget != null ? formatCurrency(jobRequest.budget) : 'Open to quotes'}
            />
            <DetailRow icon={FaCalendarAlt} label="Preferred date" value={preferredDate} />
            <DetailRow
              icon={FaClock}
              label="Preferred time"
              value={jobRequest.preferredTime || 'Flexible'}
            />
          </div>
        </div>

        {jobRequest.attachments?.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-display text-base font-bold text-secondary">
              Attachments ({jobRequest.attachments.length})
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {jobRequest.attachments.map((url, index) =>
                isImageUrl(url) ? (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="h-24 w-24 rounded-xl border border-border object-cover"
                    />
                  </a>
                ) : (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-secondary hover:border-primary hover:text-primary"
                  >
                    <FaPaperclip className="text-primary" /> Attachment {index + 1}
                  </a>
                )
              )}
            </div>
          </div>
        )}

        {jobRequest.status === 'open' && (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-display text-base font-bold text-secondary">Cancel this request</h2>
            <p className="mt-1 text-sm text-text-muted">
              Providers in your area will stop seeing it, and any quotes you've received will be declined.
            </p>
            <Button variant="danger" className="mt-4" onClick={() => setIsConfirmOpen(true)}>
              Cancel job request
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !isCancelling && setIsConfirmOpen(false)}
        title="Cancel this job request?"
        size="sm"
      >
        <p className="text-sm text-text-muted">
          This can't be undone. Providers will stop seeing your request and any quotes already sent will
          be declined.
        </p>

        {cancelError && <p className="mt-3 text-sm text-danger">{cancelError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isCancelling}>
            Keep it
          </Button>
          <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>
            Yes, cancel it
          </Button>
        </div>
      </Modal>
    </CustomerLayout>
  );
}
