# Adaptive Learning Path Builder

A full-stack web application that allows administrators and curriculum designers to visually build adaptive learning paths, connect modular units and assessments, define conditional progression logic, and evaluate learner trajectories using a **LangGraph-powered AI agent** and **Groq LLM audit engine**.

---

## 🤖 AI Features & LangGraph Architecture

### 1. AI Whole-Workflow Review & Health Audit (`POST /api/learning-paths/{id}/ai-review`)
- **Holistic Graph Validation**: Analyzes the entire curriculum graph from `START` to `END`:
  - **Structural Reachability**: Verifies that learners starting at `START` can reach `END` across all conditional branches.
  - **Orphan & Dead-End Detection**: Identifies disconnected nodes or non-terminal nodes with no outgoing routes.
  - **Workload & Pacing Metrics**: Aggregates total estimated duration (min), total questions load, and module distributions (Assessments vs. Units vs. Adaptive Groups).
- **LLM Curriculum Review**: Integrates with Groq (`openai/gpt-oss-120b`) to evaluate:
  - Pacing, diagnostic rigor, and adaptive differentiation between struggling and advanced learners.
  - Generates an **Overall Readiness Score** (0–100), readiness status badge, and **3–4 concrete, actionable pedagogical recommendations**.
- **Deterministic Reliability Fallback**: The structural auditor runs deterministically so diagnostics and health checks work instantaneously even if external LLM APIs experience latency.

### 2. LangGraph Adaptive Progression Agent (`POST /api/learning-paths/{id}/evaluate`)
- **StateGraph Workflow Pipeline**:
  - `find_outgoing`: Collects candidate transitions originating from the learner's current node and sorts by priority.
  - `evaluate_rules`: Evaluates Table 7 criteria against active learner context (`score`, `passed`, `completion`, `time_spent_minutes`, `percentage_completion`).
  - `llm_reasoning`: Employs an LLM reasoning node to generate clear pedagogical explanations for why the learner was routed to a given branch.
  - Seamless fallback to deterministic explanations when offline.

---

## 🏗️ Architecture

- **Frontend (`/frontend`)**:
  - **Framework**: React 18 + TypeScript + Vite
  - **Styling**: Tailwind CSS with custom specificity overrides
  - **Graph Canvas**: `@xyflow/react` (React Flow v12) with custom nodes (`StartNode`, `AssessmentNode`, `UnitNode`, `EndNode`) and `ConditionalEdge` with rule badges
  - **State Management**: Zustand with history snapshot stacks (Undo/Redo up to 30 states)
  - **Adaptive Learner Simulator**: Interactive simulator testing progression node-by-node or running whole-workflow reviews
  - **Custom Modal Dialogs**: Backdrop-blur confirmation modals replacing browser-native alerts

- **Backend (`/backend`)**:
  - **Framework**: FastAPI
  - **Database**: SQLite (`learning_path.db`) via SQLAlchemy ORM with Pydantic v2 validation
  - **Agent Workflow**: **LangGraph** `StateGraph` pipeline + **Groq** LLM integration (`.env` configured)
  - **Testing**: Pytest test suite with 9 passing integration tests

---

## 📋 API Contract Adherence

Implemented in accordance with `available-content.schema.json` and `learning-path.schema.json`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/components` | Returns all draggable content library items matching `available-content.schema.json` |
| `POST` | `/api/learning-paths` | Saves a learning path with all nodes, edges, positions, and conditions matching `learning-path.schema.json` |
| `GET` | `/api/learning-paths` | Returns list of all learning paths for the dashboard |
| `GET` | `/api/learning-paths/{id}` | Restores a saved learning path matching `learning-path.schema.json` |
| `DELETE` | `/api/learning-paths/{id}` | Deletes a learning path (204 No Content) |
| `POST` | `/api/learning-paths/{id}/evaluate` | **LangGraph Agent Workflow**: Evaluates learner context and determines the next node |
| `POST` | `/api/learning-paths/{id}/ai-review` | **AI Workflow Review**: Structural integrity check + Groq LLM curriculum audit |
| `POST` | `/api/learning-paths/draft/ai-review` | In-memory draft AI review without requiring pre-saving |

---

## 📐 Table 7: Conditional Rule Model Implementation

The engine and condition builder strictly implement Table 7 based on the edge's source node type:

| Source Type | Allowed Metrics | Operators | Example Specification |
|---|---|---|---|
| **Assessment** | `completion`, `passed`, `score`, `score_range` | `eq`, `gte`, `lte`, `gt`, `lt`, `between` | `score between 0 and 49` routes learner to Easy module; `passed == true` routes forward |
| **Unit** | `completion`, `time_spent_minutes`, `percentage_completion` | `eq`, `gte`, `lte`, `gt`, `lt` | `percentage_completion >= 80` routes learner forward; `time_spent_minutes >= 30` |

Schema validation (`RuleSchema`) automatically rejects any mismatched metrics (e.g., assigning exam scores to learning units), ensuring 100% data contract integrity.

---

## ✨ Recent Feature Updates & Enhancements

1. **AI Whole-Workflow Review Dashboard**:
   - Single-click audit in the Simulator evaluating overall score, connectivity, time budget, question count, and AI pedagogical critique.
2. **Simulator Tailored START / END Controls**:
   - **START Node**: All 5 test parameter sliders are completely hidden; displays an onboarding card with a *"Begin Assessment Flow"* button.
   - **END Node**: All sliders are hidden; displays a *"Learning Path Complete"* card and disables further evaluation steps with a *"Restart Simulator"* option.
   - **Type-Specific Inputs**: Assessment nodes only display test score, passing, and completion; Unit nodes only display time spent, completion, and percentage completion.
3. **Topological Order in Simulator Dropdown**:
   - Nodes in the "Jump to Node" dropdown are sequenced in exact chronological flow order (`1. START` $\rightarrow$ modules $\rightarrow$ `N. END`) via BFS traversal.
   - Strict terminal deduplication prevents duplicate `START` or `END` entries.
4. **Clean Common Components Palette**:
   - Replaced SAT-specific mock items with 5 generic, universally reusable building blocks: **Assessment Section**, **Adaptive Group**, **Learning Unit**, **START**, and **END**.
5. **Flexible Grouping Operations**:
   - Convert Section to Group / Convert Group back to regular Section.
   - Add Section directly into an Adaptive Group with automatic child edge creation.
   - Interactive Parent Group `<select>` dropdown in section properties.
6. **Unit Module Configuration**:
   - In the Right Properties Panel, Unit modules only ask for `Duration (min)`; the `Questions` input is completely hidden.
7. **Custom Confirmation Modal (No Browser Alerts)**:
   - Replaced browser `window.confirm()` and `alert()` with a modern Tailwind backdrop-blurred confirmation modal with loading spinners and inline error banners.
8. **Builder State Persistence & View Memory**:
   - `questionsCount`, `difficulty`, `isGroup`, and `parentGroupId` stored and persisted in SQLite.
   - Browser refresh preserves your active editing path and view (`active_app_view` and `canvas_zoom` in `localStorage`).

---

## 💡 Assumptions & Engineering Tradeoffs

This section outlines key technical and architectural decisions made during development to balance visual fidelity, data contract integrity, and modern AI agent integration:

### 1. Backend Stack: Python (FastAPI + LangGraph) vs. Java (Spring Boot)
* **Decision**: Adopted Python, FastAPI, and LangGraph with SQLite rather than Java / Spring Boot.
* **Benefit**: Python offers native first-class support for **LangGraph**, **Pydantic v2**, and modern LLM toolkits (Groq / OpenAI SDKs). This enabled rapid, reliable modeling of multi-node agent state graphs (`find_outgoing` → `evaluate_rules` → `llm_reasoning`) with minimal boilerplate.
* **Tradeoff Mitigation**: To match the architectural rigor expected of Java enterprise systems, strict Pydantic v2 schemas were implemented for all request and response bodies, validating Table 7 type constraints alongside 9 automated integration tests (`pytest`).

### 2. Component Palette: Generic Curriculum Blocks vs. Static SAT Library
* **Decision**: Replaced the domain-specific SAT mock library (`Math Module 1`, `Reading Module 2`, etc.) in the left panel with 5 clean, abstract building blocks: **Assessment Section**, **Adaptive Group**, **Learning Unit**, **START**, and **END**.
* **Benefit**: The application acts as a universally applicable curriculum builder capable of modeling any educational subject, corporate onboarding, or diagnostic test rather than being locked to a single exam format.
* **Tradeoff Mitigation**: The `/api/components` API endpoint was retained for contract compliance with `available-content.schema.json`, while giving designers full authoring freedom on the canvas.

### 3. Simulation Architecture: Hybrid Engine (Deterministic Validation + LLM Agent)
* **Decision**: Designed a dual-mode simulator:
  1. *Targeted Step Simulation*: Allows step-by-step debugging of transitions, streamlined so START/END have zero redundant input sliders, Units only show duration/progress, and Assessments only show test scores.
  2. *AI Whole-Workflow Review*: Audits the complete graph from START to END in one shot.
* **Benefit**: External LLM APIs can encounter rate limits or latency. The graph auditor was designed as a **hybrid engine**: structural reachability (validating that START reaches END across all branches, detecting orphan nodes, and flagging dead ends) runs **deterministically with 0ms latency**, while Groq LLM enriches it with pedagogical critique and recommendations. If external APIs are unavailable, diagnostics still function seamlessly.

### 4. Grouping Model: Graph Relationships & Popovers vs. Deeply Nested Sub-Flows
* **Decision**: Utilized a directed relationship model (`isGroup: true`, `parentGroupId`, and directed edges) with a non-destructive temporary click popover instead of complex React Flow nested sub-canvases.
* **Benefit**: Deeply nested sub-flows in canvas libraries often introduce coordinate calculation bugs, rigid bounding boxes, and drag collision issues. The relationship model achieves 100% visual fidelity to `AdaptiveLearningPathBuilder.png`, enables one-click conversions ("Convert Section to Group", "Add Section to Group"), and allows effortless regrouping via dropdown without breaking edge configurations.

### 5. Strict Table 7 Metric Separation: Units vs. Assessments
* **Decision**: Strictly bifurcated node configurations and properties panel fields based on pedagogical role:
  * *Assessment Section*: Questions count, duration, max score, passing score criteria.
  * *Learning Unit*: Duration alone; question count input is completely hidden.
  * *Connection Rules*: Assessment edges only allow `score`, `score_range`, `passed`, and `completion`. Unit edges only allow `time_spent_minutes`, `percentage_completion`, and `completion`.
* **Benefit**: Prevents curriculum designers from creating logically invalid conditions (e.g. attempting to score an instructional reading module), ensuring 100% compliance with Table 7.

### 6. UX Polish: Custom React Modals vs. Browser-Native Alerts
* **Decision**: Completely removed native `window.confirm()` and `alert()` calls in favor of an accessible, Tailwind-styled confirmation modal with backdrop blur (`backdrop-blur-xs`), path name confirmation, action buttons with loading spinners, and inline error banners.
* **Benefit**: Delivers a polished, professional enterprise feel that matches the dark/light design system.

### 7. State Persistence: Zustand + LocalStorage vs. Heavy Client Router
* **Decision**: Persisted active path ID, view state (`dashboard` vs `builder`), and canvas zoom in `localStorage` managed via Zustand.
* **Benefit**: Avoided the routing overhead and server-side fallback complexities of a full client router (like `react-router-dom`) while ensuring an uninterrupted editing experience across browser refreshes.

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
# (Optional) create and activate a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server from root
python -m uvicorn backend.app.main:app --reload --port 8000
```
- Interactive Swagger docs: `http://localhost:8000/docs`
- Database tables and initial seed data (`lp-sat-adaptive-001`) are populated automatically on startup.
- LLM API configuration is read from `backend/.env` (Groq / OpenAI-compatible).

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

### Backend Automated Tests

Run pytest across all API endpoints, schema validators, LangGraph routing, and the AI review pipeline:

```bash
pytest backend/tests/ -v
```

All 9 test cases pass:
1. `test_health`: API health check
2. `test_get_components`: Verifies schema shape and component items matching contract
3. `test_save_and_get_learning_path`: Verifies saving and round-trip retrieval of graph JSON
4. `test_evaluate_endpoint_low_score`: Verifies LangGraph routing to easy module for low score
5. `test_evaluate_endpoint_no_match`: Verifies LangGraph behavior when no rules match
6. `test_delete_learning_path`: Verifies 204 DELETE and 404 subsequent lookup
7. `test_evaluate_unit_percentage_completion`: Verifies Table 7 Unit progression rule (`percentage_completion >= 80%`)
8. `test_table7_schema_metric_validation`: Verifies Pydantic schema rejects invalid metrics for source type (422)
9. `test_ai_review_endpoint`: Verifies AI whole-workflow structural validation and review generation

### Frontend Build Verification

```bash
cd frontend
npm run build
```
Compiled with zero TypeScript or Vite errors.

---

## 🎮 How to Use the Builder

1. **Add Components**:
   - Drag sections, units, groups, or terminals from the left panel onto the canvas.
   - Or click them to add at default canvas positions.
2. **Connect Nodes**:
   - Click and drag from any node's connector handle to another node.
3. **Configure Rules**:
   - Click on any connection line to open the **Connection Properties** on the right panel.
   - Choose metric (`score`, `score_range`, `completion`, etc.), operator (`≥`, `<`, `between`), and thresholds.
4. **Convert & Group**:
   - Turn any section into an adaptive group or assign sections to groups using the Parent Group dropdown.
5. **Save Draft / Publish**:
   - Click **Save Draft** or **Publish** in the top header.
6. **AI Review & Simulate Learner Trajectory**:
   - Switch to the **Preview** tab in the top header.
   - Click **"Whole Workflow Review"** for an instant AI audit of structural health and pedagogical balance.
   - Or test progression step-by-step to watch the LangGraph agent evaluate conditional routing in real time!
