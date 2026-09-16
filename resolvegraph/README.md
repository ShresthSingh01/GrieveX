# ResolveGraph

ResolveGraph is an advanced, deterministic grievance orchestration and resolution system. It moves beyond traditional ticketing platforms by leveraging a **hybrid intelligence architecture**. Instead of relying purely on large language models (LLMs) for critical orchestration—which can be unpredictable and prone to failures—ResolveGraph uses LLMs strictly for initial extraction, while all core orchestration, replanning, and closure verification are handled by a robust, SQL-backed deterministic rule engine.

This approach guarantees reliability, dynamic adaptability, and strict adherence to policy in complex, multi-stakeholder scenarios.

---

## 🏛️ System Architecture

ResolveGraph consists of a **FastAPI backend** and a **Next.js frontend**, forming a responsive and highly reliable system. 

### Core Intelligence Engines
1. **Grievance Extractor**: Utilizes LLMs to extract structured information from unstructured grievance text, with a built-in offline fallback mechanism to ensure 100% uptime even during API outages or rate limits.
2. **DAG Builder**: A topological graph planner that translates extracted requirements into a precise Directed Acyclic Graph (DAG) of dependent tasks.
3. **Replanning Engine**: Handles dynamic mutations to the graph. If a real-world scenario changes, the engine invalidates tasks requiring physical execution and intelligently provisions and rewires new tasks into the active graph in real-time.
4. **Risk Engine**: Enforces strict policy rules and evaluates the risk level of cases based on incoming parameters.
5. **Closure Verification Engine**: Prevents premature or unauthorized closure. Closure is treated as a rigorous verification check against five hard policy criteria rather than a simple state change.

### Data Layer
- **SQL-Backed DAG**: The system uses a relational database to store the state of the DAG, managed centrally by the `CaseService`.

---

## ✨ Key Features & Capabilities

- **Dynamic Replanning**: Seamlessly handles evolving situations. When evidence reveals a new obstacle, the `ReplanningEngine` invalidates outdated tasks and dynamically injects new dependencies, immediately triggering the `TaskScheduler` to update graph edges.
- **Evidence-Based Closure**: Cases cannot be simply "marked closed." They must pass 5 absolute gates:
  1. All requisite tasks completed.
  2. No active conflicts.
  3. All required information provided.
  4. Necessary approvals granted.
  5. Citizen proof obtained.
- **Interactive Visual Dashboard**: A 3-column Next.js interface featuring React Flow. It provides real-time visualization of the DAG, interactive audit logs, closure checklists, and replanning triggers.
- **Deterministic Reliability**: By isolating LLM usage to the extraction phase and relying on a deterministic rule engine for orchestration, the system completely avoids hallucination-driven routing errors and API dependency bottlenecks.

---

## 🧪 Demonstration & Validation

ResolveGraph includes a built-in demonstration and benchmark suite designed to showcase its orchestration capabilities.

### The Benchmark Suite (`/api/demo/evaluate`)
The system ships with 7 baseline E2E test cases that validate the entire flow, including dynamic replanning and premature closure prevention. The test suite currently passes with **100% accuracy**.

### Seeded Domain Cases
To demonstrate the system's versatility, 5 complex domain cases are seeded into the demo environment:
1. **Flooding**
2. **Pension Disputes**
3. **Electric Hazard**
4. **Demolition**
5. **Streetlight Outages**

### The 3-Act Demo Flow
1. **Act I: Ingestion & DAG Creation**: A complex grievance is ingested. The Extractor parses the text, and the DAG Builder generates the initial task graph.
2. **Act II: Dynamic Replanning**: During execution, new evidence is submitted (e.g., a contractor reports a physical blockage). The Replanning Engine dynamically rewires the DAG, adding new requisite tasks without losing the existing context.
3. **Act III: Verification & Closure**: The operator attempts closure. The Closure Verification Engine interrogates the state against the 5 policy criteria, ensuring compliance before final resolution.

---

## 🚀 Running the Project Locally

The project is structured as a monorepo.

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start the Backend (FastAPI)
The backend runs on port `8000`.
```bash
cd apps/api
# Ensure your virtual environment is activated and requirements are installed
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the Frontend (Next.js)
The frontend runs on port `3000`.
```bash
cd apps/web
# Ensure dependencies are installed via npm install
npm run dev -- -p 3000
```

### 3. Access the Application
- **Dashboard**: Navigate to `http://localhost:3000` to view the 3-column interactive visualization and control panel.
- **API Docs (Swagger)**: Navigate to `http://localhost:8000/docs` to explore the REST API.

---

*ResolveGraph: Deterministic orchestration for complex, real-world problems.*
