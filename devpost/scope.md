---
doc: scope
status: approved
---

# ExamPilot

A focused, adaptive exam preparation planner that transforms student cramming panic into an actionable, realistic recovery study plan.

> Revision (during `4-spec`, at the learner's direction): the priority formula, the sample exam's daily hours/estimates, and the "rapid review" wording were aligned with `spec.md`. Product direction and POC boundary are unchanged.

## The Unique Kernel
**Adaptive recovery with transparent, real-time explanation.**
When students miss study sessions or fall behind, traditional planners break and induce panic. ExamPilot recalculates the remaining study window based on exam proximity, topic importance, confidence level, and remaining effort, dynamically explaining the actual schedule trade-offs made (e.g., *"Graphs: 1h moved from Day 1 to Day 3; Sorting is now at risk — 0.5h won't fit"*).

## Who It's For
A college student facing an upcoming exam in 3 to 7 days, juggling 3 to 6 distinct topics with varying levels of mastery. Today, they either freeze in decision paralysis, maintain brittle static spreadsheets, or follow generic to-do lists that fail to adapt when study sessions are missed.

## The Core Loop
1. **Input Exam Context:** Student enters exam date, daily available study hours, and topics with assigned confidence levels (1–5), importance (High/Medium/Low), and estimated study effort in hours.
2. **Generate Study Plan:** ExamPilot evaluates feasibility and distributes study blocks across days, prioritizing low-confidence high-importance material while enforcing starvation prevention.
3. **Track & Adapt:** Student checks off completed study blocks, marks topics mastered, or reports missed time ("I missed X hours today").
4. **Instant Dynamic Recovery:** ExamPilot recalculates the remaining days and generates a clear explanation derived from the actual diff between previous and newly calculated allocations.

## Explicit Scheduling & Prioritization Rules
1. **Priority:**
   - `priority = importanceWeight × (6 − confidence)`, with weights High = 3, Medium = 2, Low = 1. Deterministic tie-break: higher priority → lower confidence → earlier in the topic list.
   - Remaining effort determines how much time a topic *needs*, not how important it is.
   - Exam urgency is expressed through scheduling: the most important, least confident topics are placed on the earliest days, and in a plan that fits, unused time collects on the final day as a protected **review buffer**.
2. **Starvation Prevention & Minimum Allocations:**
   - When time is short, every unfinished topic first gets a 1-hour floor (in priority order) before high-priority topics absorb the rest.
   - If total available study hours < total remaining hours, ExamPilot enters **Triage**: it never invents time or exceeds daily capacity. It distributes the available time by priority and reports the exact unallocated hours per topic as "at risk".
3. **Completed Topic Handling:**
   - Completed study blocks are never moved or rescheduled. Topics marked mastered get no future study blocks; their freed hours go to the remaining topics.
4. **Dynamic Schedule Recalculation & Diff Explanations:**
   - When progress changes or a student reports missed time, the remaining days (from today forward) are re-planned against the remaining available hours.
   - The explanation is derived strictly from the difference between the previous and new schedule, never canned text.
5. **Handling Deficits & Zero-Hour Days:**
   - Missed hours reduce that day's available capacity.
   - If no capacity remains, ExamPilot honestly shows the full shortfall and which topics are at risk.
6. **Time granularity:** all time is planned in 0.5-hour (30-minute) increments.

## Inspiration & Identity
- **Vibe:** Calm, reassuring, modern productivity tool (clean, thoughtful, academic triage).
- **Tone:** Encouraging, clear, and pragmatic—honest about feasibility without scolding.

## Why This Matters to the Learner
- Solves a genuine, high-stress problem every student experiences.
- Serves as the vehicle to master plan-first, spec-driven development with AI agents: designing a coherent data model, deterministic scheduling heuristic, and polished interactive UI without bloat.

## What "Working" Looks Like
Demonstrated in under 60 seconds on screen:
1. The student loads a sample exam in 4 days with 4 topics, mixed confidence levels, and 4 hours/day available.
2. The initial schedule lays out day-by-day hourly allocations and confirms the plan fits, with a small review buffer on the last day.
3. The student checks off a 2-hour block for Day 1 and clicks "I missed 2 hours today".
4. The remaining schedule instantly shifts into Triage, with a dynamic explanation stating exactly what moved, what's now at risk, and the real shortfall.

## The POC Boundary
- **In Scope (Now):**
  - Single upcoming exam focus (3–7 day target horizon, 3–6 topics).
  - Topic confidence scoring (1–5), importance weighting, and estimated hours needed.
  - Daily time allocations in 0.5-hour increments (not minute-by-minute calendar slots).
  - Feasibility detection (flags when remaining hours exceed available study hours).
  - Starvation prevention (every unfinished topic gets a minimum allocation when time is short).
  - Dynamic recalculation with explanation generated from real schedule diffs.
  - Client-side persistence using `localStorage`.
  - Clean, responsive UI with zero external paid API dependencies.

## Later
- Multi-exam concurrent scheduling.
- Export to `.ics` / Google Calendar / Apple Calendar.
- Pomodoro timer integrations and active recall flashcard links.
- Multi-device sync and user accounts.
- Dedicated per-topic review sessions scheduled into spare time.

## Explicitly Cut
- **User Authentication / Accounts:** Cut to avoid boilerplate backend complexity and keep proof of concept lean.
- **Minute-by-minute clock scheduling:** Cut to prevent calendar sprawl and fragile micromanagement.
- **Paid Third-Party LLM APIs:** Cut to ensure zero latency, zero cost, 100% determinism, and reliable offline/local operation.
- **Social / sharing features:** Cut to keep focus strictly on student study execution.
