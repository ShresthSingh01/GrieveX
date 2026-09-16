'use client';

import React, { useState, useEffect } from 'react';
import { VerificationResult } from '../../types';
import { 
  CheckCircle, 
  XCircle, 
  ArrowsClockwise 
} from '@phosphor-icons/react';
import { verifyClosure } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { ModalShell } from '../modals/ModalShell';

interface VerificationModalProps {
  caseId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  caseId,
  onClose,
  onRefresh
}) => {
  const toast = useToast();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const runVerification = async () => {
    setLoading(true);
    try {
      const data = await verifyClosure(caseId);
      setResult(data);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to verify case closure criteria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerification();
  }, [caseId]);

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Closure Verification Audit"
      subtitle="Verifying substantive resolution against 5 policy criteria to prevent premature closure"
      maxWidth="max-w-lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2.5 text-zinc-400 text-xs">
          <ArrowsClockwise size={16} className="animate-spin text-emerald-400" />
          <span>Auditing 5 statutory closure criteria against recorded evidence...</span>
        </div>
      ) : result ? (
        <div className="flex flex-col gap-4 text-xs">
          {/* Outcome Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3.5 ${
              result.can_close
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-subtle'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-100 shadow-subtle'
            }`}
          >
            {result.can_close ? (
              <CheckCircle size={26} weight="fill" className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={26} weight="fill" className="text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs uppercase tracking-wider">
                {result.recommendation.replace(/_/g, ' ')}
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Statutory Resolution Quality Gates
            </span>
            {result.checklist.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-bg-base border border-zinc-800 flex items-start gap-2.5"
              >
                {item.passed ? (
                  <CheckCircle size={15} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={15} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-medium text-zinc-200 block">{item.criterion}</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">{item.details}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Blocking Reasons */}
          {result.blocking_reasons && result.blocking_reasons.length > 0 && (
            <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-900/40">
              <span className="text-[10px] font-medium uppercase tracking-wider text-rose-300 block mb-1">
                Premature Closure Blockers:
              </span>
              <ul className="list-disc list-inside text-[11px] text-rose-200 space-y-1">
                {result.blocking_reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 active:scale-[0.98] transition-all"
        >
          Close Audit
        </button>
      </div>
    </ModalShell>
  );
};
