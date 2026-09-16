'use client';

import React, { useState, useEffect } from 'react';
import { EvaluationScorecard } from '../../types';
import { 
  CheckCircle, 
  XCircle, 
  ArrowsClockwise 
} from '@phosphor-icons/react';
import { fetchEvaluation } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { ModalShell } from '../modals/ModalShell';

interface EvaluationModalProps {
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ onClose }) => {
  const toast = useToast();
  const [data, setData] = useState<EvaluationScorecard | null>(null);
  const [loading, setLoading] = useState(true);

  const runBenchmark = async () => {
    setLoading(true);
    try {
      const res = await fetchEvaluation();
      setData(res);
      toast.success('Benchmark evaluation completed across 7 baseline test scenarios.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to run evaluation benchmark');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Objective Evaluation Benchmark"
      subtitle="Verifiable evaluation across 7 ground-truth baseline test scenarios"
      maxWidth="max-w-2xl"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
        <span className="text-xs text-zinc-400">
          Automated regression and policy verification suite
        </span>
        <button
          onClick={runBenchmark}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-xs transition-all active:scale-[0.98]"
          title="Re-run benchmark"
        >
          <ArrowsClockwise size={13} className={loading ? 'animate-spin' : ''} />
          <span>Rerun Tests</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400 text-xs">
          <ArrowsClockwise size={20} className="animate-spin text-emerald-400" />
          <span>Executing 7 ground-truth baseline test scenarios...</span>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-4 text-xs">
          {/* Scorecard Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-bg-base p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">
                Task Completeness
              </span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {data.scorecard.task_completeness_rate}
              </span>
            </div>
            <div className="bg-bg-base p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">
                Dependency Accuracy
              </span>
              <span className="text-lg font-bold text-zinc-200 font-mono">
                {data.scorecard.dependency_accuracy}
              </span>
            </div>
            <div className="bg-bg-base p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">
                Conflict Detection F1
              </span>
              <span className="text-lg font-bold text-zinc-200 font-mono">
                {data.scorecard.conflict_detection_f1}
              </span>
            </div>
            <div className="bg-bg-base p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">
                Unsafe Actions
              </span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {data.scorecard.unsafe_autonomous_actions}
              </span>
            </div>
          </div>

          {/* Test Details */}
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Evaluation Test Scenarios ({data.detailed_results.length})
            </span>
            {data.detailed_results.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-base border border-zinc-800 flex items-start gap-3"
              >
                {r.passed ? (
                  <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[11px] font-medium text-zinc-300">{r.test_id}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      r.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-200 text-xs mb-1">{r.description}</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{r.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 active:scale-[0.98] transition-all"
        >
          Close Scorecard
        </button>
      </div>
    </ModalShell>
  );
};
