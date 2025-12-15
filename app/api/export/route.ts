import { NextRequest, NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/export?format=csv|json
 * Exports pNode data in specified format
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

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

    if (format === 'csv') {
      const csv = convertToCSV(pnodesWithScores);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="xandviz-pnodes-${Date.now()}.csv"`,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        data: pnodesWithScores,
        exportedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (!data.length) return '';

  const headers = [
    'ID',
    'Pubkey',
    'Version',
    'Status',
    'Score',
    'Uptime',
    'Response Time',
    'Storage Capacity',
    'Storage Used',
    'Location',
    'IP Address',
  ];

  const rows = data.map(node => [
    node.id,
    node.pubkey,
    node.version,
    node.status,
    node.score,
    node.uptime,
    node.responseTime,
    node.storageCapacity,
    node.storageUsed,
    node.location,
    node.ipAddress,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}
