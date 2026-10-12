---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Scaffold dashboard shell and exam setup form**
  Becomes usable: A running React + Vite + Tailwind web app with the full editorial layout shell (Header, ExamSetupForm with topic rows and validation, EmptyState, ScheduleView container, and Footer). The form can be filled out, topics can be added or removed, and input validation runs with clean visual feedback.
  Why now: Bootstraps the project, installs dependencies, configures Tailwind v4 and the Inter font, and establishes the responsive UI layout so every subsequent logic slice immediately renders onto a real surface.
  PRD ref: `prd.md > 1. Exam Configuration & Sample Preload`, `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Stack`, `spec.md > File Structure`, `spec.md > Look and Feel`, `spec.md > Validation (src/lib/validation.js)`, `spec.md > Components > App, Header, ExamSetupForm, EmptyState, Footer`
  Build: Initialize React + Vite project with `@tailwindcss/vite`, `@fontsource-variable/inter`, configure `src/index.css` theme tokens (`paper`, `surface`, `line`, `ink`, `accent`, etc.), create `src/lib/validation.js`, and build `App.jsx`, `Header.jsx`, `ExamSetupForm.jsx`, `EmptyState.jsx`, and `Footer.jsx`.
  Verify (mechanical): Run `npm run build` to confirm zero bundle errors; run `npm run dev` and verify HTTP 200 on local port; execute a verification script testing that `validateSetup()` correctly validates subject, dates, daily hours, and topic counts.
  Learner check: Start `npm run dev`, open the browser at `http://localhost:5173`, and confirm the warm off-white layout, responsive typography, and topic add/remove buttons work smoothly.
  Commit: `Scaffold dashboard shell and exam setup form`

- [x] **2. Implement deterministic scheduler and schedule display**
  Becomes usable: Clicking "Generate Study Plan" or "Load Sample Exam" runs the pure scheduling heuristic and renders interactive DayCards with StudyBlock items, priority badges, topic progress bars, and the Feasibility/Triage banner.
  Why now: The scheduling engine is the core calculation engine of ExamPilot. It must produce verifiable, capacity-constrained daily allocations before recovery or state mutation can be built.
  PRD ref: `prd.md > 1. Exam Configuration & Sample Preload`, `prd.md > 2. Intelligent Prioritized Schedule Generation`, `prd.md > 3. Honest Feasibility & Triage Feedback`
  Spec ref: `spec.md > Scheduling Algorithm (src/lib/scheduler.js)`, `spec.md > Data Model`, `spec.md > Sample Exam (src/lib/sampleExam.js)`, `spec.md > Components > DayCard, StudyBlock, TopicProgressList, FeasibilityBanner`
  Build: Implement pure `src/lib/units.js`, `src/lib/dates.js`, `src/lib/scheduler.js` (priority, rankTopics, computeBudgets with soft starvation floor, placeBudgets with 2h daily caps and review buffer, derive), `src/lib/sampleExam.js`, and `src/state/planReducer.js` with `GENERATE` action; wire into `DayCard.jsx`, `StudyBlock.jsx`, `TopicProgressList.jsx`, and `FeasibilityBanner.jsx`.
  Verify (mechanical): Run a Node script importing `scheduler.js` against the Golden Scenario (15h across 4 days @ 4h/day); verify exact day-by-day allocations, 1h review buffer on Day 4, and 0 deficit; verify an overloaded scenario triggers Triage mode.
  Learner check: In the running app, click "Load Sample Exam", click "Generate Study Plan", and inspect the 4 day cards to verify the allocations (Day 1: Trees 2h, Graphs 2h; Day 4: Sorting 1h, Arrays 2h, Review buffer 1h).
  Commit: `Implement deterministic scheduler and schedule display`

- [x] **3. Implement adaptive recovery and schedule diff engine**
  Becomes usable: The "I fell behind" recovery action allows reporting missed study hours, reducing today's free capacity, recalculating the remaining schedule strictly within future availability, and rendering the dynamic RecoveryBanner with actual schedule-diff sentences.
  Why now: This is the Unique Kernel of ExamPilot. Building it right after the core schedule display proves the primary differentiator of the application.
  PRD ref: `prd.md > 5. Adaptive Recovery & Real Schedule Diff Derivation`
  Spec ref: `spec.md > Recovery Behavior`, `spec.md > Diff Engine (src/lib/diffEngine.js)`, `spec.md > Components > RecoveryBanner, MissedTimeDialog`
  Build: Implement `src/lib/diffEngine.js` (extracting structured `changes` for moves, cuts, gains, buffer shifts, and deficit changes, then rendering human-readable explanation lines), implement `MissedTimeDialog.jsx` and `RecoveryBanner.jsx`, and handle `REPORT_MISSED` and `DISMISS_CHANGE` in `planReducer.js`.
  Verify (mechanical): Execute a test script simulating Step B of the Golden Scenario (checking 2h Trees on Day 1, reporting 2h missed); verify that Day 1 capacity drops to 0, remaining need is 13h vs 12h available, deficit becomes 1h, and the diff engine outputs the targeted changes (Graphs moved to Day 3 & 4, Sorting/Arrays clipped, buffer drops to 0).
  Learner check: Click "I fell behind" on Day 1, enter 2 hours, confirm, and verify that Day 1 shows 0h free and the RecoveryBanner details what shifted into Days 2–4.
  Commit: `Implement adaptive recovery and schedule diff engine`

- [x] **4. Add progress tracking, mastery, persistence, and reset**
  Becomes usable: Students can check off session blocks, mark topics mastered (reallocating freed hours), edit setup with reset confirmation, view completion cards, and have their entire state safely auto-saved in `localStorage` with malformed data recovery.
  Why now: Completes the full student workflow, edge case resilience, and persistence across browser reloads.
  PRD ref: `prd.md > 4. Progress Tracking (Daily Blocks & Topics)`, `prd.md > 6. Persistence & State Management`, `prd.md > Product Decisions`
  Spec ref: `spec.md > Persistence (src/lib/storage.js)`, `spec.md > Recovery Behavior`, `spec.md > Components > ExamSummary, ConfirmDialog, CompletionCard`
  Build: Implement `src/lib/storage.js` (`save`, `load`, `clear`, `isValidPlanState`), add `TOGGLE_BLOCK`, `MARK_MASTERED`, `UNMASTER`, `RESET`, and `HYDRATE` to `planReducer.js`, build `ExamSummary.jsx`, `ConfirmDialog.jsx`, and `CompletionCard.jsx`, and attach `localStorage` syncing to `App.jsx`.
  Verify (mechanical): Run automated storage test verifying round-trip JSON serialization, malformed JSON recovery to backup key, capacity guard preventing overbooking on block toggle, and mastery capacity reallocation.
  Learner check: Check a study block, reload the page to verify it persists, test "Mark Mastered" on Arrays to see freed hours reallocated, and test the "Reset Plan" confirmation dialog.
  Commit: `Add progress tracking, mastery, persistence, and reset`

- [x] **5. Add automated invariant and golden demo integration tests**
  Becomes usable: A comprehensive automated Vitest test suite and React Testing Library integration test suite running in CI or local terminal (`npm test`) that verifies invariants 1–10 and all PRD acceptance criteria.
  Why now: Verifies the entire system against the formal technical specification, preventing regressions and providing verifiable evidence of correctness.
  PRD ref: `prd.md > Acceptance criteria across all sections`
  Spec ref: `spec.md > Testing Plan`, `spec.md > Public functions and Invariants`
  Build: Create `tests/helpers.js` (`assertInvariants`, `blocksTable`), create unit tests `tests/units.test.js`, `tests/scheduler.test.js`, `tests/diffEngine.test.js`, `tests/validation.test.js`, `tests/storage.test.js`, `tests/planReducer.test.js`, and create `tests/app.flow.test.jsx`.
  Verify (mechanical): Run `npm test` and verify that all test suites pass with 0 failures and 0 warnings.
  Learner check: Run `npm test` in the terminal and review the full suite of unit and UI tests passing.
  Commit: `Add automated invariant and golden demo integration tests`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Slice 2 (Sample exam plan generation and initial schedule display)
- [x] Final kick-the-tires exploration and feedback completed — Slice 4/5 (Full interactive recovery, progress tracking, persistence, and demo flow)

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Verified complete test suite (29 tests across 6 files), production bundle (dist built cleanly in 859ms), and interactive dev server. Generated self-contained interactive devpost/app-map.html documenting the 5 core subsystems, Golden Demo state machine, and Invariants 1-10 audit table.
Route and stops:
1. `src/lib/scheduler.js`: Pure integer half-hour units and deterministic priority ranking `importanceWeight * (6 - confidence)`.
2. `src/lib/diffEngine.js`: Pairwise schedule comparison calculating honest net deltas, buffer shrinkage, and triage deficits.
3. `src/lib/storage.js`: Robust LocalStorage persistence (`exampilot:v1`) with corrupt schema quarantine (`exampilot:v1:corrupt`).
4. `src/components/MissedTimeDialog.jsx` & `RecoveryBanner.jsx`: Transparent user-facing recovery with immutable completed blocks.
5. `src/App.jsx`: State hub coordinating reactive scheduling, real-time validations, and reset/edit confirmations.
Edit outcome: Zero architectural divergence from approved spec.md; all 10 invariants validated through automated tests.
Reflection:
1. **Plan-First Development:** Investing heavily in scope.md, prd.md, and spec.md before writing code prevented scope creep, clarified boundary cases (such as immutable completed blocks and non-negotiable capacity limits), and eliminated downstream rework.
2. **Deterministic Scheduling over AI Black-Boxes:** Students cannot trust exam planners that silently hallucinate schedules or fluctuate between page refreshes. Implementing a pure deterministic integer-unit engine guarantees explainability, mathematical honesty, and 100% reproducible schedule diffs.
3. **AI-Assisted Implementation:** Leveraging AI for rapid scaffolding and test authoring is most effective when guided by strict mathematical invariants and domain models, preventing AI from proposing "convenient shortcuts" like floating-point hours or fuzzy recovery heuristics.
4. **Testing Real Invariants over Trusting Generated Code:** Comprehensive invariant tests (invariants 1–10) and end-to-end user scenario testing caught DOM timing bugs, edge-case capacities, and UI state synchronization issues that static inspection could not.
Activity mode: Comprehensive learning reflection and architecture mapping.

## Revisions
