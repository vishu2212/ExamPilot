# ExamPilot — 2-Minute Demo Video Script

**Target Duration:** 2 minutes to 2 minutes 20 seconds  
**Tone:** Confident, clear, empathetic to students, focused on honest math and deterministic UX.

---

### [0:00 – 0:25] The Problem & The Solution
- **Visual:** Browser showing empty state of ExamPilot at `http://localhost:5173`. Crisp, clean editorial UI.
- **Voiceover:**  
  *"We’ve all been there: an exam is four days away, life happens, and you lose two hours of study time. Most study apps respond by piling those missed hours onto tomorrow—turning an already stressful week into impossible 14-hour days. Or worse, AI tools hallucinate a completely new schedule that ignores your real-life capacity.*  
  *Meet ExamPilot: an adaptive, deterministic study planner designed for students on tight deadlines. It operates with mathematical honesty: respecting hard daily caps, keeping completed work immutable, and providing transparent before-and-after schedule diffs when you fall behind."*

---

### [0:25 – 0:50] Step 1: Initial Plan & The CS 201 Midterm
- **Visual:** Cursor clicks **"Load Sample Exam"** in the top navigation. The form populates with the CS 201 Midterm (4 days, 4.0 hours/day = 16 hours total capacity; 4 topics totaling 15 hours). The schedule instantly renders.
- **Voiceover:**  
  *"Let’s look at a realistic scenario: CS 201 Midterm. In four days, we have four topics totaling 15 hours of work, with four hours available each day—a total of 16 hours of capacity.*  
  *ExamPilot prioritizes high-importance, low-confidence subjects like Dynamic Programming and Graph Algorithms first, gives each topic a minimum allocation, and identifies a 1-hour review buffer on Day 4. The plan is fully feasible."*

---

### [0:50 – 1:15] Step 2: Studying & Immutability
- **Visual:** Cursor moves to Day 1. Clicks the checkbox on the **Trees & Traversals (2.0h)** study block. Day 1 card shows 50% completed (2.0h / 4.0h). Topic progress updates.
- **Voiceover:**  
  *"On Day 1, we sit down and finish our 2-hour Trees and Traversals block. We check it off. Notice that completed study blocks are permanently locked in history. No matter what changes next, ExamPilot will never double-count, erase, or reshuffle hours you've already completed."*

---

### [1:15 – 1:45] Step 3: Falling Behind & Honest Triage
- **Visual:** Cursor clicks the amber **"I Fell Behind"** button in the header. The modal appears. User enters `2` missed hours for Day 1 and clicks **"Recalculate Schedule"**.
- **Visual Detail:** The schedule updates immediately. The amber Recovery Banner appears with the exact diff:
  - *"Recovery Plan Active: 2.0h missed on Day 1 absorbed into future schedule."*
  - *"Review buffer removed (−1.0h). Arrays & Strings deferred (−1.0h)."*
  - The Feasibility Banner shifts to amber: *"Schedule requires 13.0h of work across 12.0h of remaining capacity. 1.0h at risk."*
- **Voiceover:**  
  *"Now, real life happens. An emergency costs us two hours on Day 1. We click 'I Fell Behind' and report two missed hours.*  
  *Watch how ExamPilot reacts: it doesn't invent an impossible 6-hour day tomorrow. Daily capacity remains strictly capped at 4 hours. The first missed hour is absorbed by our Day 4 review buffer. But because we now have 13 hours of work for only 12 remaining hours of capacity, ExamPilot performs honest triage: it protects our high-yield Dynamic Programming and Graph work, trims our lowest-priority Arrays topic from 2 hours to 1 hour, and shows us a clear, transparent schedule diff explaining exactly what shifted."*

---

### [1:45 – 2:05] Step 4: Resolving the Deficit via Mastery
- **Visual:** Cursor navigates to the Topic Overview list on the right. User clicks the **"Mastered"** toggle next to **Arrays & Strings**.
- **Visual Detail:** The 1.0h deficit immediately clears. The Feasibility banner turns green: *"Feasible Plan: All topics fully covered with 0.0h unallocated."*
- **Voiceover:**  
  *"What if we already feel confident about basic Arrays? We simply mark Arrays as mastered. Instantly, ExamPilot frees those unneeded hours, eliminates the deficit, and our schedule returns to 100% feasibility—all recalculations happening instantly, deterministically, right in our browser with zero cloud lag."*

---

### [2:05 – 2:20] Closing & Call to Action
- **Visual:** Pan across the editorial dashboard. Show responsive view or quick test pass terminal badge.
- **Voiceover:**  
  *"ExamPilot is 100% open source, privacy-first with local storage persistence, and powered by 10 mathematically verified invariants across 29 automated tests.*  
  *Never let falling behind derail your exam prep. Fly through finals with ExamPilot. Thank you!"*
