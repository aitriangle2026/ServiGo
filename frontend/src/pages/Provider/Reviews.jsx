import ProviderLayout from '@/layouts/ProviderLayout';
import useFetch from '@/hooks/useFetch';
import { providerService } from '@/services/providerService';
import { reviewService } from '@/services/reviewService';
import { useState, useEffect } from 'react';
import EmptyState from '@/components/common/EmptyState';
import { FaStar, FaRegStar } from 'react-icons/fa';

export default function ProviderReviews() {
  const { data: profileData } = useFetch(() => providerService.getMyProfile(), []);
  const providerId = profileData?.data?._id;

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    reviewService.getByProvider(providerId).then((res) => {
      setReviews(res.data || []);
      setIsLoading(false);
    });
  }, [providerId]);

  return (
    <ProviderLayout title="Reviews">
      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!isLoading && reviews.length === 0 && (
        <EmptyState icon={<FaStar size={22} />} title="No reviews yet" description="Reviews from customers will appear here after completed jobs." />
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (i < r.rating ? <FaStar key={i} /> : <FaRegStar key={i} className="text-slate-300" />))}
              </div>
              <p className="mt-2 text-sm text-secondary">{r.review}</p>
              <p className="mt-2 text-xs text-text-muted">
                {r.customer?.firstName} {r.customer?.lastName} · {r.service?.title}
              </p>
            </div>
          ))}
        </div>
      )}
    </ProviderLayout>
  );
}