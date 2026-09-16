'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  CheckCircle, 
  ShieldCheck, 
  Lightning,
  Sparkle
} from '@phosphor-icons/react';
import { BreathingDot } from '@/components/motion/BreathingDot';

export const HeroGraphPreview: React.FC = () => {
  const [activeNode, setActiveNode] = useState<number>(1);

  const nodes = [
    { id: '1', title: 'Unstructured Complaint', meta: 'Natural Language Ingestion', status: 'done', icon: Sparkle },
    { id: '2', title: 'Topological DAG Planner', meta: 'Deterministic Task Hierarchy', status: 'active', icon: GitBranch },
    { id: '3', title: 'Dynamic Replanning', meta: 'Obstruction Edge Rewiring', status: 'ready', icon: Lightning },
    { id: '4', title: '5-Gate Closure Verify', meta: 'Substantive Proof Check', status: 'gate', icon: ShieldCheck },
  ];

  return (
    <div className="relative w-full rounded-2xl bg-bg-surface border border-zinc-800 p-5 shadow-card overflow-hidden">
      {/* Top Card Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <BreathingDot status="active" />
          <span className="font-mono text-xs text-zinc-300">Live Orchestration Pipeline</span>
        </div>
        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          SQL-Backed DAG
        </span>
      </div>

      {/* SVG Flow Connections */}
      <div className="relative flex flex-col gap-3">
        {nodes.map((n, idx) => {
          const Icon = n.icon;
          const isSelected = activeNode === idx;

          return (
            <motion.div
              key={n.id}
              whileHover={{ x: 4 }}
              onClick={() => setActiveNode(idx)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-zinc-900 border-emerald-500/50 shadow-subtle'
                  : 'bg-bg-base/80 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                  }`}>
                    <Icon size={14} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">{n.title}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{n.meta}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    n.status === 'done'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                      : n.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/60'
                  }`}>
                    {n.status}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Micro Status Bar */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <span>DAG State: Active Synchronized</span>
        <span className="text-emerald-400">Zero Hallucinations</span>
      </div>
    </div>
  );
};
