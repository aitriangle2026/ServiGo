import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Reads the `?highlight=<id>` param a notification link carries, scrolls that
 * row into view once the list has rendered, and flags it briefly so the user
 * can see which record the notification was about.
 *
 * The param itself *is* the state — nothing is mirrored into React state, so
 * clearing it from the URL is also what ends the highlight.
 *
 * @param {Array<{ _id: string }>} items the rendered list, so we only scroll
 *   once the target actually exists in the DOM
 * @param {number} clearAfterMs how long the flag stays on
 * @returns {{ highlightId: string | null, isHighlighted: (id: string) => boolean }}
 */
export default function useHighlight(items = [], clearAfterMs = 4000) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('highlight');
  const isRendered = Boolean(requested) && items.some((item) => item._id === requested);

  useEffect(() => {
    if (!isRendered) return undefined;

    // Wait for paint so the node exists before scrolling to it.
    const raf = requestAnimationFrame(() => {
      document
        .getElementById(`item-${requested}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Dropping the param ends the highlight and stops a refresh or
    // back-navigation from re-triggering it.
    const timer = setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete('highlight');
          return next;
        },
        { replace: true }
      );
    }, clearAfterMs);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isRendered, requested, clearAfterMs, setSearchParams]);

  return {
    highlightId: isRendered ? requested : null,
    isHighlighted: (id) => isRendered && id === requested,
  };
}
