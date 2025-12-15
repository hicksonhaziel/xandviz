import { PNode } from './pnode';

export interface ApiResponse {
  success: boolean;
  data: PNode[];
  count: number;

  stats: {
    total: number;
    active: number;
    syncing: number;
    offline: number;
    avgScore: number;
    totalStorage: number;
    usedStorage: number;
  };

  timestamp: number;
  error?: string;
  message?: string;
}
