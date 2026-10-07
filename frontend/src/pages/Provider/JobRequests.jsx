import { useState } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import ProviderLayout from '@/layouts/ProviderLayout';
import JobRequestCard from '@/components/cards/JobRequestCard';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import Button from '@/components/common/Button';
import useFetch from '@/hooks/useFetch';
import { jobRequestService } from '@/services/jobRequestService';

const PAGE_SIZE = 10;

/**
 * Open job requests matched to this provider — the backend scopes them to
 * the categories the provider offers and the country they work in (see
 * jobRequest.service.js getRelevantJobRequests), so there's nothing to
 * filter client-side.
 */
export default function ProviderJobRequests() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useFetch(
    () => jobRequestService.getRelevant({ page, limit: PAGE_SIZE }),
    [page]
  );

  const jobRequests = data?.data || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  return (
    <ProviderLayout title="Job Requests">
      <p className="mb-6 text-sm text-text-muted">
        Jobs customers have posted in your country, in the categories you offer.
        {total > 0 && ` ${total} open right now.`}
      </p>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !isLoading && jobRequests.length === 0 && (
        <EmptyState
          icon={<FaClipboardList size={22} />}
          title="No job requests right now"
          description="When a customer posts a job in one of your categories, it'll show up here and you'll get a notification."
        />
      )}

      {!error && !isLoading && jobRequests.length > 0 && (
        <>
          <div className="space-y-4">
            {jobRequests.map((jr) => (
              <JobRequestCard key={jr._id} jobRequest={jr} showCustomer />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </ProviderLayout>
  );
}
