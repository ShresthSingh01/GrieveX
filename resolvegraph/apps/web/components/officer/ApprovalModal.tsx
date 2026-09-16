'use client';

import React, { useState } from 'react';
import { Task } from '../../types';
import { 
  ShieldWarning, 
  CheckCircle, 
  XCircle, 
  Warning 
} from '@phosphor-icons/react';
import { approveTask } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { ModalShell } from '../modals/ModalShell';

interface ApprovalModalProps {
  caseId: string;
  task: Task | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  caseId,
  task,
  onClose,
  onRefresh
}) => {
  const toast = useToast();
  const [officerName, setOfficerName] = useState('Dr. Sanjay Kulkarni');
  const [officerRole, setOfficerRole] = useState('Additional District Magistrate (Development)');
  const [notes, setNotes] = useState('Reviewed administrative file, statutory sanction granted per SOP.');
  const [submitting, setSubmitting] = useState(false);

  if (!task) return null;

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    try {
      await approveTask(caseId, task.id, {
        officer_name: officerName.trim(),
        officer_role: officerRole.trim(),
        decision: decision,
        notes: notes.trim()
      });
      toast.success(`Action "${task.id.replace(`${caseId}-`, '')}" marked as ${decision}.`);
      onClose();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Human Authority Gate"
      subtitle={`Statutory Rule: ${task.approval_rule_id || 'RULE-HIGH-RISK-VERIFICATION'}`}
      maxWidth="max-w-lg"
    >
      {/* Target Task Summary */}
      <div className="bg-bg-base p-3.5 rounded-xl border border-zinc-800 mb-3 text-xs">
        <div className="flex justify-between mb-1 text-[11px] text-zinc-400">
          <span>Target: <strong className="text-zinc-200 font-mono">{task.id}</strong></span>
          <span className="text-amber-400 font-mono font-medium uppercase">{task.risk_level} RISK</span>
        </div>
        <p className="font-semibold text-zinc-100 text-sm mb-1">{task.title}</p>
        <p className="text-zinc-400">Authority: <strong className="text-zinc-200 font-medium">{task.authority}</strong></p>
      </div>

      {/* Governance Notice */}
      <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-200/90 mb-4 flex items-start gap-2.5">
        <Warning size={16} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          This action involves legal determination or public infrastructure expenditure. Per ResolveGraph governance guardrails, autonomous execution is blocked until an authorized officer submits signoff.
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-3 text-xs mb-5">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Authorizing Officer Name
          </label>
          <input
            type="text"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Designation & Statutory Role
          </label>
          <input
            type="text"
            value={officerRole}
            onChange={(e) => setOfficerRole(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Authorization Finding / Sanction Order
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 active:scale-[0.98]"
        >
          Cancel
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <XCircle size={15} />
            <span>Reject Action</span>
          </button>
          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-subtle"
          >
            <CheckCircle size={15} weight="bold" />
            <span>Sign & Authorize</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
