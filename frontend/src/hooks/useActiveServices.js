import { useCallback, useEffect, useState } from 'react';
import { fetchServices } from '../services/catalog.service.js';

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export function useActiveServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError('');
      try {
        const all = [];
        let page = 1;
        let totalPages = 1;
        do {
          const data = await fetchServices({ active: true, page, limit: PAGE_SIZE });
          all.push(...(data?.services ?? []));
          totalPages = data?.pagination?.total_pages ?? 1;
          page += 1;
        } while (page <= totalPages && page <= MAX_PAGES);
        if (!cancelled) setServices(all);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load the services.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { services, loading, error, reload };
}
