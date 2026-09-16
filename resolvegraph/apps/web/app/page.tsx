'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Lightning, 
  GitBranch, 
  ShieldCheck, 
  Scales
} from '@phosphor-icons/react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroGraphPreview } from '@/components/landing/HeroGraphPreview';
import { DagSimulator } from '@/components/landing/DagSimulator';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 } 
  }
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-bg-base text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-100">
      <LandingNavbar />

      {/* ── SECTION 1: HERO (Strictly fits within initial viewport, max 4 text elements) ── */}
      <section className="relative w-full max-w-[1400px] mx-auto px-6 pt-12 md:pt-16 pb-14 flex flex-col justify-center min-h-[calc(100dvh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Hero Stack */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
            }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* 1. Eyebrow */}
            <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono mb-6 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>DETERMINISTIC CIVIC ORCHESTRATION</span>
            </motion.div>

            {/* 2. Headline (Max 2 lines on desktop) */}
            <motion.h1 variants={fadeUpVariant} className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter leading-[1.08] text-zinc-100 mb-5 text-balance">
              Deterministic Resolution for Complex Public Failures
            </motion.h1>

            {/* 3. Subtext (Max 20 words) */}
            <motion.p variants={fadeUpVariant} className="text-base text-zinc-400 leading-relaxed max-w-[54ch] mb-8">
              Transform multi-agency grievances into verifiable topological DAGs with dynamic replanning and five statutory closure gates.
            </motion.p>

            {/* 4. CTAs (1 primary + 1 secondary) */}
            <motion.div variants={fadeUpVariant} className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all duration-150 active:scale-[0.98] shadow-card"
              >
                <span>Launch Console</span>
                <ArrowRight size={16} weight="bold" />
              </Link>
              <a
                href="#simulator"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-bg-surface hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 transition-all active:scale-[0.98]"
              >
                <Lightning size={16} weight="fill" className="text-emerald-400" />
                <span>Simulate Replan</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Live Micro-DAG Visualizer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.15 }}
            className="lg:col-span-5 w-full"
          >
            <HeroGraphPreview />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: ARCHITECTURE METRICS STRIP (Under Hero with Viewport Animation) ── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
        }}
        className="w-full border-y border-zinc-800/80 bg-bg-surface/60 py-8 px-6"
      >
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Closure Reliability
            </span>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-zinc-100">
              5 Strict Gates
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Zero unauthorized closures without citizen proof.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Safety Guardrails
            </span>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-emerald-400">
              0 Unsafe Actions
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Statutory officer signoff on high-risk liabilities.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              E2E Accuracy
            </span>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-zinc-100">
              100% Pass Rate
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              7 baseline ground-truth benchmark suites.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Graph Topology
            </span>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-zinc-100">
              Dynamic Replan
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Instant edge mutation upon physical evidence.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 3: INTERACTIVE REPLANNING SIMULATOR ── */}
      <motion.section 
        id="simulator" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUpVariant}
        className="w-full max-w-[1400px] mx-auto px-6 py-20"
      >
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">
            Interactive System Proof
          </span>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
            Witness Dynamic Replanning Live
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-[65ch]">
            When contractors report unmapped physical obstacles or disputed jurisdiction, traditional ticketing systems stall. ResolveGraph dynamically rewires the active DAG in real-time.
          </p>
        </div>

        <DagSimulator />
      </motion.section>

      {/* ── SECTION 4: ARCHITECTURAL PILLARS (Bento Grid with Stagger) ── */}
      <motion.section 
        id="architecture" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUpVariant}
        className="w-full max-w-[1400px] mx-auto px-6 py-20 border-t border-zinc-800/80"
      >
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">
            Deterministic Engine Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
            Engineered Beyond Fragile LLM Agents
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-[65ch]">
            LLMs are utilized solely for initial claim extraction. All orchestration, edge dependency sorting, and closure audits are governed by an immutable, SQL-backed deterministic rule engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Bento Card 1: Topological DAG Builder */}
          <div className="md:col-span-7 bg-bg-surface border border-zinc-800 rounded-2xl p-6 shadow-card flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400 mb-4">
                <GitBranch size={18} weight="bold" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Deterministic Topological DAG Planner
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Translates unstructured grievances into strict Directed Acyclic Graphs. Tasks are executed strictly when all upstream dependencies report verified evidence, eliminating routing circularities.
              </p>
            </div>
            <div className="bg-bg-base rounded-xl p-3.5 border border-zinc-800/80 font-mono text-[11px] text-zinc-400">
              <span className="text-emerald-400">SELECT</span> tasks <span className="text-emerald-400">WHERE</span> status = &apos;READY&apos; <span className="text-emerald-400">AND</span> dependencies_satisfied = TRUE;
            </div>
          </div>

          {/* Bento Card 2: Dynamic Replanning */}
          <div className="md:col-span-5 bg-bg-surface border border-zinc-800 rounded-2xl p-6 shadow-card flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400 mb-4">
                <Lightning size={18} weight="fill" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Context-Preserving Replanning
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When new evidence arrives, invalid tasks are pruned while active edge dependencies are automatically rewired, retaining full audit history.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Invalidates Stale Nodes</span>
              <span className="text-emerald-400">Preserves Audit State</span>
            </div>
          </div>

          {/* Bento Card 3: 5-Gate Closure Verification */}
          <div className="md:col-span-5 bg-bg-surface border border-zinc-800 rounded-2xl p-6 shadow-card flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck size={18} weight="bold" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                5-Gate Evidence-Based Closure
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cases cannot be closed by clicking a button. They must satisfy five programmatic gates: completed tasks, zero disputes, provided info, officer signoff, and citizen proof.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Anti-Premature Closure</span>
              <span className="text-emerald-400">Verifiable Signoff</span>
            </div>
          </div>

          {/* Bento Card 4: Human Authority Guardrails */}
          <div className="md:col-span-7 bg-bg-surface border border-zinc-800 rounded-2xl p-6 shadow-card flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400 mb-4">
                <Scales size={18} weight="bold" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Statutory Human Authority Gates
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Autonomous AI actions are strictly gated for high-risk legal decisions or municipal expenditures. Designated human officers must review and cryptographically authorize critical steps.
              </p>
            </div>
            <div className="bg-bg-base rounded-xl p-3.5 border border-zinc-800/80 flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400 text-[11px]">Rule: RULE-HIGH-RISK-VERIFICATION</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
                Officer Signoff Required
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 5: ARCHITECTURAL COMPARISON ── */}
      <motion.section 
        id="comparison" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUpVariant}
        className="w-full max-w-[1400px] mx-auto px-6 py-20 border-t border-zinc-800/80"
      >
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">
            Engineering Matrix
          </span>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
            ResolveGraph vs. Traditional Approaches
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-[65ch]">
            Why deterministic hybrid intelligence outperforms both legacy ticketing queues and hallucination-prone pure LLM agents.
          </p>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-bg-surface/50 shadow-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                <th className="py-3.5 px-4">Capability</th>
                <th className="py-3.5 px-4 text-emerald-400 bg-emerald-950/20">ResolveGraph (Deterministic DAG)</th>
                <th className="py-3.5 px-4">Legacy Ticketing (CPGRAMS / Zendesk)</th>
                <th className="py-3.5 px-4">Pure LLM Chatbot Agents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-zinc-100">Orchestration Model</td>
                <td className="py-3.5 px-4 bg-emerald-950/10 font-medium text-emerald-300">
                  SQL-backed Topological DAG
                </td>
                <td className="py-3.5 px-4 text-zinc-400">Flat linear ticket queue</td>
                <td className="py-3.5 px-4 text-zinc-400">Probabilistic scratchpad / ReAct loop</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-zinc-100">Inter-Agency Deadlocks</td>
                <td className="py-3.5 px-4 bg-emerald-950/10 font-medium text-emerald-300">
                  Automated conflict detection & split
                </td>
                <td className="py-3.5 px-4 text-zinc-400">Ping-pong transfer between desks</td>
                <td className="py-3.5 px-4 text-zinc-400">Hallucinated routing decisions</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-zinc-100">Dynamic Obstruction Handling</td>
                <td className="py-3.5 px-4 bg-emerald-950/10 font-medium text-emerald-300">
                  Dynamic edge invalidation & rewiring
                </td>
                <td className="py-3.5 px-4 text-zinc-400">Manual reopen loop or lost context</td>
                <td className="py-3.5 px-4 text-zinc-400">Context window limit or hallucinated state</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-zinc-100">Closure Verification</td>
                <td className="py-3.5 px-4 bg-emerald-950/10 font-medium text-emerald-300">
                  5 programmatic policy gates + evidence
                </td>
                <td className="py-3.5 px-4 text-zinc-400">Manual &ldquo;Mark Closed&rdquo; button</td>
                <td className="py-3.5 px-4 text-zinc-400">Uncontrolled premature completion</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-zinc-100">Auditability & Accountability</td>
                <td className="py-3.5 px-4 bg-emerald-950/10 font-medium text-emerald-300">
                  Verifiable immutable event ledger
                </td>
                <td className="py-3.5 px-4 text-zinc-400">Fragmented internal notes</td>
                <td className="py-3.5 px-4 text-zinc-400">Opaque probabilistic tokens</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── SECTION 6: PRE-SEEDED BENCHMARK CASES ── */}
      <motion.section 
        id="benchmarks" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUpVariant}
        className="w-full max-w-[1400px] mx-auto px-6 py-20 border-t border-zinc-800/80"
      >
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">
            Seeded Evaluation Scenarios
          </span>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
            Pre-Configured Complex Civic Scenarios
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-[65ch]">
            Test real-world cases with multiple conflicting departments, physical obstacles, and strict statutory verification criteria ready in the console.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-bg-surface border border-zinc-800 rounded-xl p-4 shadow-subtle hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">GRV-001</span>
              <span className="text-[10px] font-mono text-emerald-400">Drainage & Roads</span>
            </div>
            <h4 className="text-xs font-semibold text-zinc-100 mb-1">Severe Residential Flooding</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Arterial stormwater drain blocked. Municipality claims PWD trunk jurisdiction; PWD fails to respond.
            </p>
          </div>

          <div className="bg-bg-surface border border-zinc-800 rounded-xl p-4 shadow-subtle hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">GRV-002</span>
              <span className="text-[10px] font-mono text-amber-400">Social Welfare</span>
            </div>
            <h4 className="text-xs font-semibold text-zinc-100 mb-1">Disability Pension Discontinuation</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Pension stopped for 4 months. Bank points to welfare dept; welfare dept points to bank core disbursement.
            </p>
          </div>

          <div className="bg-bg-surface border border-zinc-800 rounded-xl p-4 shadow-subtle hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">GRV-003</span>
              <span className="text-[10px] font-mono text-rose-400">Electricity Infrastructure</span>
            </div>
            <h4 className="text-xs font-semibold text-zinc-100 mb-1">Hazardous High-Tension Cable</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Cable hanging low over school bus route. DISCOM blames road raising; Municipality claims illegal pole alignment.
            </p>
          </div>

          <div className="bg-bg-surface border border-zinc-800 rounded-xl p-4 shadow-subtle hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">GRV-004</span>
              <span className="text-[10px] font-mono text-emerald-400">Demolition & Compensation</span>
            </div>
            <h4 className="text-xs font-semibold text-zinc-100 mb-1">Commercial Godown Demolition</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Registered property damaged during anti-encroachment drive. Revenue surveyor admitted plot was outside line.
            </p>
          </div>

          <div className="bg-bg-surface border border-zinc-800 rounded-xl p-4 shadow-subtle hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">GRV-005</span>
              <span className="text-[10px] font-mono text-zinc-400">Civic Lighting</span>
            </div>
            <h4 className="text-xs font-semibold text-zinc-100 mb-1">Streetlight Corridor Outage</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              1.2km transit corridor dark for 3 weeks. Underground transformer feeder fault with disputed maintenance contract.
            </p>
          </div>

          <div className="bg-bg-surface border border-emerald-500/40 rounded-xl p-4 shadow-subtle flex flex-col justify-between hover:border-emerald-400 transition-colors">
            <div>
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                Custom Grievance
              </span>
              <h4 className="text-xs font-semibold text-zinc-100 mb-1">Register New Incident</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Submit any unstructured public complaint to decompose into an automated topological DAG.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <span>Test in Console</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 7: FINAL CALL TO ACTION ── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={fadeUpVariant}
        className="w-full border-t border-zinc-800/80 bg-bg-surface/80 py-16 px-6"
      >
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
              Deploy Verifiable Public Administration
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-[50ch]">
              Inspect the live 3-column orchestrator, review closure criteria, and test dynamic replanning.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all duration-150 active:scale-[0.98] shadow-card self-start md:self-auto shrink-0"
          >
            <span>Launch ResolveGraph Console</span>
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="w-full border-t border-zinc-800/80 py-6 px-6 text-xs text-zinc-500">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-semibold text-zinc-300">ResolveGraph</span>
            <span>•</span>
            <span>Deterministic Civic Resolution Engine</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            v1.2 • FastAPI Backend • React Flow DAG • 100% Deterministic E2E Suite
          </div>
        </div>
      </footer>
    </div>
  );
}
