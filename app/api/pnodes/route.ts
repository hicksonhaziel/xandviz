import { NextRequest, NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pnodes
 * Returns all pNodes with scores and network statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');

    // Fetch pNodes from gossip protocol
    let pnodes = await prpcClient.getClusterNodes();

    /**
     * FIX #1: Network averages
     * - responseTime ❌ removed
     * - storageCapacity ❌ replaced with storageCommitted
     */
    const networkAvg = {
      uptime: pnodes.reduce((sum, n) => sum + n.uptime, 0) / pnodes.length,
      storage: pnodes.reduce((sum, n) => sum + n.storageCommitted, 0) / pnodes.length,
    };

    // Add XandScore to each pNode
    const pnodesWithScores = pnodes.map(pnode => {
      const breakdown = calculateXandScore(pnode, networkAvg);

      return {
        ...pnode,
        scoreBreakdown: breakdown,
        score: breakdown.total,
      };
    });

    // Apply filters
    let filtered = pnodesWithScores;

    if (status && status !== 'all') {
      filtered = filtered.filter(n => n.status === status);
    }

    if (minScore) {
      filtered = filtered.filter(n => n.score >= parseFloat(minScore));
    }

    /**
     * FIX #2: Statistics
     * - storageCapacity ❌ replaced with storageCommitted
     */
    const stats = {
      total: pnodesWithScores.length,
      active: pnodesWithScores.filter(n => n.status === 'active').length,
      syncing: pnodesWithScores.filter(n => n.status === 'syncing').length,
      offline: pnodesWithScores.filter(n => n.status === 'offline').length,
      avgScore:
        pnodesWithScores.reduce((sum, n) => sum + n.score, 0) /
        pnodesWithScores.length,
      totalStorage: pnodesWithScores.reduce(
        (sum, n) => sum + n.storageCommitted,
        0
      ),
      usedStorage: pnodesWithScores.reduce(
        (sum, n) => sum + n.storageUsed,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
      stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching pNodes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pNodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
