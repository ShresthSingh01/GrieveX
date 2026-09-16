'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Lightning, 
  CheckCircle, 
  Clock, 
  Warning, 
  Prohibit, 
  ArrowCounterClockwise, 
  ArrowRight,
  ShieldCheck,
  FileText
} from '@phosphor-icons/react';
import { BreathingDot } from '@/components/motion/BreathingDot';

interface SimulationTask {
  id: string;
  title: string;
  authority: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'READY' | 'BLOCKED' | 'INVALIDATED';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  isReplanned?: boolean;
}

export const DagSimulator: React.FC = () => {
  const [replanned, setReplanned] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const initialTasks: SimulationTask[] = [
    { id: 'T-101', title: 'Ward Joint Hydrographic Survey', authority: 'Municipality', status: 'COMPLETED', risk: 'LOW' },
    { id: 'T-102', title: 'Local Ward Gully Cleansing', authority: 'Municipality', status: 'IN_PROGRESS', risk: 'MEDIUM' },
    { id: 'T-103', title: 'Citizen Waterlog Clearance Signoff', authority: 'Revenue Tehsildar', status: 'BLOCKED', risk: 'HIGH' },
  ];

  const replannedTasks: SimulationTask[] = [
    { id: 'T-101', title: 'Ward Joint Hydrographic Survey', authority: 'Municipality', status: 'COMPLETED', risk: 'LOW' },
    { id: 'T-102', title: 'Local Ward Gully Cleansing', authority: 'Municipality', status: 'INVALIDATED', risk: 'MEDIUM' },
    { id: 'T-104', title: 'PWD Arterial Super-Sucker Deployment', authority: 'PWD Highways', status: 'READY', risk: 'HIGH', isReplanned: true },
    { id: 'T-105', title: 'Inter-Agency Outfall Desiltation', authority: 'PWD & Municipal Joint', status: 'BLOCKED', risk: 'MEDIUM', isReplanned: true },
    { id: 'T-103', title: 'Citizen Waterlog Clearance Signoff', authority: 'Revenue Tehsildar', status: 'BLOCKED', risk: 'HIGH' },
  ];

  const currentTasks = replanned ? replannedTasks : initialTasks;

  const handleTriggerReplan = () => {
    setReplanned(true);
    setActiveStep(1);
  };

  const handleReset = () => {
    setReplanned(false);
    setActiveStep(0);
  };

  return (
    <div className="w-full bg-bg-surface border border-zinc-800 rounded-2xl p-6 shadow-card overflow-hidden">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
              Interactive Sandbox
            </span>
            <span className="text-xs text-zinc-400">Case GRV-001 • Flooding at Arterial Drain</span>
          </div>
          <h3 className="text-base font-semibold text-zinc-100 mt-1">
            Dynamic Topological Replanning Simulation
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {!replanned ? (
            <button
              onClick={handleTriggerReplan}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all active:scale-[0.98] shadow-subtle"
            >
              <Lightning size={14} weight="fill" />
              <span>Simulate Obstruction (Replan)</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all active:scale-[0.98]"
            >
              <ArrowCounterClockwise size={13} />
              <span>Reset Graph</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400 px-2.5 py-1.5 rounded bg-bg-elevated hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
          >
            <span>Open Console</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Simulator Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left: Active Graph Tasks */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium uppercase tracking-wider text-[11px]">
              Topological Task Pipeline ({currentTasks.length} nodes)
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {replanned ? 'DAG Mutated via Injected Gazette Survey' : 'Initial Dependency Graph'}
            </span>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {currentTasks.map((t) => {
                const isInvalidated = t.status === 'INVALIDATED';
                const isCompleted = t.status === 'COMPLETED';
                const isReady = t.status === 'READY';
                const isReplanned = t.isReplanned;

                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isInvalidated
                        ? 'bg-zinc-950/40 border-rose-900/30 opacity-60'
                        : isCompleted
                        ? 'bg-bg-base border-zinc-800'
                        : isReady
                        ? 'bg-zinc-900 border-emerald-500/40 shadow-subtle'
                        : 'bg-bg-base border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-zinc-300 border border-zinc-700/60 shrink-0">
                        {t.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${isInvalidated ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {t.title}
                          </span>
                          {isReplanned && (
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Injected Node
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-500 block">
                          Agency: <strong className="text-zinc-400 font-normal">{t.authority}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : isReady
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : isInvalidated
                          ? 'bg-rose-950/30 text-rose-400 border border-rose-900/40'
                          : 'bg-zinc-800/40 text-zinc-400 border border-zinc-700/60'
                      }`}>
                        {isCompleted && <CheckCircle size={12} weight="fill" />}
                        {isReady && <Clock size={12} />}
                        {isInvalidated && <Prohibit size={12} />}
                        <span>{t.status.replace(/_/g, ' ')}</span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: State Mutation Ledger & Verification Gates */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-bg-base p-4 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider block mb-2">
              Closure Policy Gates
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">1. All Critical Tasks Resolved</span>
                <span className="font-mono text-[10px] text-zinc-500">In Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">2. Zero Inter-Agency Disputes</span>
                <span className={`font-mono text-[10px] ${replanned ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {replanned ? 'Resolved (PWD)' : '1 Unresolved'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">3. Statutory Information Provided</span>
                <span className="font-mono text-[10px] text-emerald-400">Passed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">4. Official Officer Signoff</span>
                <span className="font-mono text-[10px] text-zinc-500">Pending Gate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">5. Citizen Proof of Resolution</span>
                <span className="font-mono text-[10px] text-zinc-500">Pending</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-base p-4 rounded-xl border border-zinc-800/80 text-xs">
            <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider block mb-1.5">
              Live State Mutation
            </span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {replanned ? (
                <span className="text-emerald-300">
                  Evidence injected: PWD Gazette Survey confirms trunk infrastructure. 
                  Task T-102 invalidated. Tasks T-104 and T-105 provisioned into graph without context loss.
                </span>
              ) : (
                <span>
                  Click &ldquo;Simulate Obstruction&rdquo; to watch ResolveGraph invalidate municipal gully cleansing and dynamically wire PWD super-sucker operations.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
