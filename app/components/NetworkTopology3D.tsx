import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Search, X } from 'lucide-react';

interface PNodeVisualization { 
  id: string;
  position: [number, number, number];
  score: number;
  status: 'active' | 'syncing' | 'offline';
  pubkey?: string;
  version?: string;
  storageCommitted?: number;
  connections: string[];
}

interface NodeSphereProps {
  node: PNodeVisualization;
  onClick: (node: PNodeVisualization) => void;
  selected: boolean;
}

const NodeSphere: React.FC<NodeSphereProps> = ({ node, onClick, selected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1;
      
      if (node.status === 'active') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const getNodeColor = () => {
    if (node.status === 'offline') return '#ef4444';
    if (node.status === 'syncing') return '#f59e0b';
    
    if (node.score >= 90) return '#10b981';
    if (node.score >= 80) return '#3b82f6';
    if (node.score >= 70) return '#8b5cf6';
    return '#f59e0b';
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={node.position}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[selected ? 0.3 : hovered ? 0.25 : 0.2, 32, 32]} />
        <meshStandardMaterial
          color={getNodeColor()}
          emissive={getNodeColor()}
          emissiveIntensity={selected ? 0.8 : hovered ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {(hovered || selected) && (
        <Text
          position={[node.position[0], node.position[1] + 0.5, node.position[2]]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {node.id.slice(0, 8)}...
        </Text>
      )}
      
      {selected && (
        <mesh position={node.position}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial
            color={getNodeColor()}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
};

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ start, end, active }) => {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end]);

  return (
    <Line
      points={points}
      color={active ? '#8b5cf6' : '#374151'}
      lineWidth={active ? 2 : 1}
      transparent
      opacity={active ? 0.6 : 0.2}
    />
  );
};

interface NetworkTopology3DProps {
  nodes: any[];
  onNodeSelect?: (node: any) => void;
}

const NetworkTopology3D: React.FC<NetworkTopology3DProps> = ({ nodes, onNodeSelect }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const controlsRef = useRef<any>(null);

  const uniqueNodes = useMemo(() => {
    const seen = new Set();
    return nodes.filter(node => {
      const key = node.pubkey || node.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [nodes]);

  const visualizationNodes: PNodeVisualization[] = useMemo(() => {
    return uniqueNodes.map((node, index) => {
      const phi = Math.acos(-1 + (2 * index) / uniqueNodes.length);
      const theta = Math.sqrt(uniqueNodes.length * Math.PI) * phi;
      
      const radius = 5;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      
      const connections = uniqueNodes
        .filter((_, i) => i !== index && Math.random() > 0.7)
        .map(n => n.id)
        .slice(0, 3);
      
      return {
        id: node.id,
        position: [x, y, z] as [number, number, number],
        score: node.score || 0,
        status: node.status,
        pubkey: node.pubkey,
        version: node.version,
        storageCommitted: node.storageCommitted,
        connections,
      };
    });
  }, [uniqueNodes]);

  const connections = useMemo(() => {
    const lines: Array<{
      start: [number, number, number];
      end: [number, number, number];
      active: boolean;
    }> = [];

    visualizationNodes.forEach(node => {
      node.connections.forEach(connId => {
        const connectedNode = visualizationNodes.find(n => n.id === connId);
        if (connectedNode) {
          lines.push({
            start: node.position,
            end: connectedNode.position,
            active: selectedNode === node.id || selectedNode === connId,
          });
        }
      });
    });

    return lines;
  }, [visualizationNodes, selectedNode]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSelectedNode(null);
      return;
    }

    const found = visualizationNodes.find(n => 
      n.id.toLowerCase().includes(query.toLowerCase()) ||
      n.pubkey?.toLowerCase().includes(query.toLowerCase())
    );

    if (found && controlsRef.current) {
      setSelectedNode(found.id);
      
      const [x, y, z] = found.position;
      controlsRef.current.target.set(x, y, z);
      controlsRef.current.update();
      
      if (onNodeSelect) {
        const originalNode = uniqueNodes.find(n => n.id === found.id);
        onNodeSelect(originalNode);
      }
    }
  };

  const handleNodeClick = (node: PNodeVisualization) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    if (onNodeSelect) {
      const originalNode = uniqueNodes.find(n => n.id === node.id);
      onNodeSelect(originalNode);
    }
  };

  const selectedNodeData = visualizationNodes.find(n => n.id === selectedNode);

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {connections.map((conn, i) => (
          <ConnectionLine
            key={`conn-${i}`}
            start={conn.start}
            end={conn.end}
            active={conn.active}
          />
        ))}
        
        {visualizationNodes.map(node => (
          <NodeSphere
            key={node.pubkey || node.id}
            node={node}
            onClick={handleNodeClick}
            selected={selectedNode === node.id}
          />
        ))}
        
        <gridHelper args={[20, 20, '#374151', '#1f2937']} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={!selectedNode}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Search bar - Responsive */}
      <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex justify-center z-10">
        <div className="relative w-full max-w-xs md:max-w-md">
          <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search node..."
            className="w-full pl-8 md:pl-10 pr-8 md:pr-10 py-1.5 md:py-2 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg text-white text-xs md:text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedNode(null);
              }}
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected node info card*/}
      {selectedNodeData && (
        <div className="absolute top-12 md:top-16 left-2 md:left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-2 md:p-3 text-white text-xs w-48 md:w-56 border border-gray-700 max-h-[calc(100%-8rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-purple-400 text-xs md:text-sm">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
          
          <div className="space-y-1.5">
            <div>
              <span className="text-gray-400 text-[10px] md:text-xs">ID:</span>
              <div className="text-[10px] md:text-xs font-mono break-all">{selectedNodeData.id}</div>
            </div>
            
            {selectedNodeData.pubkey && (
              <div>
                <span className="text-gray-400 text-[10px] md:text-xs">Pubkey:</span>
                <div className="text-[10px] md:text-xs font-mono break-all">
                  {selectedNodeData.pubkey.slice(0, 12)}...
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] md:text-xs">Score:</span>
              <span className="font-bold text-green-400 text-[10px] md:text-xs">{selectedNodeData.score}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] md:text-xs">Status:</span>
              <span className={`font-semibold text-[10px] md:text-xs ${
                selectedNodeData.status === 'active' ? 'text-green-400' :
                selectedNodeData.status === 'syncing' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {selectedNodeData.status.toUpperCase()}
              </span>
            </div>
            
            {selectedNodeData.version && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px] md:text-xs">Version:</span>
                <span className="text-[10px] md:text-xs">{selectedNodeData.version}</span>
              </div>
            )}
            
            {selectedNodeData.storageCommitted && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px] md:text-xs">Storage:</span>
                <span className="text-[10px] md:text-xs">
                  {(selectedNodeData.storageCommitted / (1024 * 1024 * 1024)).toFixed(1)} GB
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] md:text-xs">Connections:</span>
              <span className="text-purple-400 text-[10px] md:text-xs">{selectedNodeData.connections.length}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend*/}
      <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-2 md:p-3 text-white text-[10px] md:text-xs max-w-[140px] md:max-w-none">
        <div className="font-semibold mb-1.5 text-xs md:text-sm">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="truncate">Active 90+</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
            <span className="truncate">Active 80-89</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
            <span className="truncate">Active 70-79</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <span className="truncate">Syncing</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="truncate">Offline</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 text-[9px] md:text-[10px] text-gray-400">
          Click • Drag • Zoom
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-12 md:top-16 right-2 md:right-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-2 md:p-3 text-white text-[10px] md:text-xs">
        <div className="space-y-0.5">
          <div>Total: <span className="font-bold">{uniqueNodes.length}</span></div>
          <div>Active: <span className="font-bold text-green-400">
            {uniqueNodes.filter(n => n.status === 'active').length}
          </span></div>
          <div>Syncing: <span className="font-bold text-yellow-400">
            {uniqueNodes.filter(n => n.status === 'syncing').length}
          </span></div>
          <div>Offline: <span className="font-bold text-red-400">
            {uniqueNodes.filter(n => n.status === 'offline').length}
          </span></div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTopology3D;