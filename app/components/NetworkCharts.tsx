'use client';

import { useMemo } from 'react';
import { 
  TrendingUp,
  HardDrive,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'];

interface Props {
  pNodes: any[];
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
}

export default function NetworkAnalytics({
  pNodes,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
}: Props) {

  // Version distribution
  const versionDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    pNodes.forEach(node => {
      dist[node.version] = (dist[node.version] || 0) + 1;
    });
    return Object.entries(dist)
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);
  }, [pNodes]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    pNodes.forEach(node => {
      dist[node.status] = (dist[node.status] || 0) + 1;
    });
    return Object.entries(dist).map(([status, count]) => ({ 
      status: status.charAt(0).toUpperCase() + status.slice(1), 
      count 
    }));
  }, [pNodes]);

  // Storage analytics
  const storageAnalytics = useMemo(() => {
    const totalCommitted = pNodes.reduce((sum, n) => sum + n.storageCommitted, 0);
    const totalUsed = pNodes.reduce((sum, n) => sum + n.storageUsed, 0);
    const totalFree = totalCommitted - totalUsed;
    
    const usedPercent = totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0;
    const freePercent = 100 - usedPercent;

    return {
      data: [
        { name: 'Used', value: totalUsed, fill: '#8b5cf6' },
        { name: 'Free', value: totalFree, fill: '#10b981' },
      ],
      usedPercent: usedPercent.toFixed(1),
      freePercent: freePercent.toFixed(1),
      totalGB: (totalCommitted / (1024 ** 3)).toFixed(2),
      usedGB: (totalUsed / (1024 ** 3)).toFixed(2),
      freeGB: (totalFree / (1024 ** 3)).toFixed(2),
    };
  }, [pNodes]);

  // Status summary for note
  const statusSummary = useMemo(() => {
    const total = pNodes.length;
    const active = pNodes.filter(n => n.status === 'active').length;
    const activePercent = total > 0 ? ((active / total) * 100).toFixed(1) : '0';
    return { total, active, activePercent };
  }, [pNodes]);

  return (
    <div className="space-y-4">
      {/* Storage and Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Storage Distribution */}
        <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className={`w-5 h-5 ${mutedClass}`} />
            <h3 className="text-lg font-semibold">Storage Distribution</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={storageAnalytics.data}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {storageAnalytics.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <p className={`text-xs ${mutedClass} mt-3`}>
            {storageAnalytics.freePercent}% of total storage ({storageAnalytics.freeGB} GB) remains available
          </p>
        </div>

        {/* Status Distribution */}
        <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`w-5 h-5 ${mutedClass}`} />
            <h3 className="text-lg font-semibold">Status Distribution</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="count"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={({ payload, percent }) =>
                  `${payload.status} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {statusDistribution.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <p className={`text-xs ${mutedClass} mt-3`}>
            {statusSummary.activePercent}% of nodes ({statusSummary.active}/{statusSummary.total}) are currently active
          </p>
        </div>
      </div>

      {/* Version Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Version Distribution Bar Chart */}
        <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Package className={`w-5 h-5 ${mutedClass}`} />
            <h3 className="text-lg font-semibold">Version Distribution</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={versionDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? '#374151' : '#e5e7eb'}
                opacity={0.5}
              />
              <XAxis 
                dataKey="version" 
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                fontSize={12}
              />
              <YAxis 
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <p className={`text-xs ${mutedClass} mt-3`}>
            {versionDistribution.length > 0
              ? `Most common version: v${versionDistribution[0].version} (${versionDistribution[0].count} nodes)`
              : 'No version data available'
            }
          </p>
        </div>

        {/* Version Pie Chart */}
        <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Package className={`w-5 h-5 ${mutedClass}`} />
            <h3 className="text-lg font-semibold">Version Split</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={versionDistribution.slice(0, 6)}
                dataKey="count"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={({ version, percent }) =>
                  `v${version} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {versionDistribution.slice(0, 6).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <p className={`text-xs ${mutedClass} mt-3`}>
            {versionDistribution.length} different versions deployed across the network
          </p>
        </div>
      </div>
    </div>
  );
}