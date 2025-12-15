import { NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Returns network-wide statistics and analytics
 */
export async function GET() {
  try {
    const pnodes = await prpcClient.getClusterNodes();

    const networkAvg = {
      uptime: pnodes.reduce((sum, n) => sum + n.uptime, 0) / pnodes.length,
      responseTime: pnodes.reduce((sum, n) => sum + n.responseTime, 0) / pnodes.length,
      storage: pnodes.reduce((sum, n) => sum + n.storageCapacity, 0) / pnodes.length,
    };

    const pnodesWithScores = pnodes.map(pnode => ({
      ...pnode,
      score: calculateXandScore(pnode, networkAvg).total,
    }));

    // Version distribution
    const versionDist: { [key: string]: number } = {};
    pnodes.forEach(node => {
      versionDist[node.version] = (versionDist[node.version] || 0) + 1;
    });

    // Location distribution
    const locationDist: { [key: string]: number } = {};
    pnodes.forEach(node => {
      locationDist[node.location] = (locationDist[node.location] || 0) + 1;
    });

    // Score distribution
    const scoreRanges = {
      'A+ (95-100)': 0,
      'A (90-94)': 0,
      'B+ (85-89)': 0,
      'B (80-84)': 0,
      'C+ (75-79)': 0,
      'C (70-74)': 0,
      'D (60-69)': 0,
      'F (<60)': 0,
    };

    pnodesWithScores.forEach(node => {
      if (node.score >= 95) scoreRanges['A+ (95-100)']++;
      else if (node.score >= 90) scoreRanges['A (90-94)']++;
      else if (node.score >= 85) scoreRanges['B+ (85-89)']++;
      else if (node.score >= 80) scoreRanges['B (80-84)']++;
      else if (node.score >= 75) scoreRanges['C+ (75-79)']++;
      else if (node.score >= 70) scoreRanges['C (70-74)']++;
      else if (node.score >= 60) scoreRanges['D (60-69)']++;
      else scoreRanges['F (<60)']++;
    });

    const stats = {
      network: {
        total: pnodes.length,
        active: pnodes.filter(n => n.status === 'active').length,
        syncing: pnodes.filter(n => n.status === 'syncing').length,
        offline: pnodes.filter(n => n.status === 'offline').length,
      },
      performance: {
        avgScore: pnodesWithScores.reduce((sum, n) => sum + n.score, 0) / pnodesWithScores.length,
        avgUptime: networkAvg.uptime,
        avgResponseTime: networkAvg.responseTime,
        healthStatus: calculateHealthStatus(pnodesWithScores),
      },
      storage: {
        total: pnodes.reduce((sum, n) => sum + n.storageCapacity, 0),
        used: pnodes.reduce((sum, n) => sum + n.storageUsed, 0),
        available: pnodes.reduce((sum, n) => sum + (n.storageCapacity - n.storageUsed), 0),
        utilizationPercent: (
          pnodes.reduce((sum, n) => sum + n.storageUsed, 0) /
          pnodes.reduce((sum, n) => sum + n.storageCapacity, 0) * 100
        ),
      },
      distributions: {
        versions: Object.entries(versionDist).map(([version, count]) => ({
          version,
          count,
          percentage: (count / pnodes.length) * 100,
        })),
        locations: Object.entries(locationDist).map(([location, count]) => ({
          location,
          count,
          percentage: (count / pnodes.length) * 100,
        })),
        scores: Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count,
          percentage: (count / pnodes.length) * 100,
        })),
      },
      topPerformers: pnodesWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(node => ({
          id: node.id,
          pubkey: node.pubkey,
          score: node.score,
          location: node.location,
        })),
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateHealthStatus(pnodes: any[]) {
  const avgScore = pnodes.reduce((sum, n) => sum + n.score, 0) / pnodes.length;
  const activePercent = (pnodes.filter(n => n.status === 'active').length / pnodes.length) * 100;

  if (avgScore >= 85 && activePercent >= 90) {
    return { status: 'excellent', message: 'Network is performing excellently', color: 'green' };
  } else if (avgScore >= 75 && activePercent >= 80) {
    return { status: 'good', message: 'Network is performing well', color: 'blue' };
  } else if (avgScore >= 65 && activePercent >= 70) {
    return { status: 'fair', message: 'Network performance is fair', color: 'yellow' };
  } else {
    return { status: 'poor', message: 'Network needs attention', color: 'red' };
  }
}
