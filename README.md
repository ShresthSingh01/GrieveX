# 🌐 ResolveGraph

> **Deterministic AI Orchestrator & Resolution Graph Engine for Complex Public Grievances**
> 
> *Bridging AI Extraction with Guaranteed Policy Adherence, Dynamic Replanning, and Proof-Based Closure.*

---

## 📌 Executive Summary

**ResolveGraph** is an intelligent, policy-governed resolution platform built to solve complex, multi-stakeholder public grievances. 

Unlike traditional ticketing systems that rely on static linear pipelines or pure LLM agents that suffer from hallucinations and unreliability, ResolveGraph uses a **Hybrid Intelligence Architecture**:
- **Generative AI** is used exclusively where it excels: extracting structured facts, claims, and conflicts from raw citizen narratives.
- **Deterministic Rule Engines & Directed Acyclic Graphs (DAGs)** handle all orchestration, task scheduling, policy risk enforcement, replanning, and closure verification.

This guarantees **100% deterministic reliability**, **zero hallucinated routings**, and **hard evidence-based closure gates**.

---

## 🚨 The Problem: Why Current Grievance Systems Fail

Public administration offices and large enterprise service desks receive thousands of complex complaints daily (e.g., *"Our neighborhood is flooded because the drain is blocked, but the Municipality says the drain belongs to PWD, and PWD says it's Municipality's job!"*). 

Existing solutions fail due to 4 systemic bottlenecks:

| Failure Point | Traditional Systems | Pure LLM Agents | ResolveGraph Solution |
| :--- | :--- | :--- | :--- |
| **Workflow Model** | **Linear Single-Ticket**: Assigned to one department; gets passed back and forth endlessly. | **Unpredictable Routing**: AI invents routes or skips critical administrative approvals. | **Multi-Branch DAG**: Tasks executed topologically across multiple departments concurrently. |
| **Jurisdictional Disputes** | **Passing the Buck**: Departments reject accountability, resulting in deadlocks. | **Hallucinated Ownership**: AI guesses jurisdiction without legal basis. | **Joint Jurisdiction Tasks**: Formally schedules binding joint inspections and magistrate orders. |
| **Adaptability** | **Rigid Workflows**: If unexpected blockages arise, the ticket must be cancelled & recreated. | **Loss of State**: LLM loses track of completed steps during long multi-step cases. | **Dynamic Replanning**: Automatically rewires active DAG branches while preserving completed history. |
| **Ticket Closure** | **Fake Closures**: Officers click "Closed" without field proof or citizen verification. | **Auto-Approve Risk**: AI auto-closes tickets without verifying compliance. | **5-Gate Proof Verification**: Hard policy engine blocks closure until 5 evidence gates pass. |

---

## ⚡ How ResolveGraph Works (The 5-Step Pipeline)

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 1. Narrative    │ ───► │ 2. Structured   │ ───► │ 3. Topological  │
│    Ingestion    │      │    Extraction   │      │    DAG Builder  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
┌─────────────────┐      ┌─────────────────┐               ▼
│ 5. 5-Gate Proof │ ◄─── │ 4. Dynamic      │ ◄─── ┌─────────────────┐
│    Verification │      │    Replanning   │      │ Risk Engine &   │
└─────────────────┘      └─────────────────┘      │ Human Approval  │
                                                  └─────────────────┘
```

### 1. Natural Language Grievance Ingestion
Citizens express their grievances in plain, unstructured narrative text. ResolveGraph ingests complaints containing overlapping claims, multi-department disputes, and missing information.

### 2. AI Extraction with Offline Fallback
The system parses the narrative using **Google Gemini LLM** to extract structured JSON containing:
- **Core Claims**: What happened, where, and who is affected.
- **Inter-Departmental Conflicts**: Jurisdictional arguments between authorities.
- **Missing Information**: Critical details required before physical work can begin.
- **Offline Fallback Engine**: If the LLM API is unavailable, a deterministic regex/rule parser automatically takes over to ensure **100% system availability**.

### 3. Topological Resolution Graph Generation (DAG)
The extracted data is compiled into a Directed Acyclic Graph (DAG):
- Tasks are ordered topologically based on explicit prerequisites (e.g., *Site Inspection* $\rightarrow$ *Joint Demarcation Order* $\rightarrow$ *Drain Desilting* $\rightarrow$ *Citizen Satisfaction Audit*).
- Tasks are assigned to specific municipal or state authorities (PWD, Revenue, Electricity Board, Municipality, Police).

### 4. Policy Risk Engine & Human Gating
Every task is categorized by risk level (`LOW`, `MEDIUM`, `HIGH`):
- **Low Risk** (e.g., site inspection): Executes automatically.
- **High Risk** (e.g., fund release, jurisdiction determination, demolition): **Hard-gated by policy**. Requires explicit digital authorization from a designated Human Officer. AI cannot bypass or auto-approve high-risk tasks.

### 5. Dynamic Real-Time Replanning
If real-world conditions change during execution (e.g., field inspectors encounter an illegal boundary wall over the drain), the `ReplanningEngine`:
1. Invalidates downstream tasks requiring physical execution.
2. Dynamically provisions new prerequisite tasks (e.g., *Issue Demolition Notice*).
3. Rewires graph edges in real time without losing prior completed progress.

### 6. 5-Gate Evidence-Based Closure Verification
Cases **cannot** be closed manually or by simple button click. The Closure Engine validates 5 strict policy gates:
1. ✅ **All Tasks Completed**: Every DAG node marked complete.
2. ✅ **Zero Unresolved Conflicts**: All jurisdictional disputes formally resolved.
3. ✅ **Zero Pending Approvals**: All high-risk human approval gates signed off.
4. ✅ **Zero Missing Information**: All required data provided.
5. ✅ **Mandatory Outcome Evidence**: Validated proof attached (photo evidence, core banking UTR receipt, site flow audit, citizen confirmation).

---

## 🏛️ System Architecture

ResolveGraph is architected as a clean monorepo with decoupled services:

```
resolvegraph/
├── apps/
│   ├── api/                 # FastAPI REST Backend
│   │   └── app/
│   │       ├── main.py      # App entrypoint & CORS
│   │       ├── core/        # Database initialization & SQLite/Postgres ORM
│   │       ├── routes/      # Grievances & Demo endpoints
│   │       ├── services/    # CaseService orchestrator
│   │       ├── models/      # SQLAlchemy schema (Cases, Tasks, Audit Logs)
│   │       └── schemas/     # Pydantic request/response validation
│   │
│   └── web/                 # Next.js 14 Web Frontend
│       ├── app/             # App Router (Dashboard & Landing page)
│       ├── components/      # React Flow DAG visualizer, Audit Ledger, Task Panels
│       └── lib/             # API client & helper utilities
│
├── intelligence/            # Core Intelligence Engines
│   ├── extraction/          # LLM Extractor & Rule-based fallback parser
│   ├── planning/            # Topological DAG Builder & Scheduler
│   ├── policy/              # Deterministic Risk Engine & Policy Rules
│   ├── replanning/          # Dynamic Graph Mutation Engine
│   └── verification/        # 5-Gate Closure Verification Engine
│
└── data/                    # Domain data, seed cases, and policy rules
```

---

## ✨ Key Dashboard Features

- 🎨 **React Flow Resolution Graph**: Interactive 2D graph visualizer showing real-time task statuses (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `INVALIDATED`), department badges, and dependency arrows.
- 🛡️ **Human Approval Gate Modals**: Interactive modal dialogs for officers to review evidence and sign off on high-risk tasks.
- 🔄 **Dynamic Replanning Trigger**: Allows operators to simulate real-world field obstacles and observe instantaneous DAG rewiring.
- 📜 **Explainable Audit Ledger**: Step-by-step audit log with "Why" explainability cards explaining every system decision, policy trigger, and state change.
- 📋 **5-Gate Closure Checklist**: Live visual checklist showing real-time compliance status of all 5 closure gates.

---

## 🧪 Benchmark Suite & E2E Validation

ResolveGraph includes a built-in benchmark runner accessible via `/api/demo/evaluate`:

- **100% E2E Pass Rate**: Validates extraction, DAG construction, risk assignment, replanning, and closure gating across all benchmark scenarios.
- **5 Pre-seeded Complex Scenarios**:
  1. 🌊 **Flooding & Inter-Departmental Drain Dispute** (Municipality vs. PWD)
  2. 👵 **Discontinued Senior Citizen Disability Pension** (Social Welfare vs. Bank)
  3. ⚡ **Hazardous HT Electric Cable & Road Height Dispute** (Electricity Board vs. Municipality)
  4. 🏗️ **Illegal Construction & Demolition Order Dispute** (Revenue vs. Urban Planning)
  5. 💡 **Widespread Streetlight Outage & Power Supply Fault** (Municipal Electrical Ward)

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher

---

### Quick Start (One-Command Launcher)

Run both the FastAPI Backend and Next.js Frontend concurrently with a single command:

```bash
# Windows / Linux / macOS
python run.py
```
Or on Windows command prompt:
```cmd
start.bat
```

- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API Docs (Swagger)**: `http://localhost:8000/docs`

---

### Manual Installation & Execution

#### 1. Clone & Configure Environment
```bash
git clone https://github.com/ShresthSingh01/GrieveX.git
cd GrieveX

# Copy environment template
cp .env.example .env
```

#### 2. Backend Setup & Testing
```bash
# Run pytest backend test suite
pytest

# Start FastAPI backend server
python -m uvicorn resolvegraph.apps.api.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Frontend Setup & Build
```bash
cd resolvegraph/apps/web

# Install frontend dependencies
npm install

# Run development server
npm run dev

# Or build production bundle
npm run build
```

---

## 🌐 Deployment Guide

### Deploying Frontend (Vercel)
1. Push your repository to GitHub.
2. Import project in [Vercel](https://vercel.com).
3. Set **Root Directory** to `resolvegraph/apps/web`.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend API (e.g. `https://your-api.render.com/api`).
5. Click **Deploy**.

### Deploying Backend (Render / Railway / Fly.io / Docker)
1. Point your cloud platform to the repository root directory.
2. **Build Command**: `pip install -r requirements.txt` (or Python setup).
3. **Start Command**: `uvicorn resolvegraph.apps.api.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variable (Optional):
   - `GEMINI_API_KEY`: Your Google Gemini API Key.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | `None` | Google Gemini API Key for LLM extraction. (Falls back to rule parser if absent). |
| `DATABASE_URL` | Optional | `sqlite:///./resolvegraph/data/resolvegraph.db` | SQLAlchemy database URL (SQLite, PostgreSQL, etc.). |
| `NEXT_PUBLIC_API_URL` | Required (Web) | `http://localhost:8000/api` | Base URL for FastAPI backend endpoints used by Next.js app. |

---

## 📄 License & Attribution

Developed with ❤️ for deterministic public governance & AI resolution orchestration.
