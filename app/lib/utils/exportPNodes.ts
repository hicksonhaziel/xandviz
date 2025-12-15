import type { PNode } from '@/app/types';

export function exportPNodesCSV(nodes: PNode[]) {
  const csv = [
    ['ID', 'Pubkey', 'Version', 'Status', 'Score', 'Uptime', 'Storage Committed', 'Storage Used', 'IP Address'],
    ...nodes.map(node => [
      node.id,
      node.pubkey,
      node.version,
      node.status,
      node.score?.toFixed(1) || 'N/A',
      node.uptime.toFixed(1),
      node.storageCommitted,
      node.storageUsed,
      node.ipAddress,
    ]),
  ]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `xandeum-pnodes-${Date.now()}.csv`;
  a.click();
}
