import { useCallback, useEffect, useState } from 'react';
import { fetchOrder } from '../services/order.service.js';
import { isAbortError } from '../utils/order-helpers.js';


export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (signal) => {
      try {
        const data = await fetchOrder(orderId, { signal });
        setOrder(data);
        setError(null);
      } catch (err) {
        if (!isAbortError(err)) setError(err);
      }
    },
    [orderId],
  );

  useEffect(() => {
    const controller = new AbortController();
    setOrder(null);
    setLoading(true);
    load(controller.signal).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { order, setOrder, loading, error, reload };
}
