'use client';

import React, { useState } from 'react';
import { AuditEvent } from '../../types';
import { 
  ClockCounterClockwise, 
  ShieldCheck, 
  Lightning, 
  User, 
  CheckCircle, 
  FileText,
  Brain,
  Scales,
  ArrowRight
} from '@phosphor-icons/react';

interface AuditTimelineProps {
  events: AuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'reasoning'>('reasoning');

  const getEventIcon = (type: string) => {
    if (type.includes('REPLAN')) return <Lightning size={13} weight="fill" className="text-amber-400 shrink-0" />;
    if (type.includes('APPROVAL')) return <ShieldCheck size={13} weight="fill" className="text-amber-400 shrink-0" />;
    if (type.includes('COMPLETED')) return <CheckCircle size={13} weight="fill" className="text-emerald-400 shrink-0" />;
    if (type.includes('EVIDENCE')) return <FileText size={13} className="text-zinc-400 shrink-0" />;
    return <User size={13} className="text-zinc-400 shrink-0" />;
  };

  // Filter events with rich AI reasoning or decision metadata
  const decisionEvents = events.filter(
    (ev) =>
      ev.event_type.includes('REPLAN') ||
      ev.event_type.includes('VERIFICATION') ||
      ev.event_type.includes('APPROVAL') ||
      ev.event_type.includes('ANALYZED') ||
      (ev.metadata && (ev.metadata.rule_id || ev.metadata.why))
  );

  return (
    <section className="bg-bg-surface border border-zinc-800 rounded-xl p-3 text-xs shadow-subtle">
      {/* Header with View Mode Selector */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-[11px] text-zinc-400">
            <ClockCounterClockwise size={14} className="text-zinc-400" />
            Audit Ledger ({events?.length || 0})
          </span>

          <div className="flex items-center bg-bg-base p-0.5 rounded-lg border border-zinc-800 text-[10px]">
            <button
              onClick={() => setViewMode('reasoning')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all ${
                viewMode === 'reasoning'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Brain size={12} weight="fill" />
              <span>AI Decision Reasoning</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Full Event Log</span>
            </button>
          </div>
        </div>

        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
          Deterministic Policy Traceability Engine
        </span>
      </div>

      {/* Content Rendering based on Mode */}
      {viewMode === 'reasoning' ? (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {decisionEvents && decisionEvents.length > 0 ? (
            decisionEvents.map((ev) => {
              const meta = ev.metadata || {};
              const ruleId = meta.rule_id || 'RULE-POLICY-GATE';
              const why = meta.why || ev.reason || ev.description;
              const shift = meta.shift;
              const timeStr = new Date(ev.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={ev.id}
                  className="shrink-0 p-3 rounded-lg bg-zinc-950/80 border border-emerald-900/40 hover:border-emerald-700/60 max-w-[320px] min-w-[260px] transition-all shadow-subtle flex flex-col justify-between"
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
                      <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
                        {ruleId}
                      </span>
                      <span className="font-mono text-zinc-500">{timeStr}</span>
                    </div>

                    {/* Main Title */}
                    <div className="flex items-start gap-1.5 text-[11px] font-semibold text-zinc-100 leading-snug mb-1.5">
                      {getEventIcon(ev.event_type)}
                      <span className="line-clamp-1">{ev.description}</span>
                    </div>

                    {/* Reasoning explanation box */}
                    <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-300 leading-relaxed mb-2">
                      <span className="text-emerald-400 font-medium">Why: </span>
                      {why}
                    </div>

                    {/* Shift tag if authority changed */}
                    {shift && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[9px] font-mono">
                        <span>Shift: {shift}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span>Actor: {ev.actor}</span>
                    <span className="text-emerald-500/80 font-medium">Verified</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-zinc-500 text-xs py-2">No AI decision events logged yet. Trigger dynamic replanning to see explainability cards.</div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {events && events.length > 0 ? (
            events.map((ev) => {
              const timeStr = new Date(ev.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={ev.id}
                  className="shrink-0 p-2.5 rounded-lg bg-bg-base border border-zinc-800/80 hover:border-zinc-700 max-w-[280px] min-w-[220px] transition-all shadow-subtle"
                >
                  <div className="flex items-center justify-between gap-1 mb-1 text-[10px]">
                    <span className="font-mono text-zinc-500">{timeStr}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-zinc-300 border border-zinc-700/60 truncate max-w-[130px]">
                      {ev.actor}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] font-medium text-zinc-200 leading-snug mb-1">
                    {getEventIcon(ev.event_type)}
                    <span className="line-clamp-2">{ev.description}</span>
                  </div>
                  {ev.reason && (
                    <p className="text-[10px] text-zinc-400 italic line-clamp-1">
                      Cause: {ev.reason}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-zinc-500 text-xs py-2">No audit events logged yet.</div>
          )}
        </div>
      )}
    </section>
  );
};

