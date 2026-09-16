'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseDetail } from '@/types';
import { getCitizenImpactProfile } from '@/lib/citizenStakes';
import { 
  HeartBreak, 
  HourglassMedium, 
  UsersThree, 
  WarningDiamond, 
  ArrowSquareOut, 
  Quotes,
  User,
  MapPin,
  X
} from '@phosphor-icons/react';
import { ModalShell } from '@/components/modals/ModalShell';

interface CitizenImpactCardProps {
  currentCase: CaseDetail;
}

export const CitizenImpactCard: React.FC<CitizenImpactCardProps> = ({ currentCase }) => {
  const profile = getCitizenImpactProfile(currentCase);
  const [dossierOpen, setDossierOpen] = useState(false);

  return (
    <>
      <section className="bg-bg-surface border border-zinc-800 rounded-xl p-3.5 shadow-subtle relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <HeartBreak size={15} weight="fill" className="text-rose-400 shrink-0" />
            <span className="font-semibold text-xs tracking-tight text-zinc-100">
              Human Reality & Citizen Stakes
            </span>
          </div>
          <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border font-medium ${profile.urgencyColor}`}>
            {profile.vulnerabilityLevel}
          </span>
        </div>

        {/* Emotion Pull Quote */}
        <div className="bg-bg-base/90 p-3 rounded-lg border border-zinc-800/80 mb-3 relative">
          <Quotes size={18} weight="fill" className="text-zinc-600 absolute top-2 right-2 opacity-50" />
          <p className="text-xs italic text-zinc-200 leading-relaxed font-serif pr-4">
            &ldquo;{profile.emotionalQuote}&rdquo;
          </p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 font-sans text-zinc-300 font-medium">
              <User size={12} className="text-zinc-500" />
              {currentCase.citizen_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-sans">
              <MapPin size={12} className="text-zinc-500" />
              {currentCase.location}
            </span>
          </div>
        </div>

        {/* Vulnerability Matrix Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {/* Days In Limbo */}
          <div className="bg-bg-base/70 p-2 rounded-md border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 mb-0.5">
              <HourglassMedium size={12} className="text-amber-400" />
              Days in Limbo
            </span>
            <span className="font-mono text-sm font-bold text-zinc-100">
              {profile.daysInLimbo} Days
            </span>
            <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">
              Awaiting resolution
            </span>
          </div>

          {/* Affected Population */}
          <div className="bg-bg-base/70 p-2 rounded-md border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 mb-0.5">
              <UsersThree size={12} className="text-emerald-400" />
              Affected
            </span>
            <span className="font-medium text-[11px] text-zinc-200 block truncate">
              {profile.affectedPopulation}
            </span>
            <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">
              High vulnerability
            </span>
          </div>
        </div>

        {/* Real-World Risk & Deadlock */}
        <div className="space-y-2 text-[11px] mb-3">
          <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300">
            <span className="text-[10px] font-medium uppercase tracking-wider text-rose-400 block mb-0.5 flex items-center gap-1">
              <WarningDiamond size={12} weight="fill" className="text-rose-400" />
              Real-World Human Consequence
            </span>
            <p className="text-zinc-300 leading-relaxed">
              {profile.realWorldRisk}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300">
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400 block mb-0.5">
              Bureaucratic Deadlock Faced
            </span>
            <p className="text-zinc-400 leading-relaxed text-[10.5px]">
              {profile.bureaucraticFriction}
            </p>
          </div>
        </div>

        {/* Action Button: Inspect Citizen Dossier */}
        <button
          onClick={() => setDossierOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-all active:scale-[0.98]"
        >
          <span>View Citizen Reality Dossier</span>
          <ArrowSquareOut size={13} />
        </button>
      </section>

      {/* Citizen Reality Dossier Modal */}
      {dossierOpen && (
        <ModalShell
          isOpen={dossierOpen}
          onClose={() => setDossierOpen(false)}
          title={`Ground Reality Dossier: ${currentCase.citizen_name}`}
          subtitle={`${currentCase.id} • ${currentCase.location}`}
          maxWidth="max-w-xl"
        >
          <div className="flex flex-col gap-4 text-xs text-zinc-300">
            {/* Citizen Quote Banner */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <Quotes size={22} weight="fill" className="text-emerald-400 mb-1" />
              <p className="text-sm italic text-zinc-100 font-serif leading-relaxed">
                &ldquo;{currentCase.complaint_text}&rdquo;
              </p>
              <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Submitted by: <strong className="text-zinc-200 font-sans">{currentCase.citizen_name}</strong></span>
                <span className="font-mono text-zinc-500">{new Date(currentCase.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Impact Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-base border border-zinc-800">
                <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">
                  Living Conditions & Risk
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {profile.realWorldRisk}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-bg-base border border-zinc-800">
                <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">
                  Systemic Failure Cause
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {profile.bureaucraticFriction}
                </p>
              </div>
            </div>

            {/* Why Deterministic Resolution Matters */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                How ResolveGraph Protects This Citizen:
              </span>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Traditional portals allow departments to mark cases &ldquo;Resolved&rdquo; without visiting the site. ResolveGraph locks closure behind <strong>Gate 5 (Citizen Proof)</strong> and <strong>Gate 4 (Officer Statutory Signoff)</strong>. No case can be swept under the rug.
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setDossierOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 active:scale-[0.98]"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
};
