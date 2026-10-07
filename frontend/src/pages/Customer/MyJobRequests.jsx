import { useNavigate } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import { jobRequestService } from '@/services/jobRequestService';
import JobRequestCard from '@/components/cards/JobRequestCard';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import Button from '@/components/common/Button';
import { FaClipboardList, FaPlus } from 'react-icons/fa';

export default function MyJobRequests() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetch(() => jobRequestService.getMine(), []);
  const jobRequests = data?.data || [];

  return (
    <CustomerLayout title="My Job Requests">
      <div className="mb-6 flex justify-end">
        <Button variant="primary" icon={FaPlus} onClick={() => navigate('/customer/job-requests/new')}>
          Post a job request
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}</div>
      )}

      {!error && !isLoading && jobRequests.length === 0 && (
        <EmptyState
          icon={<FaClipboardList size={22} />}
          title="No job requests yet"
          description="Post what you need done and get quotes from local providers."
          actionLabel="Post a job request"
          onAction={() => navigate('/customer/job-requests/new')}
        />
      )}

      {!error && !isLoading && jobRequests.length > 0 && (
        <div className="space-y-4">
          {jobRequests.map((jr) => (
            <div key={jr._id} onClick={() => navigate(`/customer/job-requests/${jr._id}`)} className="cursor-pointer">
              <JobRequestCard jobRequest={jr} />
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}