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

  // Base card and status styles
  let cardClass = 'bg-bg-surface border-zinc-800 text-zinc-200';
  let badgeClass = 'bg-bg-elevated text-zinc-400 border-zinc-700/60';
  let statusIcon = <Clock size={13} className="text-zinc-500 shrink-0" />;

  if (isInvalidated) {
    cardClass = 'bg-zinc-900/50 border-rose-900/40 text-rose-300/60 opacity-60 line-through';
    badgeClass = 'bg-rose-950/40 text-rose-400 border-rose-900/40';
    statusIcon = <Prohibit size={13} className="text-rose-400 shrink-0" />;
  } else if (isCompleted) {
    cardClass = 'bg-zinc-900 border-emerald-800/40 text-zinc-100 shadow-subtle';
    badgeClass = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
    statusIcon = <CheckCircle size={13} weight="fill" className="text-emerald-400 shrink-0" />;
  } else if (isHumanApproval) {
    cardClass = 'bg-zinc-900 border-amber-600/50 text-amber-100 shadow-subtle';
    badgeClass = 'bg-amber-950/40 text-amber-300 border-amber-700/50';
    statusIcon = <Warning size={13} weight="fill" className="text-amber-400 shrink-0" />;
  } else if (isReady) {
    cardClass = 'bg-zinc-900 border-emerald-500/50 text-zinc-100 shadow-subtle';
    badgeClass = 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50';
    statusIcon = <ArrowUpRight size={13} weight="bold" className="text-emerald-400 shrink-0" />;
  } else if (isBlocked) {
    cardClass = 'bg-bg-surface/80 border-zinc-800/80 text-zinc-400';
    badgeClass = 'bg-bg-elevated text-zinc-500 border-zinc-800';
  }

  // Risk badge color
  const riskColor =
    data.risk_level === 'HIGH'
      ? 'text-rose-400 bg-rose-950/30 border-rose-900/40'
      : data.risk_level === 'MEDIUM'
      ? 'text-amber-400 bg-amber-950/30 border-amber-900/40'
      : 'text-zinc-400 bg-zinc-800/40 border-zinc-700/60';

  const deptColor = data.authority_color || '#10b981';

  return (
    <div className={`px-3.5 py-3 rounded-xl border backdrop-blur-md min-w-[240px] max-w-[280px] transition-all duration-150 ${cardClass}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-zinc-500 !w-2 !h-2 !border-bg-base" 
      />
      
      {/* Top Header: ID, Authority with Department Dot & Replanned Tag */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-bg-elevated text-zinc-300 border border-zinc-700/60">
            {data.id}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-zinc-300 truncate max-w-[120px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: deptColor }} />
            <span>{data.authority}</span>
          </span>
        </div>
        {data.is_replanned && (
          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Replanned
          </span>
        )}
      </div>


      {/* Task Title */}
      <div className="text-xs font-medium line-clamp-2 mb-2 leading-snug text-zinc-200">
        {data.title}
      </div>

      {/* Bottom Metadata Badges */}
      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-800/80">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${badgeClass}`}>
          {statusIcon}
          <span>{data.status.replace(/_/g, ' ')}</span>
        </span>

        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${riskColor}`}>
          {data.risk_level}
        </span>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-emerald-500 !w-2 !h-2 !border-bg-base" 
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
