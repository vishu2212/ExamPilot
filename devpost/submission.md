# Devpost Project Submission — ExamPilot

## Project Title
**ExamPilot — Adaptive, Deterministic Exam Prep Planner for University Students**

## Tagline / Elevator Pitch
A zero-backend study planner that handles falling behind with honest triage, transparent schedule diffs, and mathematically strict capacity limits instead of impossible 14-hour days or hallucinated AI calendars.

---

## Inspiration

Every college student knows the gut-wrenching feeling of falling behind on a study schedule. You plan 4 hours of revision, unexpected assignments hit, you lose 2 hours, and traditional study apps fail in one of two predictable ways:
1. **The Avalanche**: The app piles missed hours directly onto tomorrow, snowballing into impossible 12-to-14 hour study days.
2. **The LLM Hallucination**: Generative AI tools invent arbitrary schedules that fluctuate on every prompt, round off hours inconsistently, and violate hard physical constraints.

Students don't need false optimism; they need **clarity, control, and mathematical honesty**. When time runs out, a student must know: *Which high-yield topics are protected? Which review buffers absorbed the hit? Which low-yield topics are now at risk?*

We built **ExamPilot** to bring deterministic, reproducible planning and adaptive recovery to high-stakes exam prep.

---

## What It Does

ExamPilot turns tight exam deadlines into realistic, day-by-day study blocks with an uncompromising focus on human constraints:

1. **Deterministic Scheduling Core**: Schedules study blocks in discrete 30-minute integer units based on an explicit priority formula: `importanceWeight × (6 - confidence)`.
2. **Strict Daily Capacity Protection**: Hard daily limits. The planner never schedules more hours than a student has available, preventing burnout.
3. **Adaptive "I Fell Behind" Recovery**: When students report missed hours, ExamPilot absorbs what it can using available review buffers. If capacity is exhausted, it performs **honest triage**—trimming lowest-priority topics and explicitly displaying an at-risk deficit warning.
4. **Schedule Diff Engine**: Instead of silently reshuffling study blocks, ExamPilot generates a human-readable before-and-after breakdown showing the exact net changes (+1.5h, -1.0h) and explaining why topics were deferred or buffers shrunk.
5. **Immutable Completed Work**: Completed blocks are permanently locked in history and never rescheduled or double-counted.
6. **Dynamic Topic Mastery**: Marking a topic as mastered instantly recalculates remaining work and recovers deficit hours for struggling topics.
7. **Defensive Local Persistence**: Automatically saves state to `localStorage` under `exampilot:v1` with schema verification and an automatic quarantine mechanism (`exampilot:v1:corrupt`) for malformed data.
8. **Built-in Sample Exam**: Includes a realistic 4-day Computer Science (CS 201) midterm preset to experience the complete Golden Demo scenario in under two minutes.

---

## How We Built It

ExamPilot was built using a strict **plan-first, test-driven approach** with zero external paid APIs:

- **Frontend & UI**: React 19, Vite 6, and Tailwind CSS v4, crafted with an editorial, distraction-free design language.
- **Pure Functional Kernels**:
  - `src/lib/scheduler.js`: Completely decoupled from the UI. Operates solely on integer half-hour units ($1\text{ unit} = 0.5\text{h}$) to eliminate floating-point rounding errors.
  - `src/lib/diffEngine.js`: Pairwise comparison engine that extracts exact topic shifts, buffer delta, and deficit status between consecutive plans.
  - `src/lib/storage.js`: Defensive browser storage wrapper with version tagging and automatic backup quarantine.
- **Testing & Verification**: Vitest and React Testing Library verifying 10 rigorous mathematical invariants across 29 automated tests.

---

## Challenges We Overcame

1. **Eliminating Floating-Point Drift**: Study allocations frequently suffer rounding bugs (e.g., $1.333\text{h}$ or $2.9999\text{h}$). We solved this by defining all internal calculations as integer units of 30 minutes ($0.5\text{h} = 1\text{ unit}$, $4\text{h} = 8\text{ units}$). All public interfaces convert cleanly to and from decimal hours.
2. **Preventing Schedule Hallucinations**: Many AI-based planners reshuffle an entire timetable whenever a user marks a task complete. We implemented strict completed-block immutability: past and completed blocks are frozen, ensuring the scheduler only redistributes remaining work across genuinely available future hours.
3. **Explaining Schedule Diffs Transparently**: Showing users a reshuffled calendar without explanation causes cognitive fatigue. We built a dedicated pairwise diff engine that compares the previous plan with the new plan and outputs natural language rationales (e.g., *"1.0h buffer removed; Arrays & Strings deferred by 1.0h"*).

---

## Accomplishments We're Proud Of

- **10 Mathematical Invariants Enforced**: Proved across 29 automated unit and integration tests, guaranteeing that daily capacities, total capacities, and completed-block states are never violated.
- **Zero Backend Required**: Runs 100% in the user's browser, ensuring immediate responsiveness, offline capability, and complete privacy for academic data.
- **Sub-Second Build & Test Cycle**: 29 automated tests execute in under 3 seconds, and the production Vite bundle compiles in under 900ms.

---

## What We Learned

- **Plan-First Development Prevents Rework**: Thoroughly defining `scope.md`, `prd.md`, and `spec.md` with explicit mathematical formulas and edge cases prevented scope creep and eliminated refactoring during the build.
- **Deterministic Engines Outperform Generative Black-Boxes for Planning**: For personal planning, users crave determinism and reproducibility. If input parameters don't change, the schedule should never unexpectedly shift.
- **Invariants Are the Best Test Bed**: Writing tests around domain invariants (e.g., "completed blocks are immutable" and "daily capacity is never exceeded") rather than superficial UI styling produced a resilient codebase.

---

## What's Next for ExamPilot

- Multi-exam concurrent scheduling for balancing finals week across multiple classes.
- Calendar export (.ics) for integration with Google Calendar and Apple Calendar.
- Pomodoro timer integration directly within active study blocks.
- Spaced repetition intervals for recurring topic reinforcement.

---

## Built With

- `react`
- `vite`
- `tailwindcss`
- `vitest`
- `testing-library`
- `lucide-react`
- `javascript`
