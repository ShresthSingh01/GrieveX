'use client';

import React, { useState } from 'react';
import { CaseDetail } from '@/types';
import { 
  FileText, 
  StackSimple, 
  Buildings, 
  Warning, 
  Question, 
  CaretDown, 
  CaretUp, 
  CheckCircle, 
  PaperPlaneRight,
  HeartBreak
} from '@phosphor-icons/react';
import { provideMissingInfo } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { CitizenImpactCard } from './CitizenImpactCard';

interface ClaimsPanelProps {
  currentCase: CaseDetail;
  onRefresh: () => void;
}

export const ClaimsPanel: React.FC<ClaimsPanelProps> = ({ currentCase, onRefresh }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'human' | 'technical'>('human');
  const [missingInputValue, setMissingInputValue] = useState<{ [key: string]: string }>({});
  const [submittingField, setSubmittingField] = useState<string | null>(null);

  const handleProvideMissingInfo = async (fieldName: string) => {
    const val = missingInputValue[fieldName];
    if (!val || !val.trim()) {
      toast.warning('Please enter a value to submit.');
      return;
    }
    setSubmittingField(fieldName);
    try {
      await provideMissingInfo(currentCase.id, {
        field_name: fieldName,
        value: val.trim(),
        submitted_by: `${currentCase.citizen_name || 'Citizen'}`
      });
      setMissingInputValue({ ...missingInputValue, [fieldName]: '' });
      toast.success(`Required clarification "${fieldName}" recorded.`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to provide info');
    } finally {
      setSubmittingField(null);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 h-full overflow-y-auto pr-1 text-zinc-300 text-xs">
      {/* Human Reality & Citizen Impact Spotlight */}
      <CitizenImpactCard currentCase={currentCase} />

      {/* 2. Extracted Claims */}
      <section className="bg-bg-surface border border-zinc-800 rounded-xl p-3.5 shadow-subtle">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-[11px] text-zinc-400">
            <StackSimple size={14} className="text-zinc-400" />
            Decomposed Claims
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-elevated text-zinc-400 border border-zinc-700/60">
            {currentCase.claims?.length || 0}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {(!currentCase.claims || currentCase.claims.length === 0) && (
            <div className="text-[11px] text-zinc-500 text-center py-3">
              No claims decomposed yet.
            </div>
          )}
          {currentCase.claims?.map((claim) => (
            <div key={claim.id} className="p-2.5 rounded-lg bg-bg-base border border-zinc-800/80 flex items-start gap-2">
              <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                {claim.id.split('-').slice(-2).join('-')}
              </span>
              <p className="leading-snug text-zinc-200 text-xs">{claim.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Involved Authorities */}
      <section className="bg-bg-surface border border-zinc-800 rounded-xl p-3.5 shadow-subtle">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-[11px] text-zinc-400">
            <Buildings size={14} className="text-zinc-400" />
            Jurisdictions & Authorities
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-elevated text-zinc-400 border border-zinc-700/60">
            {currentCase.authorities?.length || 0}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {(!currentCase.authorities || currentCase.authorities.length === 0) && (
            <div className="text-[11px] text-zinc-500 text-center py-3">
              No authorities registered.
            </div>
          )}
          {currentCase.authorities?.map((auth) => (
            <div key={auth.id} className="p-2.5 rounded-lg bg-bg-base border border-zinc-800/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-medium text-zinc-200 block text-xs truncate">{auth.name}</span>
                <span className="text-[11px] text-zinc-400 block truncate">{auth.role}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-12 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.round(auth.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 min-w-[28px] text-right">
                  {Math.round(auth.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Detected Conflicts */}
      {currentCase.conflicts && currentCase.conflicts.length > 0 && (
        <section className="bg-zinc-900/90 rounded-xl p-3.5 border border-amber-800/40 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-[11px] text-amber-400">
              <Warning size={14} weight="fill" className="text-amber-400" />
              Inter-Departmental Disputes
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              {currentCase.conflicts.length}
            </span>
          </div>
          {currentCase.conflicts.map((conf) => (
            <div key={conf.id} className="p-2.5 rounded-lg bg-zinc-950/60 border border-amber-900/30 text-zinc-300">
              <div className="font-medium text-xs mb-1 flex items-center justify-between">
                <span className="text-zinc-200">{conf.party_a} vs {conf.party_b}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                  conf.status === 'RESOLVED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}>
                  {conf.status}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                {conf.description}
              </p>
              {conf.status === 'RESOLVED' && conf.resolution_notes && (
                <div className="text-[11px] bg-zinc-900 p-1.5 rounded border border-emerald-800/40 text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-emerald-400" />
                  <span>Resolved: {conf.resolution_notes}</span>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 5. Required Missing Clarifications */}
      {currentCase.missing_info && currentCase.missing_info.length > 0 && (
        <section className="bg-zinc-900/90 rounded-xl p-3.5 border border-rose-900/40 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-[11px] text-rose-400">
              <Question size={14} weight="bold" className="text-rose-400" />
              Required Clarifications
            </span>
            <span className="text-[10px] font-mono text-rose-400">
              {currentCase.missing_info.length}
            </span>
          </div>
          {currentCase.missing_info.map((m) => (
            <div key={m.id} className="p-2.5 rounded-lg bg-zinc-950/60 border border-rose-900/30 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200 text-[11px]">{m.field_name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                  m.status === 'PROVIDED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {m.status}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2">{m.description}</p>
              {m.status !== 'PROVIDED' && (
                <div className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder="Enter ID / reference value..."
                    value={missingInputValue[m.field_name] || ''}
                    onChange={(e) => setMissingInputValue({ ...missingInputValue, [m.field_name]: e.target.value })}
                    className="flex-1 px-2.5 py-1 text-xs rounded-md bg-bg-base border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleProvideMissingInfo(m.field_name)}
                    disabled={submittingField === m.field_name}
                    className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 active:scale-[0.98] transition-all border border-zinc-700"
                  >
                    <PaperPlaneRight size={12} weight="bold" />
                    <span>Submit</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
