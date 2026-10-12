# ExamPilot 🎯

> **Adaptive, deterministic exam preparation planner for university students on tight deadlines.**

[![Tests](https://img.shields.io/badge/tests-35%20passed-success)](tests/)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](dist/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/architecture-100%25%20client--side-blue)]()

When college students fall behind, typical study apps panic: they either dump all overdue work onto tomorrow, generate unachievable 14-hour days, or hallucinate arbitrary schedules via non-deterministic LLM calls.

**ExamPilot** solves this with a **pure deterministic scheduling and diff engine**. It respects strict daily study capacity, enforces hard review buffers, keeps completed blocks immutable, and delivers transparent, before-and-after schedule diffs with honest triage when capacity runs out.

---

## ✨ Key Features

- 📐 **Deterministic Scheduling Engine**: Calculates priority using `importanceWeight × (6 - confidence)` with integer half-hour units (0.5h). Absolutely no floating-point rounding drift.
- 🛡️ **Capacity-Strict Allocation**: Hard ceilings on daily hours. ExamPilot will never schedule 10 hours into a 4-hour day.
- 🔄 **Adaptive "I Fell Behind" Recovery**: Missed study time is absorbed first by available buffer hours; if capacity is exhausted, lowest-priority topics are honestly marked at risk with transparent delta explanations.
- 🔒 **Immutable History**: Completed study blocks are locked and never reallocated, double-counted, or rescheduled.
- 📊 **Pairwise Schedule Diff Engine**: Directly compares before-and-after states to show exact hours added, removed, or deferred per topic.
- ⚡ **Dynamic Topic Mastery**: Mark mastered topics anytime to instantly free allocated hours for at-risk subjects.
- 💾 **Defensive Persistence (`exampilot:v1`)**: Automatic `localStorage` saving with schema version validation and corrupted state quarantine (`exampilot:v1:corrupt`).
- 🌐 **100% Client-Side & Private**: Zero cloud dependencies, zero external APIs, zero subscriptions. Your academic study plan stays entirely in your browser.

---

## 🛠️ Tech Stack

- **UI & Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with an editorial, high-contrast, distraction-free aesthetic
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + [jsdom](https://github.com/jsdom/jsdom)
- **Architecture**: Pure functional algorithmic core (`src/lib/`) decoupled from presentation (`src/components/`)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/exampilot.git

# Enter the project directory
cd exampilot

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Running Automated Tests

```bash
# Run unit and integration invariant tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
```

The production assets will be built to the `dist/` directory.

---

## 📋 The Golden Demo Scenario (CS 201 Midterm)

You can explore ExamPilot immediately by clicking **"Load Sample Exam"** in the top bar:

1. **Initial Plan (Feasible)**:
   - Exam Date: 4 days away
   - Daily Capacity: 4.0 hours/day (16.0 hours total capacity)
   - 4 Topics (15.0 hours required work):
     - **Dynamic Programming** (High importance, confidence 2): 6.0h
     - **Graph Algorithms** (High importance, confidence 2): 4.0h
     - **Trees & Traversals** (Medium importance, confidence 3): 3.0h
     - **Array & Strings** (Low importance, confidence 4): 2.0h
   - Result: Feasible schedule with a **1.0 hour review buffer** on Day 4.

2. **Step A — Progress**:
   - Complete the **2.0h Trees & Traversals** block on Day 1.
   - Day 1 progress updates to 50%; completed block is permanently locked.

3. **Step B — Falling Behind (Honest Triage)**:
   - Click **"I Fell Behind"** and report **2.0 missed hours** on Day 1.
   - Remaining work is 13.0 hours against 12.0 hours remaining capacity.
   - The review buffer absorbs the 1st missed hour.
   - The 2nd missed hour forces honest triage: lowest-priority topic **Array & Strings** is reduced from 2.0h to 1.0h (1.0h deficit flagged).
   - Recovery Banner explains: *"Review buffer removed (−1.0h). Arrays & Strings deferred (−1.0h). 1.0h at risk."*

4. **Step C — Triage Resolution via Mastery**:
   - Mark **Array & Strings** as mastered.
   - Needed work drops by 1.0h, eliminating the deficit.
   - Schedule returns to feasible with triage alerts cleared.

---

## 🏗️ Architecture & Code Map

```
exampilot/
├── src/
│   ├── lib/
│   │   ├── scheduler.js       # Pure deterministic scheduler (integer half-hour units)
│   │   ├── diffEngine.js      # Pairwise schedule comparison & human-readable diffs
│   │   ├── storage.js         # Versioned localStorage with quarantine fallback
│   │   ├── sampleExam.js      # CS 201 preset for instant evaluation
│   │   └── validation.js      # Form and recovery input validators
│   ├── components/
│   │   ├── Header.jsx         # App title & quick sample exam loader
│   │   ├── SetupForm.jsx      # Exam metadata and topic parameter inputs
│   │   ├── DayCard.jsx        # Daily schedule card & time block list
│   │   ├── StudyBlock.jsx     # Individual block with interactive completion checkbox
│   │   ├── TopicProgressList.jsx # Topics overview with mastery toggles
│   │   ├── FeasibilityBanner.jsx # Plan feasibility & review buffer callout
│   │   ├── RecoveryBanner.jsx # Diff explanation banner with dismiss control
│   │   ├── MissedTimeDialog.jsx # Modal to log missed study hours
│   │   ├── ConfirmDialog.jsx  # Reset and destructive edit confirmation
│   │   └── CompletionCard.jsx # Celebration card when 100% of study work is done
│   ├── App.jsx                # Reactive root state container
│   └── main.jsx               # App entrypoint
├── tests/
│   ├── helpers.js             # Automated verification of Invariants 1–10
│   ├── scheduler.test.js      # Priority ranking, capacity caps, starvation tests
│   ├── diffEngine.test.js     # Exact diff generation and prose explanations
│   ├── storage.test.js        # Persistence, schema versions, corruption recovery
│   ├── validation.test.js     # Form and input constraint validation
│   ├── units.test.js          # Unit conversions and integer invariants
│   └── app.flow.test.jsx      # End-to-end Golden Demo scenario integration test
└── devpost/
    ├── app-map.html           # Interactive architecture diagram & state visualizer
    └── checklist.md           # Build & verification milestone tracking
```

---

## 📜 Invariant Guarantees

ExamPilot enforces ten mathematical invariants verified by automated tests on every build:

1. **Integer Unit Granularity**: All study blocks and capacities are integer half-hour units ($1\text{ unit} = 0.5\text{h}$).
2. **Deterministic Output**: Given identical inputs, scheduler output is 100% bitwise identical.
3. **Daily Capacity Non-Violation**: Total scheduled units on Day $d \le \text{dailyCapacityUnits}$.
4. **Total Capacity Non-Violation**: Total scheduled units across all days $\le \text{totalCapacityUnits}$.
5. **Completed Block Immutability**: Finished study blocks are immutable across replanning.
6. **No Double-Counting**: Completed units are never deducted again or rescheduled.
7. **Single-Deduction Recovery**: Missed hours reduce available capacity exactly once.
8. **Mathematical Feasibility**: Plan is feasible if and only if $\text{unallocatedUnits} = 0$.
9. **Conservative Soft Starvation**: Topics receive at least 1.0h unless total capacity forbids it.
10. **Storage Isolation**: Corrupted saved data is safely quarantined to `exampilot:v1:corrupt` without crashing the application.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
