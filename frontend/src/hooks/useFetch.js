import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';

/**
 * Simple data-fetching hook with loading/error state and refetch.
 * `url` may be null to skip fetching.
 */
export default function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const abortRef = useRef();

  const fetchData = useCallback(async () => {
    if (!url) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { signal: controller.signal });
      setData(res.data);
    } catch (e) {
      if (e.name !== 'CanceledError' && e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
