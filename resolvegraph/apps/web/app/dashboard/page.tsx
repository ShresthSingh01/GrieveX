'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseDetail, GraphData, Task } from '@/types';
import { fetchCases, fetchCase, fetchGraph, resetDemoSeed } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { CaseHeader } from '@/components/grievance/CaseHeader';
import { ClaimsPanel } from '@/components/grievance/ClaimsPanel';
import { ResolutionGraph } from '@/components/graph/ResolutionGraph';
import { TasksPanel } from '@/components/tasks/TasksPanel';
import { AuditTimeline } from '@/components/audit/AuditTimeline';
import { EvidenceModal } from '@/components/officer/EvidenceModal';
import { ApprovalModal } from '@/components/officer/ApprovalModal';
import { VerificationModal } from '@/components/officer/VerificationModal';
import { EvaluationModal } from '@/components/evaluation/EvaluationModal';
import { SubmitModal } from '@/components/grievance/SubmitModal';
import { DashboardSkeleton } from '@/components/layout/DashboardSkeleton';
import { BreathingDot } from '@/components/motion/BreathingDot';
import { 
  StackSimple, 
  GitBranch, 
  ListChecks, 
  ArrowCounterClockwise, 
  CaretDown,
  ArrowLeft
} from '@phosphor-icons/react';

export default function DashboardPage() {
  const toast = useToast();
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('GRV-001');
  const [currentCase, setCurrentCase] = useState<CaseDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedTaskForApproval, setSelectedTaskForApproval] = useState<Task | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Load initial cases and selected case
  const loadData = async (targetId?: string) => {
    setLoading(true);
    try {
      const cases = await fetchCases();
      setCasesList(cases);

      const activeId = targetId || selectedCaseId || (cases[0]?.id ?? 'GRV-001');
      setSelectedCaseId(activeId);

      const [caseDetail, graph] = await Promise.all([
        fetchCase(activeId),
        fetchGraph(activeId),
      ]);
      setCurrentCase(caseDetail);
      setGraphData(graph);
    } catch (e: any) {
      console.error('Failed to load case data', e);
      toast.error('Could not connect to grievance intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    loadData(caseId);
  };

  const handleResetSeed = async () => {
    setLoading(true);
    try {
      await resetDemoSeed();
      await loadData('GRV-001');
      toast.success('Grievance intelligence re-seeded with 5 baseline cases.');
    } catch (e: any) {
      toast.error('Failed to reset seed data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproval = (task: Task) => {
    setSelectedTaskForApproval(task);
    setApprovalModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-bg-base text-zinc-100 font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-800 bg-bg-surface/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-5">
          {/* Back to Landing Page & Logo */}
          <Link 
            href="/"
            className="flex items-center gap-3 group transition-opacity hover:opacity-90"
            title="Return to Landing Page"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tight shadow-subtle group-hover:bg-emerald-400 transition-colors">
              RG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-zinc-100 leading-none">
                  ResolveGraph
                </span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  Console
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800/60 font-medium"
          >
            <ArrowLeft size={12} />
            <span>Overview</span>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          {/* Quick Case Switcher Dropdown */}
          <div className="relative flex items-center">
            <select
              value={selectedCaseId}
              onChange={(e) => handleSelectCase(e.target.value)}
              className="appearance-none bg-bg-elevated border border-zinc-700/80 hover:border-zinc-600 text-xs text-zinc-200 font-medium rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-emerald-500/80 cursor-pointer transition-colors max-w-[280px] truncate shadow-subtle"
            >
              {casesList.map((c) => (
                <option key={c.id} value={c.id} className="bg-bg-elevated text-zinc-200">
                  {c.id} — {c.title?.slice(0, 32)}...
                </option>
              ))}
            </select>
            <CaretDown size={14} className="text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs bg-bg-elevated/80 px-2.5 py-1 rounded-md border border-zinc-800">
            <BreathingDot status="active" />
            <span className="text-zinc-400 text-[11px]">Engine:</span>
            <span className="font-mono font-medium text-emerald-400 text-[11px]">Synchronized</span>
          </div>

          <button
            onClick={handleResetSeed}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-bg-elevated hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 font-medium transition-all active:scale-[0.98]"
            title="Reset demo cases to initial state"
          >
            <ArrowCounterClockwise size={13} className="text-zinc-400" />
            <span>Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Main Container with smooth entrance */}
      {loading && !currentCase ? (
        <DashboardSkeleton />
      ) : currentCase ? (
        <motion.div 
          key={currentCase.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="flex flex-col flex-1 min-h-0 w-full max-w-[1400px] mx-auto"
        >
          {/* Subheader */}
          <CaseHeader
            currentCase={currentCase}
            onOpenEvidenceModal={() => setEvidenceModalOpen(true)}
            onOpenVerificationModal={() => setVerificationModalOpen(true)}
            onOpenEvaluationModal={() => setEvaluationModalOpen(true)}
            onOpenSubmitModal={() => setSubmitModalOpen(true)}
            onResetSeed={handleResetSeed}
            onRefresh={() => loadData(selectedCaseId)}
            loading={loading}
          />

          {/* Asymmetric 3-Column Core Grid */}
          <main className="grid grid-cols-12 gap-5 flex-1 min-h-0 px-6 py-4 overflow-hidden">
            {/* Left Column: Claims Decomposition + Citizen Impact */}
            <div className="col-span-12 lg:col-span-3 h-full overflow-hidden flex flex-col">
              <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <StackSimple size={14} className="text-zinc-400" />
                <span>Citizen Context & Decomposition</span>
              </div>
              <div className="flex-1 min-h-0">
                <ClaimsPanel currentCase={currentCase} onRefresh={() => loadData(selectedCaseId)} />
              </div>
            </div>

            {/* Center Column: DAG Resolution Graph */}
            <div className="col-span-12 lg:col-span-6 h-full flex flex-col min-h-0">
              <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GitBranch size={14} className="text-emerald-500" />
                  <span>Resolution Plan DAG</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Deterministic Topological Graph
                </span>
              </div>
              <div className="flex-1 min-h-0">
                {graphData && (
                  <ResolutionGraph
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    workflowName={graphData.workflow_name}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Orchestrated Tasks */}
            <div className="col-span-12 lg:col-span-3 h-full overflow-hidden flex flex-col">
              <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ListChecks size={14} className="text-emerald-400" />
                  <span>Orchestrated Actions</span>
                </span>
                <span className="text-zinc-400 font-mono text-[10px]">
                  {currentCase.tasks?.length || 0} Tasks
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <TasksPanel
                  currentCase={currentCase}
                  onOpenApprovalModal={handleOpenApproval}
                  onRefresh={() => loadData(selectedCaseId)}
                />
              </div>
            </div>
          </main>

          {/* Bottom Row: Audit Timeline */}
          <footer className="px-6 pb-4 shrink-0">
            <AuditTimeline events={currentCase.audit_events || []} />
          </footer>
        </motion.div>
      ) : null}

      {/* Modals */}
      {evidenceModalOpen && (
        <EvidenceModal
          caseId={selectedCaseId}
          onClose={() => setEvidenceModalOpen(false)}
          onRefresh={() => loadData(selectedCaseId)}
        />
      )}

      {approvalModalOpen && (
        <ApprovalModal
          caseId={selectedCaseId}
          task={selectedTaskForApproval}
          onClose={() => setApprovalModalOpen(false)}
          onRefresh={() => loadData(selectedCaseId)}
        />
      )}

      {verificationModalOpen && (
        <VerificationModal
          caseId={selectedCaseId}
          onClose={() => setVerificationModalOpen(false)}
          onRefresh={() => loadData(selectedCaseId)}
        />
      )}

      {evaluationModalOpen && (
        <EvaluationModal onClose={() => setEvaluationModalOpen(false)} />
      )}

      {submitModalOpen && (
        <SubmitModal
          onClose={() => setSubmitModalOpen(false)}
          onCaseCreated={(newId) => handleSelectCase(newId)}
        />
      )}
    </div>
  );
}
