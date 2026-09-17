'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode } from './TaskNode';
import { BreathingDot } from '../motion/BreathingDot';

interface ResolutionGraphProps {
  nodes: Node[];
  edges: Edge[];
  workflowName?: string;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

export const ResolutionGraph: React.FC<ResolutionGraphProps> = ({
  nodes,
  edges,
  workflowName = 'Dynamic Resolution Plan',
  onNodeClick,
}) => {
  const nodeTypes = useMemo(() => ({ 
    taskNode: TaskNode,
    default: TaskNode 
  }), []);

  const defaultEdgeOptions = useMemo(() => ({
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    type: 'smoothstep'
  }), []);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-bg-base border border-zinc-800 shadow-card">
      {/* Top Status Overlay Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2.5 bg-bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700/60 text-xs shadow-subtle">
        <BreathingDot status="active" />
        <span className="font-semibold text-zinc-200">{workflowName}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400 font-mono text-[11px]">{nodes.length} Actions</span>
        <span className="text-zinc-700">|</span>
        <span className="text-emerald-400 font-mono text-[11px]">{edges.length} Dependencies</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={1.5}
        className="bg-bg-base"
      >
        <Controls className="!bg-bg-surface !border-zinc-800 !text-zinc-300 !rounded-lg !overflow-hidden shadow-subtle" />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.status === 'COMPLETED') return '#10b981';
            if (n.data?.status === 'INVALIDATED') return '#ef4444';
            if (n.data?.status === 'HUMAN_APPROVAL_REQUIRED') return '#f59e0b';
            if (n.data?.status === 'READY') return '#34d399';
            return '#3f3f46';
          }}
          className="!bg-bg-surface/95 !border-zinc-800 !rounded-lg overflow-hidden shadow-subtle"
          maskColor="rgba(9, 9, 11, 0.75)"
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
      </ReactFlow>
    </div>
  );
};
