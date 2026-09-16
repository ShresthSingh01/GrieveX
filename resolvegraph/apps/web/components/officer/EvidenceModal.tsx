'use client';

import React, { useState } from 'react';
import { Lightning, FileText, CloudArrowUp } from '@phosphor-icons/react';
import { submitEvidence } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { ModalShell } from '../modals/ModalShell';

interface EvidenceModalProps {
  caseId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  caseId,
  onClose,
  onRefresh
}) => {
  const toast = useToast();
  const [evidenceType, setEvidenceType] = useState('CADASTRAL_GAZETTE_SURVEY');
  const [title, setTitle] = useState('PWD Executive Engineer Gazette Survey Order #441');
  const [content, setContent] = useState(
    'Official joint survey report confirms that the arterial storm drain along chainage 12+400 belongs to PWD Trunk Infrastructure, not the Municipality.'
  );
  const [submittedBy, setSubmittedBy] = useState('Revenue Tehsildar & PWD Roads Division');
  const [submitting, setSubmitting] = useState(false);

  const loadPWDPreset = () => {
    setEvidenceType('CADASTRAL_GAZETTE_SURVEY');
    setTitle('Official Gazette Survey Confirmation (PWD Trunk Drain)');
    setContent(
      'Joint field survey conducted with Revenue Department establishes that the arterial drain asset belongs to PWD Trunk Infrastructure. Municipality responsibility ceases.'
    );
    setSubmittedBy('Revenue Tehsildar & PWD Executive Engineer');
    toast.info('Loaded PWD Jurisdiction Confirmation scenario');
  };

  const loadMunicipalityPreset = () => {
    setEvidenceType('MUNICIPAL_REVENUE_ORDER');
    setTitle('Municipal Ward Cadastral Resolution');
    setContent(
      'Municipal Commissioner order confirms asset falls within Municipal Corporation maintenance jurisdiction.'
    );
    setSubmittedBy('Executive Engineer (Municipal Drainage)');
    toast.info('Loaded Municipal Jurisdiction Confirmation scenario');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.warning('Please fill out evidence title and details.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitEvidence(caseId, {
        evidence_type: evidenceType,
        title: title.trim(),
        content: content.trim(),
        submitted_by: submittedBy.trim()
      });
      onClose();
      onRefresh();
      if (res.plan_changed) {
        toast.info(
          `Dynamic Replan: ${res.new_tasks?.length || 0} task(s) created, ${res.invalidated_tasks?.length || 0} invalidated. Reason: ${res.replan_reason}`
        );
      } else {
        toast.success('Evidence recorded in case dossier.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Inject Physical Evidence & Trigger Replan"
      subtitle="Deterministic DAG adaptation to newly verified administrative evidence"
      maxWidth="max-w-lg"
    >
      {/* 1-Click Scenario Presets */}
      <div className="mb-4 bg-bg-base p-3 rounded-xl border border-zinc-800">
        <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block mb-2">
          Demonstration Scenarios
        </span>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={loadPWDPreset}
            className="text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-xs font-medium flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <Lightning size={14} weight="fill" className="text-emerald-400 shrink-0" />
              <span>PWD Jurisdiction Confirmation (rewires active tasks to PWD)</span>
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">Preset</span>
          </button>

          <button
            type="button"
            onClick={loadMunicipalityPreset}
            className="text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-xs font-medium flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <FileText size={14} className="text-zinc-400 shrink-0" />
              <span>Municipal Jurisdiction Confirmation</span>
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Preset</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-3 text-xs mb-5">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Evidence Type
          </label>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="CADASTRAL_GAZETTE_SURVEY">Official Cadastral / Gazette Survey</option>
            <option value="MUNICIPAL_REVENUE_ORDER">Municipal Revenue Order</option>
            <option value="ENGINEERING_INSPECTION_PHOTO">Engineering Inspection Photo</option>
            <option value="BANK_DISBURSEMENT_RECORD">Bank PFMS Disbursement Record</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Evidence Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Official Findings / Evidence Content
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Submitting Official / Department
          </label>
          <input
            type="text"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 active:scale-[0.98]"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-subtle"
        >
          <CloudArrowUp size={15} weight="bold" />
          <span>{submitting ? 'Analyzing & Replanning...' : 'Submit Evidence & Replan'}</span>
        </button>
      </div>
    </ModalShell>
  );
};
