import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { favoriteService } from '@/services/favoriteService';

// The server's own reason beats a generic line — a vague toast is what hid
// the stale-index bug for so long.
const errorMessage = (error) =>
  error?.response?.data?.message || 'Could not update your favorites.';

/**
 * Save/unsave services and providers from anywhere a heart is shown.
 *
 * Favorites belong to customers only. A logged-out visitor who taps a heart
 * is sent to log in; providers and admins get `canFavorite: false` so pages
 * can hide the heart entirely.
 *
 * @returns {{
 *   canFavorite: boolean,
 *   isServiceFavorite: (id: string) => boolean,
 *   isProviderFavorite: (id: string) => boolean,
 *   toggleService: (service: object) => void,
 *   toggleProvider: (provider: object) => void,
 * }}
 */
export default function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'customer';

  // target id ("service:<id>" / "provider:<id>") -> Favorite document id,
  // which is what the delete endpoint takes.
  const [favoriteIds, setFavoriteIds] = useState(() => new Map());

  useEffect(() => {
    if (!isCustomer) return undefined;
    let cancelled = false;

    favoriteService
      .getMyFavorites()
      .then((response) => {
        if (cancelled) return;
        const next = new Map();
        (response?.data || []).forEach((fav) => {
          if (fav.service?._id) next.set(`service:${fav.service._id}`, fav._id);
          if (fav.provider?._id) next.set(`provider:${fav.provider._id}`, fav._id);
        });
        setFavoriteIds(next);
      })
      .catch(() => {
        // Hearts just render empty; saving still works and will report errors.
      });

    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  const toggle = useCallback(
    async (kind, id, label) => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (!isCustomer || !id) return;

      const key = `${kind}:${id}`;
      const existingId = favoriteIds.get(key);
      // A save is still in flight — ignore a double tap.
      if (existingId === 'pending') return;

      // Optimistic, then reconciled with what the server says.
      const setEntry = (value) =>
        setFavoriteIds((current) => {
          const next = new Map(current);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        });

      if (existingId) {
        setEntry(null);
        try {
          await favoriteService.remove(existingId);
          toast.success(`Removed ${label} from favorites`);
        } catch (error) {
          setEntry(existingId);
          toast.error(errorMessage(error));
        }
        return;
      }

      setEntry('pending');
      try {
        const response =
          kind === 'service' ? await favoriteService.addService(id) : await favoriteService.addProvider(id);
        setEntry(response?.data?._id || 'saved');
        toast.success(`Saved ${label} to favorites`);
      } catch (error) {
        setEntry(null);
        toast.error(errorMessage(error));
      }
    },
    [isAuthenticated, isCustomer, favoriteIds, navigate]
  );

  return {
    // Logged-out visitors see the heart too — tapping it is the prompt to log in.
    canFavorite: !isAuthenticated || isCustomer,
    isServiceFavorite: (id) => favoriteIds.has(`service:${id}`),
    isProviderFavorite: (id) => favoriteIds.has(`provider:${id}`),
    toggleService: (service) => toggle('service', service?._id || service?.id, service?.title || 'service'),
    toggleProvider: (provider) => {
      const name = `${provider?.user?.firstName || ''} ${provider?.user?.lastName || ''}`.trim();
      toggle('provider', provider?._id || provider?.id, name || 'professional');
    },
  };
}
