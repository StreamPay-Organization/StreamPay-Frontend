import { useCallback, useEffect, useState } from 'react';
import { listStreams } from '../services/streams.js';

/**
 * Load and expose the list of streams for a given direction.
 * Handles loading, error and refetch.
 * @param {'incoming'|'outgoing'|undefined} direction
 * @returns {{streams: object[], loading: boolean, error: string|null,
 *   refetch: Function}}
 */
export function useStreams(direction) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return listStreams({ direction })
      .then((data) => setStreams(data))
      .catch((e) => setError(e.message || 'Failed to load streams'))
      .finally(() => setLoading(false));
  }, [direction]);

  useEffect(() => {
    load();
  }, [load]);

  return { streams, loading, error, refetch: load };
}
