import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchHistoryFirstPage,
  fetchHistoryPage,
  DEFAULT_PAGE_SIZE,
} from '../services/streamHistory.js';

/**
 * @typedef {{
 *   status?: string,
 *   token?: string,
 *   direction?: 'incoming'|'outgoing',
 * }} HistoryFilters
 */

/**
 * Manage paginated stream history with cursor-based navigation, filter state,
 * and automatic cancellation of in-flight requests.
 *
 * On every filter change the cursor resets so the new snapshot reflects the
 * updated filter contract — no stale pages can leak through.
 *
 * An AbortController is created for every fetch.  When a subsequent fetch
 * starts (either via filter change or next/prev) the previous controller is
 * aborted before the new request fires, preventing race conditions.
 *
 * @param {{
 *   initialFilters?: HistoryFilters,
 *   pageSize?: number,
 * }} [opts]
 * @returns {{
 *   items: import('../services/streamHistory.js').StreamEvent[],
 *   loading: boolean,
 *   error: string | null,
 *   total: number,
 *   hasMore: boolean,
 *   page: number,
 *   filters: HistoryFilters,
 *   setFilters: (f: HistoryFilters) => void,
 *   nextPage: () => void,
 *   prevPage: () => void,
 *   reload: () => void,
 * }}
 */
export function useStreamHistory(opts = {}) {
  const { initialFilters = {}, pageSize = DEFAULT_PAGE_SIZE } = opts;

  const [filters, setFiltersState] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Stack of cursors — index 0 is always null (first page), later entries are
  // the cursors returned by each page.  The current page index into this stack
  // tells us exactly which page we are on and allows going backwards.
  const cursorStackRef = useRef([null]); // [null, cursor-after-page-1, ...]
  const pageIndexRef = useRef(0);

  // The AbortController for the currently in-flight request.
  const abortRef = useRef(null);

  /**
   * Cancel any pending request and start a fresh one.
   * @param {import('../services/streamHistory.js').HistoryCursor|null} cursor
   * @param {number} targetPage
   */
  const fetchPage = useCallback(
    async (cursor, targetPage) => {
      // Cancel the previous request.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        let result;
        if (cursor === null) {
          result = await fetchHistoryFirstPage({
            filters,
            pageSize,
            signal: controller.signal,
          });
        } else {
          result = await fetchHistoryPage({
            cursor,
            pageSize,
            signal: controller.signal,
          });
        }

        // Guard: ignore result if this request was superseded.
        if (controller.signal.aborted) return;

        setItems(result.items);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setPage(targetPage);

        // Record the cursor that points to the *next* page at this position.
        cursorStackRef.current[targetPage] = result.cursor;
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e.message || 'Failed to load history');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [filters, pageSize]
  );

  // Reload from the first page whenever filters or pageSize change.
  useEffect(() => {
    // Reset the cursor stack on filter change.
    cursorStackRef.current = [null];
    pageIndexRef.current = 0;
    fetchPage(null, 1);

    return () => {
      abortRef.current?.abort();
    };
    // fetchPage itself captures `filters` and `pageSize` from the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageSize]);

  /** Navigate to the next page. No-op if there are no more pages. */
  const nextPage = useCallback(() => {
    if (!hasMore || loading) return;
    const nextIndex = pageIndexRef.current + 1;
    const cursor = cursorStackRef.current[pageIndexRef.current];
    pageIndexRef.current = nextIndex;
    fetchPage(cursor, page + 1);
  }, [hasMore, loading, page, fetchPage]);

  /** Navigate to the previous page. No-op if already on page 1. */
  const prevPage = useCallback(() => {
    if (page <= 1 || loading) return;
    const prevIndex = pageIndexRef.current - 1;
    pageIndexRef.current = prevIndex;
    // The cursor to load page N is at stack index N-1 (0-indexed cursor before
    // the target page).  Page 1 always uses null (first-page fetch).
    const cursor = prevIndex === 0 ? null : cursorStackRef.current[prevIndex - 1];
    fetchPage(cursor, page - 1);
  }, [page, loading, fetchPage]);

  /**
   * Update filters.  Resets page to 1 and invalidates all cursors by
   * triggering a new first-page snapshot.
   */
  const setFilters = useCallback((newFilters) => {
    setFiltersState(newFilters);
    // The useEffect on `filters` will reset cursor stack and re-fetch.
  }, []);

  /** Force-reload the current first page (e.g. after a known mutation). */
  const reload = useCallback(() => {
    cursorStackRef.current = [null];
    pageIndexRef.current = 0;
    fetchPage(null, 1);
  }, [fetchPage]);

  return {
    items,
    loading,
    error,
    total,
    hasMore,
    page,
    filters,
    setFilters,
    nextPage,
    prevPage,
    reload,
  };
}
