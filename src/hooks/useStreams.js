import { useCallback, useEffect, useRef, useState } from 'react';
import { listStreams } from '../services/streams.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * Clamp a requested page size into the supported range.
 * @param {number|undefined} size
 * @returns {number}
 */
function normalizePageSize(size) {
  if (!Number.isFinite(size) || size <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(size), MAX_PAGE_SIZE);
}

/**
 * Build a stable filter key so we can detect changes to the filter contract.
 * @param {{direction?: string, token?: string, status?: string}} filters
 * @returns {string}
 */
function filterKey(filters) {
  return JSON.stringify({
    direction: filters.direction ?? null,
    token: filters.token ?? null,
    status: filters.status ?? null,
  });
}

/**
 * Merge a new page into the accumulated list, deduplicating by id while
 * preserving the stable server-defined order.
 * @param {object[]} existing
 * @param {object[]} incoming
 * @returns {object[]}
 */
function mergeById(existing, incoming) {
  const seen = new Set(existing.map((item) => item.id));
  const merged = existing.slice();
  for (const item of incoming) {
    if (item == null || item.id == null) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

/**
 * Load and expose a paginated list of streams with stable cursor pagination.
 *
 * Accepts filters (direction, token, status) and a pageSize. Maintains a
 * snapshot cursor so that inserts during pagination do not cause duplicates
 * or gaps. In-flight requests are aborted when filters or cursor change, and
 * stale responses are ignored.
 *
 * @param {{direction?: 'incoming'|'outgoing', token?: string,
 *   status?: string}} [filters]
 * @param {number} [pageSize]
 * @returns {{streams: object[], loading: boolean, loadingMore: boolean,
 *   error: string|null, hasMore: boolean, loadMore: Function,
 *   refetch: Function}}
 */
export function useStreams(filters = {}, pageSize = DEFAULT_PAGE_SIZE) {
  const { direction, token, status } = filters;
  const normalizedPageSize = normalizePageSize(pageSize);
  const key = filterKey({ direction, token, status });

  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Snapshot cursor returned by the server; reused for subsequent pages so
  // that the result set stays stable while new events arrive.
  const cursorRef = useRef(null);
  // Monotonic request id used to discard stale responses.
  const requestIdRef = useRef(0);
  // Active AbortController for the current request.
  const controllerRef = useRef(null);
  // Whether a loadMore request is currently in flight.
  const loadingMoreRef = useRef(false);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const fetchPage = useCallback(
    (cursor, append) => {
      abortActive();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestId = ++requestIdRef.current;

      if (append) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      return listStreams({
        direction,
        token,
        status,
        cursor,
        pageSize: normalizedPageSize,
        signal: controller.signal,
      })
        .then((data) => {
          // Ignore responses that are no longer the latest request.
          if (requestId !== requestIdRef.current) return;
          const items = Array.isArray(data?.items) ? data.items : [];
          const nextCursor = data?.nextCursor ?? null;
          cursorRef.current = nextCursor;
          setHasMore(Boolean(data?.hasMore ?? nextCursor));
          setStreams((prev) => (append ? mergeById(prev, items) : mergeById([], items)));
        })
        .catch((e) => {
          if (requestId !== requestIdRef.current) return;
          if (e && (e.name === 'AbortError' || e.code === 'ABORT_ERR')) return;
          setError(e?.message || 'Failed to load streams');
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;
          if (append) {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
          if (controllerRef.current === controller) {
            controllerRef.current = null;
          }
        });
    },
    [abortActive, direction, token, status, normalizedPageSize]
  );

  const refetch = useCallback(() => {
    cursorRef.current = null;
    setHasMore(false);
    return fetchPage(null, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return Promise.resolve();
    if (!cursorRef.current) return Promise.resolve();
    return fetchPage(cursorRef.current, true);
  }, [fetchPage]);

  useEffect(() => {
    // Reset snapshot state whenever the filter contract changes.
    cursorRef.current = null;
    setStreams([]);
    setHasMore(false);
    fetchPage(null, false);
    return () => {
      abortActive();
    };
    // `key` captures the filter contract; fetchPage is recreated on change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, normalizedPageSize]);

  return {
    streams,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}