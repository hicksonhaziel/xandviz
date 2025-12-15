import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

interface PNodeVisualization { 
  id: string;
  position: [number, number, number];
  score: number;
  status: 'active' | 'syncing' | 'offline';
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
      // Gentle floating animation
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1;
      
      // Pulse animation for active nodes
      if (node.status === 'active') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  // Determine color based on score and status
  const getNodeColor = () => {
    if (node.status === 'offline') return '#ef4444'; // red
    if (node.status === 'syncing') return '#f59e0b'; // yellow
    
    // Active nodes: color by score
    if (node.score >= 90) return '#10b981'; // green
    if (node.score >= 80) return '#3b82f6'; // blue
    if (node.score >= 70) return '#8b5cf6'; // purple
    return '#f59e0b'; // yellow
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
          {node.id}
        </Text>
      )}
      
      {/* Glow effect for selected node */}
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

  // Generate 3D positions for nodes in a sphere distribution
  const visualizationNodes: PNodeVisualization[] = useMemo(() => {
    return nodes.map((node, index) => {
      const phi = Math.acos(-1 + (2 * index) / nodes.length);
      const theta = Math.sqrt(nodes.length * Math.PI) * phi;
      
      const radius = 5;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      
      // Simulate connections (in real app, get from gossip data)
      const connections = nodes
        .filter((_, i) => i !== index && Math.random() > 0.7)
        .map(n => n.id)
        .slice(0, 3);
      
      return {
        id: node.id,
        position: [x, y, z] as [number, number, number],
        score: node.score || 0,
        status: node.status,
        connections,
      };
    });
  }, [nodes]);

  // Generate connection lines
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

  const handleNodeClick = (node: PNodeVisualization) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    if (onNodeSelect) {
      const originalNode = nodes.find(n => n.id === node.id);
      onNodeSelect(originalNode);
    }
  };

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#0f172a']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Connections */}
        {connections.map((conn, i) => (
          <ConnectionLine
            key={`conn-${i}`}
            start={conn.start}
            end={conn.end}
            active={conn.active}
          />
        ))}
        
        {/* Nodes */}
        {visualizationNodes.map(node => (
          <NodeSphere
            key={node.id}
            node={node}
            onClick={handleNodeClick}
            selected={selectedNode === node.id}
          />
        ))}
        
        {/* Grid helper */}
        <gridHelper args={[20, 20, '#374151', '#1f2937']} />
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={!selectedNode}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
        <div className="font-semibold mb-2">Network Status</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Active (Score 90+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Active (Score 80-89)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Active (Score 70-79)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Syncing / Low Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Offline</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          Click nodes to view details • Drag to rotate • Scroll to zoom
        </div>
      </div>
      
      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
        <div className="space-y-1">
          <div>Total Nodes: <span className="font-bold">{nodes.length}</span></div>
          <div>Active: <span className="font-bold text-green-400">
            {nodes.filter(n => n.status === 'active').length}
          </span></div>
          <div>Syncing: <span className="font-bold text-yellow-400">
            {nodes.filter(n => n.status === 'syncing').length}
          </span></div>
          <div>Offline: <span className="font-bold text-red-400">
            {nodes.filter(n => n.status === 'offline').length}
          </span></div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTopology3D;