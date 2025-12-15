import { useMemo } from 'react';
import type { PNode } from '@/app/types';

export function useFilteredPNodes(
  nodes: PNode[],
  searchTerm: string,
  filterStatus: string,
  sortBy: string
) {
  return useMemo(() => {
    return nodes
      .filter(node => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          node.id.toLowerCase().includes(q) ||
          node.pubkey.toLowerCase().includes(q) ||
          node.ipAddress.toLowerCase().includes(q);

        const matchesFilter =
          filterStatus === 'all' || node.status === filterStatus;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
        if (sortBy === 'uptime') return b.uptime - a.uptime;
        if (sortBy === 'storage') return b.storageCommitted - a.storageCommitted;
        return 0;
      });
  }, [nodes, searchTerm, filterStatus, sortBy]);
}
