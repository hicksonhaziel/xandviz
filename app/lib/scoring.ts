import { PNode } from './prpc';

export interface ScoreBreakdown {
  total: number;
  uptime: number;
  responseTime: number; // logical reliability proxy
  storage: number;
  version: number;
  reliability: number;
  grade: string;
  color: string;
}

/**
 * XandScore™ - Proprietary pNode scoring algorithm
 * Range: 0-100
 */
export function calculateXandScore(
  pnode: PNode,
  networkAvg: any
): ScoreBreakdown {
  // 1. Uptime Score (30 points max)
  const uptimeScore = Math.min(30, (pnode.uptime / 100) * 30);

  /**
   * FIX #1: Response Time → Gossip Freshness
   * Uses lastSeen instead of fake latency
   */
  const lastSeenDiff = Date.now() - pnode.lastSeen;
  const responseScore = Math.max(0, 25 - lastSeenDiff / 12_000);

  /**
   * FIX #2: Storage Capacity → Storage Committed
   */
  const storageScore = Math.min(
    20,
    (pnode.storageCommitted / networkAvg.storage) * 20
  );

  // 4. Version Currency Score (15 points max)
  const versionScore = getVersionScore(pnode.version);

  // 5. Network Reliability Score (10 points max)
  const reliabilityScore = calculateReliability(pnode, networkAvg);

  const total = Math.min(
    100,
    uptimeScore +
      responseScore +
      storageScore +
      versionScore +
      reliabilityScore
  );

  const { grade, color } = getScoreGrade(total);

  return {
    total: Math.round(total * 10) / 10,
    uptime: Math.round(uptimeScore * 10) / 10,
    responseTime: Math.round(responseScore * 10) / 10,
    storage: Math.round(storageScore * 10) / 10,
    version: Math.round(versionScore * 10) / 10,
    reliability: Math.round(reliabilityScore * 10) / 10,
    grade,
    color,
  };
}

function getVersionScore(version: string): number {
  const versionMap: Record<string, number> = {
    '0.7.3': 15,
    '0.7.2': 13,
    '0.7.1': 10,
    '0.7.0': 7,
  };

  return versionMap[version] ?? 5;
}

/**
 * FIX #3: Reliability without responseTime
 */
function calculateReliability(pnode: PNode, networkAvg: any): number {
  let score = 0;

  if (pnode.status === 'active') score += 5;
  if (pnode.storageUsagePercent < 80) score += 3;
  if (pnode.uptime > networkAvg.uptime) score += 2;

  return Math.min(10, score);
}

function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 95) return { grade: 'A+', color: 'text-green-400' };
  if (score >= 90) return { grade: 'A', color: 'text-green-500' };
  if (score >= 85) return { grade: 'B+', color: 'text-blue-400' };
  if (score >= 80) return { grade: 'B', color: 'text-blue-500' };
  if (score >= 75) return { grade: 'C+', color: 'text-yellow-400' };
  if (score >= 70) return { grade: 'C', color: 'text-yellow-500' };
  if (score >= 60) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
}
