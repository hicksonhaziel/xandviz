'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(20);

  const visibleNodes = nodes.slice(0, visibleCount);
  const hasMore = visibleCount < nodes.length;

  const handleNodeClick = (node: PNode) => {
    onSelectNode(node);
    router.push(`/pnodes/${node.pubkey}`);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, nodes.length));
  };

  const showAll = () => {
    setVisibleCount(nodes.length);
  };

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className={`hidden md:block ${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
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
                    onClick={() => handleNodeClick(node)}
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

        {/* Footer with Load More */}
        {nodes.length > 0 && (
          <div className={`px-6 py-4 border-t ${borderClass} text-center`}>
            <p className={`${mutedClass} mb-3`}>
              Showing {visibleCount} of {nodes.length} results
            </p>
            {hasMore && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={loadMore}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Load More (20)
                </button>
                <button
                  onClick={showAll}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Show All ({nodes.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-3">
        {visibleNodes.map((node) => {
          const { grade, color } = getScoreGrade(node.score || 0);

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`${cardClass} rounded-lg border ${borderClass} p-4 cursor-pointer hover:${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              } transition-colors`}
            >
              {/* Header: ID and Status */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{node.id}</h3>
                  <p className={`text-xs ${mutedClass} font-mono`}>
                    {node.pubkey.slice(0, 16)}...
                  </p>
                </div>
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
              </div>

              {/* Score and Grade */}
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className={`text-xs ${mutedClass} mb-1`}>XandScore™</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      {node.score?.toFixed(1) ?? 'N/A'}
                    </span>
                    <span className={`text-sm font-semibold ${color}`}>
                      {grade}
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${mutedClass} mb-1`}>Uptime</p>
                  <p className="font-medium">{node.uptime.toFixed(1)}%</p>
                </div>
              </div>

              {/* Storage and Version */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className={`${mutedClass} mb-1`}>Storage</p>
                  <p className="font-medium">{node.storageCommitted.toFixed(0)} GB</p>
                  <p className={mutedClass}>{node.storageUsagePercent.toFixed(0)}% used</p>
                </div>
                <div>
                  <p className={`${mutedClass} mb-1`}>Version</p>
                  <p className="font-mono font-medium">{node.version}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
            <p className={mutedClass}>
              No pNodes found matching your criteria
            </p>
          </div>
        )}

        {/* Footer with Load More */}
        {nodes.length > 0 && (
          <div className="text-center py-4">
            <p className={`${mutedClass} mb-3 text-sm`}>
              Showing {visibleCount} of {nodes.length} results
            </p>
            {hasMore && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={loadMore}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Load More (20)
                </button>
                <button
                  onClick={showAll}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Show All ({nodes.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}