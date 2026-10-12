import { describe, it, expect } from 'vitest';
import {
  priority,
  rankTopics,
  generatePlan,
  derive,
  computeBudgets
} from '../src/lib/scheduler.js';
import { buildSampleSetup } from '../src/lib/sampleExam.js';
import { blocksTable, assertInvariants } from './helpers.js';

describe('Deterministic Scheduler Engine', () => {
  const baseToday = '2026-10-12';

  it('calculates approved priority formula and ranks deterministically', () => {
    // Trees: High (3) x (6 - 1) = 15
    expect(priority({ importance: 'high', confidence: 1 })).toBe(15);
    // Graphs: High (3) x (6 - 2) = 12
    expect(priority({ importance: 'high', confidence: 2 })).toBe(12);
    // Sorting: Med (2) x (6 - 3) = 6
    expect(priority({ importance: 'medium', confidence: 3 })).toBe(6);
    // Arrays: Med (2) x (6 - 4) = 4
    expect(priority({ importance: 'medium', confidence: 4 })).toBe(4);

    // Tie-break: same priority -> lower confidence first
    const tA = { name: 'A', importance: 'medium', confidence: 2 }; // 2 * 4 = 8
    const tB = { name: 'B', importance: 'high', confidence: 4 }; // 3 * 2 = 6, wait
    const tC = { name: 'C', importance: 'medium', confidence: 2 }; // 2 * 4 = 8
    const ranked = rankTopics([tA, tC]);
    expect(ranked[0].name).toBe('A');
    expect(ranked[1].name).toBe('C');
  });

  it('generates the exact Golden Scenario initial plan and review buffer', () => {
    const sampleSetup = buildSampleSetup(baseToday);
    const plan = generatePlan(sampleSetup, baseToday);

    expect(plan.exam.subject).toBe('CS 201: Data Structures');
    expect(plan.exam.dailyUnits).toBe(8); // 4h

    const table = blocksTable(plan, plan.topics);

    // Assert exact day-by-day table matching spec.md
    expect(table['Day 1']).toEqual({ Trees: 2, Graphs: 2 });
    expect(table['Day 2']).toEqual({ Trees: 2, Graphs: 2 });
    expect(table['Day 3']).toEqual({ Trees: 1, Graphs: 1, Sorting: 2 });
    expect(table['Day 4']).toEqual({ Sorting: 1, Arrays: 2 });

    const derived = derive(plan, 0);
    expect(derived.isTriage).toBe(false);
    expect(derived.totalDeficitUnits).toBe(0);
    // 1h buffer on Day 4
    expect(derived.reviewBuffers[3]).toBe(2); // 2 units = 1h
    expect(derived.totalAvailableFutureUnits).toBe(32); // 16h
    expect(derived.totalRemainingUnits).toBe(30); // 15h

    // Invariants
    expect(assertInvariants(plan, 0)).toBe(true);
  });

  it('handles insufficient time / triage mode strictly within daily capacity', () => {
    // 3 topics needing 10h total across 2 days @ 3h/day = 6h capacity -> 4h deficit
    const setup = {
      subject: 'Quick Triage Test',
      examDate: '2026-10-14', // 2 study days
      dailyHours: 3,
      topics: [
        { name: 'Hard Topic', confidence: 1, importance: 'high', estimatedHours: 5 }, // pri 15
        { name: 'Medium Topic', confidence: 3, importance: 'medium', estimatedHours: 3 }, // pri 6
        { name: 'Light Topic', confidence: 4, importance: 'low', estimatedHours: 2 } // pri 2
      ]
    };

    const plan = generatePlan(setup, baseToday);
    const derived = derive(plan, 0);

    expect(derived.isTriage).toBe(true);
    expect(derived.totalAvailableFutureUnits).toBe(12); // 6h = 12 units
    expect(derived.totalRemainingUnits).toBe(20); // 10h = 20 units
    expect(derived.totalDeficitUnits).toBe(8); // 4h deficit = 8 units

    // Check invariants
    expect(assertInvariants(plan, 0)).toBe(true);

    // Verify no day exceeds 3h (6 units)
    expect(derived.plannedByDay[0]).toBeLessThanOrEqual(6);
    expect(derived.plannedByDay[1]).toBeLessThanOrEqual(6);
  });

  it('enforces starvation floor as soft constraint under extreme capacity shortage', () => {
    // 6 topics, total capacity = 3h (6 units)
    // 6 topics all need 2h (4 units). Starvation floor gives 2 units each in rank order.
    // Since only 6 units available, only the top 3 topics can get 2 units (1h).
    // The bottom 3 get 0 units, and are reported at risk for their full remaining estimate.
    const activeTopics = [
      { id: 't1', name: 'T1', confidence: 1, importance: 'high', remainingUnits: 4 }, // pri 15
      { id: 't2', name: 'T2', confidence: 2, importance: 'high', remainingUnits: 4 }, // pri 12
      { id: 't3', name: 'T3', confidence: 1, importance: 'medium', remainingUnits: 4 }, // pri 10
      { id: 't4', name: 'T4', confidence: 3, importance: 'medium', remainingUnits: 4 }, // pri 6
      { id: 't5', name: 'T5', confidence: 2, importance: 'low', remainingUnits: 4 }, // pri 4
      { id: 't6', name: 'T6', confidence: 4, importance: 'low', remainingUnits: 4 } // pri 2
    ];

    const budgets = computeBudgets(activeTopics, 6);

    expect(budgets['t1']).toBe(2);
    expect(budgets['t2']).toBe(2);
    expect(budgets['t3']).toBe(2);
    expect(budgets['t4']).toBe(0);
    expect(budgets['t5']).toBe(0);
    expect(budgets['t6']).toBe(0);

    const sum = Object.values(budgets).reduce((a, b) => a + b, 0);
    expect(sum).toBe(6);
  });
});
