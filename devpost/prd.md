---
doc: prd
status: approved
---

# ExamPilot — Product Requirements

An adaptive, stress-reducing exam preparation planner that transforms student cramming panic into a realistic, prioritized study schedule with dynamic recovery and honest feasibility feedback.
Source: `scope.md > The Unique Kernel` and `scope.md > The Core Loop`.

## The Core Journey
1. **Arrival & Orientation:** The student opens ExamPilot and sees an encouraging, calm header with branding and an empty state guiding them to either configure an exam or load a sample scenario.
2. **Setup or Quick-Load:** The student enters exam details (subject name, exam date, daily available study hours) and 3–6 topics with confidence (1–5), importance (High/Medium/Low), and estimated study hours—or clicks **"Load Sample Exam"** (prepopulating CS 201: Data Structures in 4 days).
3. **Plan Generation & Feasibility Check:** Clicking "Generate Plan" runs the scheduling heuristic. If hours are sufficient, a clean day-by-day plan renders. If total estimated hours exceed available study hours, a prominent yet calm **"Time Deficit / Triage Mode"** banner displays the exact deficit, scales allocations without exceeding daily capacity, and tags clipped topics as "At Risk".
4. **Daily Execution & Progress:** The student works through their plan, checking off individual daily study session blocks (e.g. "Day 1: Trees - 2 hrs"). Overall topic progress indicators increment accordingly. An optional "Mark Topic Mastered" button allows early completion, immediately zeroing out that topic's remaining required effort and preserving completed blocks.
5. **Adaptive Recovery ("I Fell Behind"):** If a student misses study time, they click "I Fell Behind / Missed Hours", input the lost hours for today, and click "Recalculate Plan". That day's remaining capacity is decremented by the lost hours. ExamPilot rebalances remaining incomplete work strictly into genuinely available future days (preserving daily hour limits), leaving past and completed blocks intact. A dynamic before-and-after explanation banner highlights exactly what was shifted, deferred, or reallocated based on the schedule diff.
6. **State Persistence & Reset:** The entire plan, topic states, and block completions persist in browser `localStorage`. A clear "Reset Plan" option allows clearing state or reloading the sample exam at any time.

## Screens and Layout
A unified, single-screen responsive dashboard designed for desktop and mobile viewports:
- **Header:** ExamPilot logo/wordmark, exam title, days-until-exam countdown badge, and high-level progress bar (% of allocated hours completed).
- **Exam Configuration Panel (Left on Desktop / Top on Mobile):**
  - Exam details input: Subject, Exam Date, Daily Study Hours.
  - Topic List editor: Topic name, confidence selector (1 to 5 stars/buttons), importance dropdown (High, Medium, Low), estimated hours needed, and Add/Remove topic controls.
  - Primary CTA: "Generate Study Plan" and secondary CTA: "Load Sample Exam".
- **Feasibility & Recovery Banner Area:**
  - Dynamic alerts for **Triage Mode** (when available time < required time) showing exact deficit hours and prioritized trade-offs.
  - Dynamic **Recovery Summary Banner** appearing after schedule recalculation detailing the exact hours reallocated.
- **Interactive Daily Schedule View (Right on Desktop / Bottom on Mobile):**
  - Day cards (Day 1 through Day N until exam day), each displaying allocated total hours, daily session task items with topic name, allocated hours, priority badge, and completion checkbox.
  - Recovery Action Bar: "I Fell Behind / Missed Time" button with quick hour-loss input and "Recalculate Plan" trigger.
  - Reset / Clear controls in a restrained footer.

## Look and Feel
- **Aesthetic:** Editorial productivity tool (calm, reassuring, clean, high-focus).
- **Color Palette:** Warm neutral off-white background (`#FBFBFB` / `#F8FAFC`), deep slate typography (`#0F172A`), muted indigo accents (`#4F46E5` / `#6366F1`) for primary actions and focus states, subtle amber/rose badges for triage/risk alerts, and soft emerald for completed tasks.
- **Typography:** Clean sans-serif with crisp hierarchy, generous whitespace, legible tabular numbers for time allocations.
- **Restraint:** No gratuitous animations, no heavy dark drop-shadows, no visual clutter.

## Features and Behavior

### 1. Exam Configuration & Sample Preload
- As a student, I want to quickly set up my upcoming exam or load sample data so I can immediately see a personalized study plan.
  - [ ] Clicking "Load Sample Exam" pre-populates: CS 201: Data Structures, 4 study days, 4 hours/day (16 hours available), and 4 realistic topics (Trees: High importance / 1 confidence / 5 hrs; Graphs: High importance / 2 confidence / 5 hrs; Sorting: Med importance / 3 confidence / 3 hrs; Arrays: Med importance / 4 confidence / 2 hrs; Total = 15 hrs). The initial plan fits with a 1h review buffer.
  - [ ] Reproducible recovery: checking Day 1's 2h Trees block and then reporting 2h missed today drops Day 1 to 0h free, moves Graphs' unfinished Day 1 hours to later days, and switches the plan into Triage with a real 1h shortfall (Sorting and Arrays at risk), explained from the actual schedule diff.
  - [ ] The sample is generated by the same validation and scheduling path as user-entered data.
  - [ ] Custom topic additions accept topic name, confidence (1–5), importance (High/Medium/Low), and estimated hours (0.5 to 20 hrs).
  - [ ] Inputs validate that the exam date is in the future (1 to 14 days) and daily available hours are greater than 0.

### 2. Intelligent Prioritized Schedule Generation
- As a student with limited study time, I want my study schedule to prioritize my weakest, highest-stakes topics while still guaranteeing every topic gets attention.
  - [ ] Evaluates total capacity (`days_left × daily_hours`) versus total estimated effort.
  - [ ] Computes priority weights prioritizing low confidence (1) and high importance, while enforcing minimum allocations across all incomplete topics (starvation prevention).
  - [ ] Distributes study sessions across daily cards without exceeding each day's specified capacity.
  - [ ] Front-loads high-priority foundational topics into earlier days, reserving final days for lighter review and remaining topics.

### 3. Honest Feasibility & Triage Feedback
- As a stressed student who doesn't have enough hours, I want the tool to be honest about time constraints instead of silently overbooking me.
  - [ ] When total required hours > total available hours, renders a "Triage Mode Active" alert banner.
  - [ ] Banner clearly displays: Total Needed Hours, Total Available Hours, and Hour Deficit.
  - [ ] Topics that receive reduced or zero hours are visually badged as "At Risk / Clipped" with clear advice on what to prioritize first.
  - [ ] Daily capacity limits are strictly respected—never silently packs more hours into a day than the student specified.

### 4. Progress Tracking (Daily Blocks & Topics)
- As a student studying day-to-day, I want to check off completed study blocks and see my progress update.
  - [ ] Each daily study session card has a checkbox to mark that specific block complete.
  - [ ] Completed session blocks remain permanently completed and are never removed or reallocated during recovery calculations.
  - [ ] Checking a block increments overall progress and marks that portion of the topic effort as completed.
  - [ ] A topic card includes an explicit "Mark Topic Mastered" option that removes its remaining required effort from future scheduling; completed past blocks remain logged.
  - [ ] Marking a session block does not mark the entire topic completed; a topic is done only when its completed hours reach its estimated hours, or it is marked mastered.
  - [ ] Any progress change (checking, unchecking, mastering) recalculates the remaining schedule; a recovery explanation appears only when the remaining schedule actually changed.
  - [ ] Overall progress = completed hours ÷ (completed + remaining hours); mastering a topic removes its remaining hours from both the plan and the progress denominator.

### 5. Adaptive Recovery & Real Schedule Diff Derivation
- As a student who missed study time, I want to report my lost hours and get an updated schedule that explains what changed.
  - [ ] "I Fell Behind" action prompts for missed hours on the current day, immediately reducing that day's remaining capacity by the specified amount. It cannot exceed the hours still free today (daily hours − completed − already missed).
  - [ ] Reallocates incomplete work strictly into genuinely available future days, never violating future daily hour limits.
  - [ ] If remaining work cannot fit within future capacity, surfaces the exact deficit and updates at-risk topic flags.
  - [ ] Generates an explanation derived strictly from the diff between previous allocations and new allocations (e.g., in the sample: *"Graphs: 1h moved from Day 1 to Day 3 … Sorting is now at risk — 0.5h won't fit … Shortfall grew from 0h to 1h"*).

### 6. Persistence & State Management
- As a student returning to the app, I want my plan and progress saved automatically.
  - [ ] Plan data, topics, session statuses, and settings persist in browser `localStorage`.
  - [ ] Refreshing or reopening the page preserves the complete current plan and progress state.
  - [ ] "Reset Plan" button clears `localStorage` and restores the clean initial state.

## States and Boundaries
- **Empty / Initial State:** No plan generated yet. Prompts user with a clean input form and a prominent "Load Sample Exam (CS 201)" quick-start button.
- **Feasible Plan State:** All topic hours fit within available schedule; renders green/calm feasibility badge ("100% Feasible Plan").
- **Triage / Infeasible State:** Required hours exceed available time; renders amber warning banner with exact deficit count and risk badges.
- **Recovered / Recalculated State:** Displays schedule recalculation banner with the specific diff narrative explaining what changed.
- **Completed State:** All remaining work done (every topic's completed hours reach its estimate, or it is mastered); displays reassuring completion congratulations card.
- **Persistence Boundary:** Entire state lives in browser `localStorage`; no server synchronization or account login required.

## Product Decisions
- **Completed blocks immutable during recalculation:** Ensures students never lose credit for work done and prevents retroactive schedule tampering.
- **Mark Topic Mastered frees future capacity:** Empowers student agency when a topic clicks sooner than expected, cleanly redistributing freed hours to remaining topics.
- **Daily capacity strictly honored during recovery:** Ensures the planner never gives unrealistic false hope by creating 8-hour days when a student can only study 3 hours.
- **Deterministic diff-derived explanation:** Avoids generic AI hallucinations; explanation is 100% grounded in actual numerical changes.
- **Editing setup resets the plan (decided in `4-spec`):** Editing an existing exam shows a confirmation that progress will be reset; Cancel keeps the current plan, Confirm creates a fresh plan. No merging of old progress with changed inputs.
- **Sample exam uses 4h/day (decided in `4-spec`):** Required so that completing a 2h block and then missing 2h on Day 1 fits within one day's hours without double-counting. The sample starts feasible and recovery moves it into an honest Triage state.

## What We're Building
A fully functional, single-page web app implementing:
1. Exam & topic input form with validation.
2. One-click "Load Sample Exam" with realistic CS 201 data.
3. Deterministic prioritized scheduling engine with starvation prevention.
4. Feasibility checker with triage banner and risk badging.
5. Interactive daily schedule cards with immutable completed session checkboxes.
6. "I Fell Behind" missed-hours recovery flow with capacity decrement and dynamic diff explanation.
7. LocalStorage persistence and reset functionality.
8. Polished, responsive editorial productivity styling.

## Deferred From the POC
- Multi-exam concurrent tracking (deferred to keep UI and data model simple for the 1-minute demo).
- Google Calendar / iCal export (deferred; calendar integration is secondary to core plan prioritization).
- User accounts / backend cloud sync (deferred; not required for hackathon demonstration).

## Possible Later Enhancements
- Active recall flashcard prompt generation based on topics.
- Pomodoro timer integration for active study blocks.
- Spaced repetition algorithm options (e.g. SM-2) for long-term study schedules.

## Non-Goals
- Real-time calendar syncing or notification alarms.
- Automatic syllabus parsing from PDF/syllabus documents.
- Social study group coordination.

## Open Questions
- None blocking PRD approval. Heuristic weights and data schemas will be defined in `4-spec`.
