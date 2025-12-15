import { useMemo } from 'react';
import type { PNode } from '@/app/types';

export function useNetworkStats(pNodes: PNode[]) {
  return useMemo(() => {
    if (pNodes.length === 0) {
      return {
        total: 0,
        active: 0,
        avgScore: '0.0',
        totalStorage: '0.0',
        usedStorage: '0.0',
        utilization: '0.0',
      };
    }

    const active = pNodes.filter(n => n.status === 'active').length;
    const avgScore =
      pNodes.reduce((sum, n) => sum + (n.score || 0), 0) / pNodes.length;
    const totalStorage = pNodes.reduce((sum, n) => sum + n.storageCommitted, 0);
    const usedStorage = pNodes.reduce((sum, n) => sum + n.storageUsed, 0);

    return {
      total: pNodes.length,
      active,
      avgScore: avgScore.toFixed(1),
      totalStorage: (totalStorage / 1000).toFixed(1),
      usedStorage: (usedStorage / 1000).toFixed(1),
      utilization:
        totalStorage > 0
          ? ((usedStorage / totalStorage) * 100).toFixed(1)
          : '0.0',
    };
  }, [pNodes]);
}
