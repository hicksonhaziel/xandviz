export type PNodeStatus = 'active' | 'syncing' | 'offline';

export interface PNode {
  id: string;
  pubkey: string;
  version: string;

  status: PNodeStatus;

  uptime: number;
  lastSeen: number;

  rpcPort: number;
  ipAddress: string;
  isPublic: boolean;

  storageCommitted: number;
  storageUsed: number;
  storageUsagePercent: number;

  score?: number;
  scoreBreakdown?: {
    total: number;
    uptime: number;
    responseTime: number;
    storage: number;
    version: number;
    reliability: number;
    grade: string;
    color: string;
  };
}
