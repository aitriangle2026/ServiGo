import CustomerLayout from '@/layouts/CustomerLayout';
import useFetch from '@/hooks/useFetch';
import { favoriteService } from '@/services/favoriteService';
import ServiceCard from '@/components/cards/ServiceCard';
import ProviderCard from '@/components/cards/ProviderCard';
import EmptyState from '@/components/common/EmptyState';
import ServiceCardSkeleton from '@/components/common/ServiceCardSkeleton';
import Button from '@/components/common/Button';
import { FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Favorites() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useFetch(() => favoriteService.getMyFavorites(), []);
  const favorites = data?.data || [];

  const handleRemove = async (favoriteId) => {
    await favoriteService.remove(favoriteId);
    refetch();
  };

  return (
    <CustomerLayout title="Favorites">
      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      )}

      {!error && !isLoading && favorites.length === 0 && (
        <EmptyState
          icon={<FaHeart size={22} />}
          title="No favorites yet"
          description="Save services or providers you like to find them here later."
          actionLabel="Browse services"
          onAction={() => navigate('/services')}
        />
      )}

      {!error && !isLoading && favorites.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {favorites.map((fav) => (
            <div key={fav._id} className="relative">
              {fav.service && <ServiceCard service={fav.service} />}
              {fav.provider && <ProviderCard provider={fav.provider} />}
              <Button
                variant="danger"
                size="sm"
                className="absolute right-3 top-3 !rounded-full !px-3"
                onClick={() => handleRemove(fav._id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}