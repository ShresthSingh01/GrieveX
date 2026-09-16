'use client';

import React from 'react';
import { CaseDetail } from '@/types';
import { 
  Lightning, 
  ShieldCheck, 
  ChartBar, 
  Plus, 
  ArrowsClockwise,
  MapPin,
  UserCircle,
  GitFork,
  HeartBreak
} from '@phosphor-icons/react';
import { BreathingDot } from '@/components/motion/BreathingDot';
import { getCitizenImpactProfile } from '@/lib/citizenStakes';

interface CaseHeaderProps {
  currentCase: CaseDetail;
  onOpenEvidenceModal: () => void;
  onOpenVerificationModal: () => void;
  onOpenEvaluationModal: () => void;
  onOpenSubmitModal: () => void;
  onResetSeed: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  currentCase,
  onOpenEvidenceModal,
  onOpenVerificationModal,
  onOpenEvaluationModal,
  onOpenSubmitModal,
  onRefresh,
  loading
}) => {
  const isReplanned = currentCase.status === 'REPLANNED';
  const isResolved = currentCase.status === 'RESOLVED';
  const profile = getCitizenImpactProfile(currentCase);

  return (
    <header className="bg-bg-surface/95 border-b border-zinc-800 px-6 py-3.5 shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Information */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              {currentCase.id}
            </span>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100">
              {currentCase.title}
            </h1>
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border ${
                isResolved
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isReplanned
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60'
              }`}
            >
              <BreathingDot
                status={isResolved ? 'active' : isReplanned ? 'warning' : 'neutral'}
              />
              <span>{currentCase.status}</span>
            </span>

            {/* Human Stakes Pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <HeartBreak size={12} weight="fill" className="text-rose-400" />
              <span>{profile.vulnerabilityBadge}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-amber-400">{profile.daysInLimbo}d limbo</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <UserCircle size={14} className="text-zinc-500" />
              <span className="text-zinc-300">{currentCase.citizen_name}</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-zinc-500" />
              <span className="text-zinc-300">{currentCase.location}</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
              <GitFork size={14} className="text-emerald-500" />
              <span>{currentCase.workflow_name || 'Standard Resolution Graph'}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Inject Evidence (Replanning) - Primary Accent */}
          <button
            onClick={onOpenEvidenceModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all duration-150 active:scale-[0.98] shadow-subtle"
            title="Inject real-world obstruction or evidence to trigger dynamic graph replanning"
          >
            <Lightning size={14} weight="fill" />
            <span>Inject Evidence (Replan)</span>
          </button>

          {/* Closure Verification */}
          <button
            onClick={onOpenVerificationModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-elevated hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 transition-all active:scale-[0.98]"
          >
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Verify Closure</span>
          </button>

          {/* Evaluation Scorecard */}
          <button
            onClick={onOpenEvaluationModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-elevated hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 transition-all active:scale-[0.98]"
          >
            <ChartBar size={15} className="text-zinc-400" />
            <span>Scorecard</span>
          </button>

          {/* New Grievance */}
          <button
            onClick={onOpenSubmitModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-elevated hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 transition-all active:scale-[0.98]"
          >
            <Plus size={14} weight="bold" />
            <span>New Grievance</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 bg-bg-elevated hover:bg-zinc-700/80 border border-zinc-700/60 transition-all active:scale-[0.98]"
            title="Refresh case state"
          >
            <ArrowsClockwise size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
};
