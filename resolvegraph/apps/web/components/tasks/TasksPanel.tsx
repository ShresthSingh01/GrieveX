'use client';

import React, { useState } from 'react';
import { CaseDetail, Task } from '../../types';
import { 
  CheckCircle, 
  Clock, 
  ShieldWarning, 
  Prohibit, 
  CloudArrowUp, 
  ShieldCheck,
  Lightning,
  X
} from '@phosphor-icons/react';
import { completeTask } from '../../lib/api';
import { useToast } from '../../lib/toast';

interface TasksPanelProps {
  currentCase: CaseDetail;
  onOpenApprovalModal: (task: Task) => void;
  onRefresh: () => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  currentCase,
  onOpenApprovalModal,
  onRefresh
}) => {
  const toast = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceContent, setEvidenceContent] = useState('');

  const handleCompleteTask = async (task: Task) => {
    if (!evidenceTitle.trim() || !evidenceContent.trim()) {
      toast.warning('Please provide evidence title and verification details.');
      return;
    }
    setCompletingTaskId(task.id);
    try {
      await completeTask(currentCase.id, task.id, {
        evidence_title: evidenceTitle.trim(),
        evidence_content: evidenceContent.trim(),
        submitted_by: `${task.authority} Field Officer`
      });
      setSelectedTask(null);
      setEvidenceTitle('');
      setEvidenceContent('');
      toast.success(`Task ${task.id.replace(`${currentCase.id}-`, '')} completed with verified evidence.`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const activeTasks = currentCase.tasks || [];
  const readyCount = activeTasks.filter(t => t.status === 'READY').length;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 text-zinc-300 text-xs">
      {/* Ready Parallel Tasks Notification */}
      <div className="bg-bg-surface border border-zinc-800 rounded-xl p-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
            <Lightning size={14} weight="fill" className="text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold text-zinc-200 block text-xs">Parallel Execution</span>
            <span className="text-[11px] text-zinc-400">
              {readyCount} actionable task(s) unblocked
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 font-mono text-xs font-semibold text-emerald-400">
          {readyCount} Ready
        </span>
      </div>

      {/* Task Cards List */}
      <div className="flex flex-col gap-2.5">
        {activeTasks.map((t) => {
          const isInvalidated = t.invalidated || t.status === 'INVALIDATED';
          const isCompleted = t.status === 'COMPLETED';
          const isReady = t.status === 'READY';
          const isApprovalReq = t.status === 'HUMAN_APPROVAL_REQUIRED';

          // Card styles
          const statusCardClass = isInvalidated
            ? 'bg-zinc-900/40 border-rose-900/30 opacity-60 line-through'
            : isCompleted
            ? 'bg-bg-surface border-zinc-800/90'
            : isApprovalReq
            ? 'bg-bg-surface border-amber-700/50 shadow-subtle'
            : isReady
            ? 'bg-bg-surface border-emerald-500/40 shadow-subtle'
            : 'bg-bg-surface border-zinc-800/80';

          return (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border transition-all duration-150 ${statusCardClass}`}
            >
              {/* Header: ID, Authority, Risk */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-elevated text-zinc-300 border border-zinc-700/60">
                    {t.id.replace(`${currentCase.id}-`, '')}
                  </span>
                  <span className="font-medium text-zinc-200 text-xs truncate max-w-[130px]">
                    {t.authority}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {t.is_replanned && (
                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Replanned
                    </span>
                  )}
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    t.risk_level === 'HIGH' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' :
                    t.risk_level === 'MEDIUM' ? 'bg-amber-950/40 text-amber-300 border border-amber-900/40' :
                    'bg-zinc-800/40 text-zinc-400 border border-zinc-700/60'
                  }`}>
                    {t.risk_level}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className={`font-medium text-xs mb-2 leading-snug ${isInvalidated ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                {t.title}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1.5">
                  {isCompleted && <CheckCircle size={13} weight="fill" className="text-emerald-400" />}
                  {isApprovalReq && <ShieldWarning size={13} weight="fill" className="text-amber-400" />}
                  {isReady && <Clock size={13} className="text-emerald-400" />}
                  {isInvalidated && <Prohibit size={13} className="text-rose-400" />}
                  <span>{t.status.replace(/_/g, ' ')}</span>
                </span>

                {/* Human Approval Button */}
                {isApprovalReq && (
                  <button
                    onClick={() => onOpenApprovalModal(t)}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1 active:scale-[0.98] transition-all shadow-subtle"
                  >
                    <ShieldCheck size={14} weight="bold" />
                    <span>Signoff Required</span>
                  </button>
                )}

                {/* Complete Task with Evidence Button */}
                {isReady && (
                  <button
                    onClick={() => {
                      setSelectedTask(t);
                      setEvidenceTitle(`${t.title} Execution Report`);
                      setEvidenceContent(`On-site work completed by ${t.authority} team. Field verification report attached.`);
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-1 active:scale-[0.98] transition-all shadow-subtle"
                  >
                    <CloudArrowUp size={14} weight="bold" />
                    <span>Submit Proof</span>
                  </button>
                )}
              </div>

              {/* Submitted Evidence Preview */}
              {t.submitted_evidence && t.submitted_evidence.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={13} weight="bold" />
                    Verified Evidence
                  </span>
                  {t.submitted_evidence.map((ev, i) => (
                    <div key={i} className="text-[11px] bg-bg-base p-2 rounded-md border border-zinc-800 text-zinc-300">
                      <span className="font-medium text-zinc-200 block">{ev.title}</span>
                      <span className="text-zinc-400 text-[10px] block mt-0.5">{ev.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline Evidence Submission Modal for Ready Task */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
          <div className="bg-bg-surface border border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-elevated animate-fade-up">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Submit Verification Proof
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedTask.id.replace(`${currentCase.id}-`, '')}: {selectedTask.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Evidence Title
                </label>
                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                  Verification Notes / Citizen Proof
                </label>
                <textarea
                  rows={3}
                  value={evidenceContent}
                  onChange={(e) => setEvidenceContent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteTask(selectedTask)}
                  disabled={completingTaskId === selectedTask.id}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 active:scale-[0.98] transition-all shadow-subtle"
                >
                  {completingTaskId === selectedTask.id ? 'Recording...' : 'Submit & Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
