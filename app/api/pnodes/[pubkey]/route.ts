import { NextRequest, NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pnodes/[pubkey]
 * Returns detailed information about a specific pNode
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pubkey: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { pubkey } = await context.params;

    // Validate pubkey exists and has reasonable length
    if (!pubkey || pubkey.length < 32) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid pubkey format',
          message: 'Pubkey must be at least 32 characters'
        },
        { status: 400 }
      );
    }

    // Fetch specific pNode info
    const pnode = await prpcClient.getPNodeInfo(pubkey);

    if (!pnode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'pNode not found',
          message: `No pNode found with pubkey: ${pubkey}`
        },
        { status: 404 }
      );
    }

    // Fetch all nodes for network comparison
    const allNodes = await prpcClient.getClusterNodes();

    if (allNodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to fetch network data',
          message: 'Could not retrieve cluster nodes for comparison'
        },
        { status: 503 }
      );
    }

    const networkAvg = {
      uptime:
        allNodes.reduce((sum, n) => sum + n.uptime, 0) / allNodes.length,
      storage:
        allNodes.reduce((sum, n) => sum + n.storageCommitted, 0) /
        allNodes.length,
    };

    // Calculate score
    const scoreBreakdown = calculateXandScore(pnode, networkAvg);

    // Percentiles
    const uptimePercentile = calculatePercentile(
      pnode.uptime,
      allNodes.map(n => n.uptime)
    );

    const storagePercentile = calculatePercentile(
      pnode.storageCommitted,
      allNodes.map(n => n.storageCommitted)
    );

    return NextResponse.json({
      success: true,
      data: {
        ...pnode,
        scoreBreakdown,
        score: scoreBreakdown.total,
        networkComparison: {
          uptimePercentile: Math.round(uptimePercentile),
          storagePercentile: Math.round(storagePercentile),
          networkAverage: networkAvg,
          totalNodes: allNodes.length,
        },
        recommendations: generateRecommendations(
          pnode,
          scoreBreakdown,
          networkAvg
        ),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching pNode:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pNode',
        message: errorMessage,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate percentile rank of a value in a dataset
 */
function calculatePercentile(value: number, dataset: number[]): number {
  if (dataset.length === 0) return 0;
  
  const sorted = [...dataset].sort((a, b) => a - b);
  const count = sorted.filter(v => v <= value).length;
  
  return (count / sorted.length) * 100;
}

/**
 * Generate actionable recommendations based on node performance
 */
function generateRecommendations(
  pnode: any,
  score: any,
  networkAvg: any
) {
  type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  interface Recommendation {
    category: string;
    severity: Severity;
    message: string;
    action: string;
  }
  
  const recommendations: Recommendation[] = [];

  // Critical recommendations first
  if (pnode.status === 'offline') {
    recommendations.push({
      category: 'connectivity',
      severity: 'critical',
      message: 'Node is currently offline.',
      action: 'Check network connectivity and node service status immediately.',
    });
  }

  if (pnode.uptime < 90) {
    recommendations.push({
      category: 'uptime',
      severity: 'high',
      message: `Uptime is ${pnode.uptime.toFixed(1)}%, below recommended 95%+.`,
      action: 'Review system logs and ensure stable network connectivity.',
    });
  }

  if (pnode.storageUsagePercent > 90) {
    recommendations.push({
      category: 'storage',
      severity: 'high',
      message: `Storage usage is critically high at ${pnode.storageUsagePercent.toFixed(1)}%.`,
      action: 'Expand storage capacity or archive old data immediately.',
    });
  } else if (pnode.storageUsagePercent > 80) {
    recommendations.push({
      category: 'storage',
      severity: 'medium',
      message: `Storage usage is ${pnode.storageUsagePercent.toFixed(1)}%.`,
      action: 'Plan for storage expansion soon.',
    });
  }

  if (pnode.version !== '0.7.3') {
    recommendations.push({
      category: 'version',
      severity: 'medium',
      message: `Running version ${pnode.version}, latest is 0.7.3.`,
      action: 'Schedule an upgrade to the latest stable release.',
    });
  }

  // Performance comparison
  if (pnode.uptime < networkAvg.uptime - 5) {
    recommendations.push({
      category: 'performance',
      severity: 'medium',
      message: 'Node uptime is below network average.',
      action: 'Investigate potential reliability issues.',
    });
  }

  // Positive feedback
  if (score.total >= 90) {
    recommendations.push({
      category: 'general',
      severity: 'info',
      message: `Excellent performance! XandScore: ${score.total.toFixed(1)}/100`,
      action: 'Maintain current configuration and monitoring.',
    });
  }

  if (pnode.private) {
    recommendations.push({
      category: 'visibility',
      severity: 'info',
      message: 'Node is private; advanced metrics unavailable.',
      action: 'Consider making the node public for enhanced monitoring.',
    });
  }

  // Sort by severity
  const severityOrder: Record<Severity, number> = { 
    critical: 0, 
    high: 1, 
    medium: 2, 
    low: 3, 
    info: 4 
  };
  
  recommendations.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return recommendations;
}