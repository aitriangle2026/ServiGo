import { useEffect, useState, useCallback } from 'react';

/**
 * Runs an async fetcher on mount (and whenever `deps` change), tracking
 * loading/error/data state. Use for any read-only API call in a component.
 *
 * @param {() => Promise<any>} fetcher
 * @param {Array} deps
 */
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, isLoading, error, refetch: run };
}
