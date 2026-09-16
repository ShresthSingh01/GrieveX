'use client';

import React, { useState } from 'react';
import { Lightning, PaperPlaneRight } from '@phosphor-icons/react';
import { submitGrievance, analyzeGrievance } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { ModalShell } from '../modals/ModalShell';

interface SubmitModalProps {
  onClose: () => void;
  onCaseCreated: (newCaseId: string) => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ onClose, onCaseCreated }) => {
  const toast = useToast();
  const [complaintText, setComplaintText] = useState('');
  const [title, setTitle] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('drainage_roads');
  const [submitting, setSubmitting] = useState(false);

  // Preset loaders
  const loadPreset = (presetType: string) => {
    if (presetType === 'drainage') {
      setTitle('Severe Residential Flooding & Blocked Arterial Drain');
      setComplaintText(
        'My house at 42 Rajendra Nagar is repeatedly flooded during every rain because the main arterial stormwater drain outside is severely blocked with debris. The Municipality ward officer claims the arterial drain falls under PWD jurisdiction and refuses to clear it, while PWD local office has not responded to multiple visits. The backflow is now causing structural dampness and severe property damage to my boundary wall.'
      );
      setCitizenName('Ramesh Verma');
      setLocation('Ward 14, Rajendra Nagar, Zone 3');
      setCategory('drainage_roads');
      toast.info('Loaded Drainage Flooding scenario');
    } else if (presetType === 'pension') {
      setTitle('Discontinued Senior Citizen Disability Pension');
      setComplaintText(
        'My monthly disability pension has suddenly stopped being credited to my bank account for the past 4 months. The local bank branch manager says the welfare department did not disburse the pension batch, whereas the social security office tells me to check with the bank. I have no other source of livelihood.'
      );
      setCitizenName('Saraswati Devi');
      setLocation('Sector 9, Civil Lines');
      setCategory('welfare_pension');
      toast.info('Loaded Disability Pension scenario');
    } else if (presetType === 'electric') {
      setTitle('Hazardous High Tension Cable & Road Widening Dispute');
      setComplaintText(
        'An overhead high-tension electric cable is hanging dangerously low across our colony road following storm winds. The Electricity Board states that road widening by the Municipal Corporation raised the road level without statutory clearances, whereas the Municipality asserts the power pole alignment was installed illegally without road right-of-way permission. Meanwhile school buses cannot pass and sparks were seen yesterday.'
      );
      setCitizenName('Anand Mohan');
      setLocation('Crossroad 4, Gandhi Colony');
      setCategory('electricity_infrastructure');
      toast.info('Loaded HT Electric Cable Hazard scenario');
    } else if (presetType === 'compensation') {
      setTitle('Commercial Demolition Damage and Compensation Demand');
      setComplaintText(
        'During an anti-encroachment drive conducted by the Town Planning enforcement squad, the heavy JCB equipment accidentally demolished a registered commercial godown shed belonging to my firm, destroying stored goods worth 12 Lakh Rupees. The revenue surveyor admitted on-site that our plot was outside the demarcation line. I demand immediate compensation and suspension of further demolition until formal joint survey.'
      );
      setCitizenName('Sunil Bansal');
      setLocation('Plot 88, Transport Nagar Bypass');
      setCategory('infrastructure_compensation');
      toast.info('Loaded Demolition Compensation scenario');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) {
      toast.warning('Please enter grievance complaint text.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitGrievance({
        complaint_text: complaintText.trim(),
        title: title.trim() || undefined,
        citizen_name: citizenName.trim() || 'Anonymous Citizen',
        location: location.trim() || 'City Ward',
        category: category
      });
      const caseId = res.case_id;

      // Automatically run analysis to build DAG immediately
      await analyzeGrievance(caseId, true);
      toast.success(`Grievance registered & resolution DAG generated: ${caseId}`);
      onCaseCreated(caseId);
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Register Public Grievance"
      subtitle="Decomposes unstructured complaint into a living deterministic resolution graph"
      maxWidth="max-w-xl"
    >
      {/* Benchmark Presets */}
      <div className="mb-4 bg-bg-base p-3 rounded-xl border border-zinc-800">
        <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider block mb-2">
          Benchmark Grievance Scenarios
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => loadPreset('drainage')}
            className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-left transition-all active:scale-[0.98]"
          >
            <div className="font-medium text-xs flex items-center gap-1.5 text-zinc-200">
              <Lightning size={12} weight="fill" className="text-emerald-400 shrink-0" />
              <span>Drain Flooding Dispute</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Municipality vs PWD</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('pension')}
            className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-left transition-all active:scale-[0.98]"
          >
            <div className="font-medium text-xs flex items-center gap-1.5 text-zinc-200">
              <Lightning size={12} weight="fill" className="text-amber-400 shrink-0" />
              <span>Disability Pension Delay</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Social Welfare & Bank</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('electric')}
            className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-left transition-all active:scale-[0.98]"
          >
            <div className="font-medium text-xs flex items-center gap-1.5 text-zinc-200">
              <Lightning size={12} weight="fill" className="text-rose-400 shrink-0" />
              <span>HT Electric Cable Hazard</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">DISCOM vs Municipality</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('compensation')}
            className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-left transition-all active:scale-[0.98]"
          >
            <div className="font-medium text-xs flex items-center gap-1.5 text-zinc-200">
              <Lightning size={12} weight="fill" className="text-emerald-400 shrink-0" />
              <span>Demolition Compensation</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Town Planning Demarcation</div>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Grievance Title
          </label>
          <input
            type="text"
            placeholder="e.g. Flooding due to blocked arterial drain"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Grievance Narrative *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Describe the complaint in natural language, mentioning involved agencies, conflicts, or damages..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
              Citizen Name
            </label>
            <input
              type="text"
              placeholder="Ramesh Verma"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
              Location / Ward
            </label>
            <input
              type="text"
              placeholder="Ward 14, Rajendra Nagar"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-bg-base border border-zinc-700 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center gap-3 pt-3 mt-1 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-subtle"
          >
            <PaperPlaneRight size={14} weight="bold" />
            <span>{submitting ? 'Deconstructing & Building DAG...' : 'Submit & Build Graph'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
