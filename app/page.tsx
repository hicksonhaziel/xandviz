'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PNode, ApiResponse } from '@/app/types';
import { useAppContext } from '@/app/context/AppContext';
import { exportPNodesCSV } from '@/app/lib/utils/exportPNodes';
import { Suspense } from 'react';
import {
  usePNodes,
  useFilteredPNodes,
  useNetworkStats
} from '@/app/hooks';
import dynamic from 'next/dynamic';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import NetworkCharts from './components/NetworkCharts';
import { TopologySkeleton } from './components/skeletons/TopologySkeleton';
import NetworkOverviewStats from './components/NetworkOverviewStats';
import SearchAndFilters from './components/SearchAndFilters';
import PNodesTable from './components/PNodesTable';
import { AlertCircle, Check } from 'lucide-react';

// Dynamically import 3D component
const NetworkTopology3D = dynamic(
  () => import('@/app/components/NetworkTopology3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-gray-400">Loading 3D visualization...</div>
      </div>
    )
  }
);

const vtoggleOptions = [
  { key: 'pNodes_Explore', label: 'pNodes Explore' },
  { key: 'Network_3D', label: 'Network 3D' },
  { key: 'pNodes_Analysis', label: 'pNodes Analysis' }
];

const XandViz = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);

  const {
    darkMode,
    setDarkMode,
    show3DView,
    setShow3DView,
    visualStatus,
    setVisualStatus,
  } = useAppContext();

  useEffect(() => {
    if (visualStatus === 'Network_3D') {
      setShow3DView(true);
    }
  }, [visualStatus]);

  const { pNodes, loading, error } = usePNodes();

  const filteredNodes = useFilteredPNodes(
    pNodes,
    searchTerm,
    filterStatus,
    sortBy
  );

  const networkStats = useMemo(() => {
    if (pNodes.length === 0) {
      return {
        total: 0,
        active: 0,
        avgScore: '0.0',
        totalStorage: '0.0',
        usedStorage: '0.0',
        utilization: '0.0'
      };
    }
    
    
    const active = pNodes.filter(n => n.status === 'active').length;
    const avgScore = pNodes.reduce((sum, n) => sum + (n.score || 0), 0) / pNodes.length;
    const totalStorage = pNodes.reduce((sum, n) => sum + n.storageCommitted, 0);
    const usedStorage = pNodes.reduce((sum, n) => sum + n.storageUsed, 0);
    
    return {
      total: pNodes.length,
      active,
      avgScore: avgScore.toFixed(1),
      totalStorage: (totalStorage / 1000).toFixed(1),
      usedStorage: (usedStorage / 1000).toFixed(1),
      utilization: totalStorage > 0 ? ((usedStorage / totalStorage) * 100).toFixed(1) : '0.0'
    };
  }, [pNodes]);

  const versionDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    pNodes.forEach(node => {
      dist[node.version] = (dist[node.version] || 0) + 1;
    });
    return Object.entries(dist).map(([version, count]) => ({ version, count }));
  }, [pNodes]);

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

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-gray-800 bg-opacity-50 backdrop-blur-lg' : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  const exportData = () => exportPNodesCSV(filteredNodes);

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className={mutedClass}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>

      {/* Header */}
      <Header 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        show3DView={show3DView}
        visualStatus={visualStatus}
        setShow3DView={setShow3DView}
        setVisualStatus={setVisualStatus}
      />

      <div className="container mx-auto px-4 py-8">

        {/* Network Overview Stats */}
        <NetworkOverviewStats
          loading={loading}
          networkStats={networkStats}
          cardClass={cardClass}
          borderClass={borderClass}
          mutedClass={mutedClass}
        />

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          exportData={exportData}
          darkMode={darkMode}
          cardClass={cardClass}
          borderClass={borderClass}
          mutedClass={mutedClass}
        />

        {/* Visual Toggle */}
<div className={`flex items-center gap-1 p-1 rounded-lg border ${borderClass} mb-4 w-fit`}>
  {vtoggleOptions.map((opt) => {
    const active = visualStatus === opt.key;

    return (
      <button
        key={opt.key}
        onClick={() => setVisualStatus(opt.key as any)}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5
          ${
            active
              ? darkMode
                ? 'bg-gray-700 text-white'
                : 'bg-gray-200 text-gray-900'
              : darkMode
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
      >
        {active && <Check className="w-3 h-3" />}
        {opt.label}
      </button>
    );
  })}
</div>

        {/* 3D visualization */}
        { visualStatus === 'Network_3D' && show3DView && (
          <Suspense fallback={<TopologySkeleton />}>
            <div className={`${cardClass} p-4 rounded-xl border ${borderClass} mb-8`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">3D Network Topology</h3>
                <button
                  onClick={() => setShow3DView(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
            </div>

           <NetworkTopology3D
             nodes={pNodes}
             onNodeSelect={(node) => setSelectedNode(node)}
           />
           </div>
         </Suspense>
       )}
        
        {/* Network charts */}
        {visualStatus === 'pNodes_Analysis' && 
        <NetworkCharts
          versionDistribution={versionDistribution}
          statusDistribution={statusDistribution}
          darkMode={darkMode}
          cardClass={cardClass}
          borderClass={borderClass}
          mutedClass={mutedClass}
          COLORS={COLORS}
        />
        }

        {/* pNodes Table */}
        <PNodesTable
          nodes={filteredNodes}
          darkMode={darkMode}
          cardClass={cardClass}
          borderClass={borderClass}
          mutedClass={mutedClass}
          onSelectNode={setSelectedNode}
        />
      </div>

      {/* Footer */}
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default XandViz;