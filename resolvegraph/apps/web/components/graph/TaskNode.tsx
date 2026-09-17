'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  CheckCircle, 
  Clock, 
  Warning, 
  Prohibit, 
  ArrowUpRight 
} from '@phosphor-icons/react';

interface TaskNodeProps {
  data: {
    id: string;
    title: string;
    authority: string;
    authority_color?: string;
    status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'HUMAN_APPROVAL_REQUIRED' | 'INVALIDATED';
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    requires_human_approval: boolean;
    required_evidence: string[];
    submitted_evidence: any[];
    is_replanned: boolean;
    invalidated: boolean;
  };
}

export const TaskNode = memo(({ data }: TaskNodeProps) => {
  const isInvalidated = data.invalidated || data.status === 'INVALIDATED';
  const isCompleted = data.status === 'COMPLETED';
  const isReady = data.status === 'READY';
  const isHumanApproval = data.status === 'HUMAN_APPROVAL_REQUIRED';
  const isBlocked = data.status === 'BLOCKED' || data.status === 'PENDING';

  const nodeTitle = data.title || (data as any).label || 'Resolution Task';
  const nodeId = data.id || (data as any).key || 'TASK';
  const nodeAuthority = data.authority || 'Public Authority';
  const nodeStatus = data.status || 'PENDING';
  const nodeRisk = data.risk_level || 'LOW';

  // Base card and status styles
  let cardClass = 'bg-zinc-900/95 border-zinc-700/80 text-zinc-100 shadow-card';
  let badgeClass = 'bg-zinc-800 text-zinc-300 border-zinc-700/60';
  let statusIcon = <Clock size={13} className="text-zinc-400 shrink-0" />;

  if (isInvalidated) {
    cardClass = 'bg-zinc-900/80 border-rose-900/60 text-rose-300/80 opacity-75 line-through shadow-subtle';
    badgeClass = 'bg-rose-950/60 text-rose-300 border-rose-800/60';
    statusIcon = <Prohibit size={13} className="text-rose-400 shrink-0" />;
  } else if (isCompleted) {
    cardClass = 'bg-zinc-900/95 border-emerald-500/50 text-zinc-100 shadow-subtle';
    badgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
    statusIcon = <CheckCircle size={13} weight="fill" className="text-emerald-400 shrink-0" />;
  } else if (isHumanApproval) {
    cardClass = 'bg-zinc-900/95 border-amber-500/60 text-amber-100 shadow-subtle';
    badgeClass = 'bg-amber-950/60 text-amber-300 border-amber-600/60';
    statusIcon = <Warning size={13} weight="fill" className="text-amber-400 shrink-0" />;
  } else if (isReady) {
    cardClass = 'bg-zinc-900/95 border-emerald-400/60 text-zinc-100 shadow-subtle ring-1 ring-emerald-500/20';
    badgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60';
    statusIcon = <ArrowUpRight size={13} weight="bold" className="text-emerald-400 shrink-0" />;
  } else if (isBlocked) {
    cardClass = 'bg-zinc-900/85 border-zinc-800 text-zinc-300 shadow-subtle';
    badgeClass = 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60';
  }

  // Risk badge color
  const riskColor =
    nodeRisk === 'HIGH'
      ? 'text-rose-300 bg-rose-950/50 border-rose-800/60'
      : nodeRisk === 'MEDIUM'
      ? 'text-amber-300 bg-amber-950/50 border-amber-800/60'
      : 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60';

  const deptColor = data.authority_color || '#10b981';

  return (
    <div className={`px-3.5 py-3 rounded-xl border backdrop-blur-md min-w-[240px] max-w-[280px] transition-all duration-150 ${cardClass}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-zinc-400 !w-2.5 !h-2.5 !border-zinc-900" 
      />
      
      {/* Top Header: ID, Authority with Department Dot & Replanned Tag */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/80">
            {nodeId}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-200 truncate max-w-[120px]">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: deptColor }} />
            <span>{nodeAuthority}</span>
          </span>
        </div>
        {data.is_replanned && (
          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Replanned
          </span>
        )}
      </div>

      {/* Task Title */}
      <div className="text-xs font-semibold line-clamp-2 mb-2 leading-snug text-zinc-100">
        {nodeTitle}
      </div>

      {/* Bottom Metadata Badges */}
      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-800/80">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${badgeClass}`}>
          {statusIcon}
          <span>{nodeStatus.replace(/_/g, ' ')}</span>
        </span>

        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${riskColor}`}>
          {nodeRisk}
        </span>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-emerald-400 !w-2.5 !h-2.5 !border-zinc-900" 
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
