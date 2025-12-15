import { useEffect, useState } from 'react';
import type { PNode, ApiResponse } from '@/app/types';

export function usePNodes() {
  const [pNodes, setPNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPNodes = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/pnodes');
        if (!res.ok) throw new Error(res.statusText);

        const result: ApiResponse = await res.json();
        if (!result.success) {
          throw new Error(result.message || result.error || 'Failed to fetch pNodes');
        }

        setPNodes(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPNodes();
  }, []);

  return { pNodes, loading, error };
}
