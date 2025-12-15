'use client';

import { AlertCircle } from 'lucide-react';
import type { PNode } from '@/app/types';

interface Props {
  nodes: PNode[];
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
  onSelectNode: (node: PNode) => void;
}

const getScoreGrade = (score: number) => {
  if (score >= 95) return { grade: 'A+', color: 'text-green-400' };
  if (score >= 90) return { grade: 'A', color: 'text-green-500' };
  if (score >= 85) return { grade: 'B+', color: 'text-blue-400' };
  if (score >= 80) return { grade: 'B', color: 'text-blue-500' };
  if (score >= 75) return { grade: 'C+', color: 'text-yellow-400' };
  if (score >= 70) return { grade: 'C', color: 'text-yellow-500' };
  if (score >= 60) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
};

export default function PNodesTable({
  nodes,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
  onSelectNode,
}: Props) {
  const visibleNodes = nodes.slice(0, 20);

  return (
    <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">pNode</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">XandScore™</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Uptime</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Storage</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Version</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {visibleNodes.map((node) => {
              const { grade, color } = getScoreGrade(node.score || 0);

              return (
                <tr
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                >
                  {/* Node */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{node.id}</span>
                      <span className={`text-xs ${mutedClass} font-mono`}>
                        {node.pubkey.slice(0, 12)}...
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">
                        {node.score?.toFixed(1) ?? 'N/A'}
                      </span>
                      <span className={`text-sm font-semibold ${color}`}>
                        {grade}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        node.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : node.status === 'syncing'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {node.status}
                    </span>
                  </td>

                  {/* Uptime */}
                  <td className="px-6 py-4">
                    {node.uptime.toFixed(1)}%
                  </td>

                  {/* Storage */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{node.storageCommitted.toFixed(0)} GB</span>
                      <span className={`text-xs ${mutedClass}`}>
                        {node.storageUsagePercent.toFixed(0)}% used
                      </span>
                    </div>
                  </td>

                  {/* IP */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      {node.ipAddress || 'N/A'}
                    </span>
                  </td>

                  {/* Version */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      {node.version}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
          <p className={mutedClass}>
            No pNodes found matching your criteria
          </p>
        </div>
      )}

      {/* Footer */}
      {nodes.length > 20 && (
        <div className="px-6 py-4 border-t border-gray-700 text-center">
          <p className={mutedClass}>
            Showing 20 of {nodes.length} results
          </p>
        </div>
      )}
    </div>
  );
}
