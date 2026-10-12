import { describe, it, expect } from 'vitest';
import { generatePlan, recalculate, derive } from '../src/lib/scheduler.js';
import { buildSampleSetup } from '../src/lib/sampleExam.js';
import { planReducer } from '../src/state/planReducer.js';
import { diffPlans } from '../src/lib/diffEngine.js';
import { assertInvariants, blocksTable } from './helpers.js';

describe('Slice 3 - Adaptive Recovery & Schedule Diff Engine', () => {
  const TODAY = '2026-10-12';

  it('runs the Golden Demo Scenario Step A & Step B and asserts exact mathematical and diff results', () => {
    // 1. Initial plan generation
    const sampleSetup = buildSampleSetup(TODAY);
    let state = planReducer(null, {
      type: 'GENERATE',
      payload: { setup: sampleSetup, today: TODAY }
    });

    assertInvariants(state, 0);
    let derived = derive(state, 0);
    expect(derived.totalRemainingUnits).toBe(30); // 15h
    expect(derived.totalAvailableFutureUnits).toBe(32); // 16h
    expect(derived.totalDeficitUnits).toBe(0);
    expect(derived.reviewBuffers[3]).toBe(2); // 1h buffer on Day 4

    // 2. Step A: Complete Day 1 Trees (2h)
    const day1TreesBlock = state.blocks.find(
      (b) => b.dayIndex === 0 && b.topicId === 't1' && b.status === 'planned'
    );
    expect(day1TreesBlock).toBeDefined();
    expect(day1TreesBlock.units).toBe(4); // 2h

    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day1TreesBlock.id, todayIndex: 0 }
    });

    assertInvariants(state, 0);
    // In Step A, plan didn't need to change, so lastChange should be null
    expect(state.lastChange).toBeNull();

    derived = derive(state, 0);
    expect(derived.completedByTopic['t1']).toBe(4); // 2h completed
    expect(derived.remainingByTopic['t1']).toBe(6); // 3h remaining
    expect(derived.totalRemainingUnits).toBe(26); // 13h remaining
    // Completed 4 units / (4 completed + 26 remaining) = 4/30 = 13.33%
    expect(Math.round(derived.progressPercent)).toBe(13);

    // 3. Step B: Report 2h (4 units) missed on Day 1
    // Day 1 free time before missed was 4h - 2h completed = 2h (4 units)
    expect(derived.dayCapacities[0]).toBe(4); // 2h free

    state = planReducer(state, {
      type: 'REPORT_MISSED',
      payload: { units: 4, todayIndex: 0 }
    });

    assertInvariants(state, 0);
    derived = derive(state, 0);

    // Verify Day 1 has 0 capacity left
    expect(derived.dayCapacities[0]).toBe(0);
    // Remaining need: 13h (26 units)
    expect(derived.totalRemainingUnits).toBe(26);
    // Remaining capacity across Days 2-4: 3 days * 4h = 12h (24 units)
    expect(derived.totalAvailableFutureUnits).toBe(24);
    // Deficit is exactly 1h (2 units)
    expect(derived.totalDeficitUnits).toBe(2);
    expect(derived.isTriage).toBe(true);

    // Check at risk topics: Sorting (need 3h, budget 2.5h -> 0.5h at risk) and Arrays (need 2h, budget 1.5h -> 0.5h at risk)
    expect(derived.atRiskByTopic['t3']).toBe(true);
    expect(derived.unallocatedByTopic['t3']).toBe(1); // 0.5h
    expect(derived.atRiskByTopic['t4']).toBe(true);
    expect(derived.unallocatedByTopic['t4']).toBe(1); // 0.5h
    expect(derived.atRiskByTopic['t1']).toBe(false);
    expect(derived.atRiskByTopic['t2']).toBe(false);

    // Check review buffer drops to 0h
    expect(derived.reviewBuffers[3]).toBe(0);

    // Verify the exact Step B block allocations table:
    // Day 1: Trees 2h (completed)
    // Day 2: Trees 2h, Graphs 2h
    // Day 3: Trees 1h, Graphs 2h, Sorting 1h
    // Day 4: Graphs 1h, Sorting 1.5h, Arrays 1.5h
    const table = blocksTable(state, state.topics);
    expect(table['Day 1']).toEqual({ 'Trees': 2 });
    expect(table['Day 2']).toEqual({ 'Trees': 2, 'Graphs': 2 });
    expect(table['Day 3']).toEqual({ 'Trees': 1, 'Graphs': 2, 'Sorting': 1 });
    expect(table['Day 4']).toEqual({ 'Graphs': 1, 'Sorting': 1.5, 'Arrays': 1.5 });

    // 4. Verify diff engine results
    const lastChange = state.lastChange;
    expect(lastChange).toBeDefined();
    expect(lastChange.deficitBeforeUnits).toBe(0);
    expect(lastChange.deficitAfterUnits).toBe(2);

    const { changes, lines } = lastChange;

    // Changes structure checks
    expect(changes.deficit).toEqual({ beforeUnits: 0, afterUnits: 2 });
    expect(changes.capacity).toEqual([
      { day: 0, beforeUnits: 4, afterUnits: 0 }
    ]);
    expect(changes.buffers).toEqual([
      { day: 3, beforeUnits: 2, afterUnits: 0 }
    ]);

    // Topic changes
    const graphsChange = changes.topics.find((t) => t.topicId === 't2');
    expect(graphsChange).toBeDefined();
    // Graphs moved 1h to Day 3 (day index 2) and 1h to Day 4 (day index 3) from Day 1 (day index 0)
    expect(graphsChange.moves).toEqual([
      { fromDay: 0, toDay: 2, units: 2 }, // 1h to Day 3
      { fromDay: 0, toDay: 3, units: 2 }  // 1h to Day 4
    ]);

    const sortingChange = changes.topics.find((t) => t.topicId === 't3');
    expect(sortingChange).toBeDefined();
    expect(sortingChange.moves).toEqual([
      { fromDay: 2, toDay: 3, units: 1 } // 0.5h moved from Day 3 to Day 4
    ]);
    expect(sortingChange.cuts).toEqual([
      { day: 2, beforeUnits: 3, afterUnits: 2, cutUnits: 1 } // cut from 1.5h to 1h on Day 3
    ]);
    expect(sortingChange.riskBeforeUnits).toBe(0);
    expect(sortingChange.riskAfterUnits).toBe(1); // 0.5h at risk

    const arraysChange = changes.topics.find((t) => t.topicId === 't4');
    expect(arraysChange).toBeDefined();
    expect(arraysChange.cuts).toEqual([
      { day: 3, beforeUnits: 4, afterUnits: 3, cutUnits: 1 } // cut from 2h to 1.5h on Day 4
    ]);
    expect(arraysChange.riskBeforeUnits).toBe(0);
    expect(arraysChange.riskAfterUnits).toBe(1); // 0.5h at risk

    // Targeted checks on explanation sentences
    expect(lines.some((l) => l.includes('lost 2h today') && l.includes('no study time left'))).toBe(true);
    expect(lines.some((l) => l.includes('Graphs') && l.includes('Day 1 to Day 3'))).toBe(true);
    expect(lines.some((l) => l.includes('Graphs') && l.includes('Day 1 to Day 4'))).toBe(true);
    expect(lines.some((l) => l.includes('Sorting') && l.includes('Day 3 to Day 4'))).toBe(true);
    expect(lines.some((l) => l.includes('Sorting') && l.includes('cut from 1.5h to 1h on Day 3'))).toBe(true);
    expect(lines.some((l) => l.includes('Arrays') && l.includes('cut from 2h to 1.5h on Day 4'))).toBe(true);
    expect(lines.some((l) => l.includes('Sorting') && l.includes('at risk'))).toBe(true);
    expect(lines.some((l) => l.includes('Arrays') && l.includes('at risk'))).toBe(true);
    expect(lines.some((l) => l.includes('Day 4 review buffer: 1h → 0h'))).toBe(true);
    expect(lines.some((l) => l.includes('Shortfall grew from 0h to 1h'))).toBe(true);
  });

  it('rejects toggling completed if it would violate daily capacity', () => {
    const sampleSetup = buildSampleSetup(TODAY);
    let state = planReducer(null, {
      type: 'GENERATE',
      payload: { setup: sampleSetup, today: TODAY }
    });

    // Mark 3.5h missed on Day 1 (daily units = 8, i.e. 4h; remaining free is 0.5h)
    state = planReducer(state, {
      type: 'REPORT_MISSED',
      payload: { units: 7, todayIndex: 0 }
    });

    // Find any block of 2h on Day 1
    // Attempting to check a 2h block would require 7 + 4 = 11 > 8 units, so it must be refused
    const block = state.blocks.find((b) => b.dayIndex === 0 && b.units === 4);
    if (block) {
      const stateBefore = state;
      const stateAfter = planReducer(state, {
        type: 'TOGGLE_BLOCK',
        payload: { blockId: block.id, todayIndex: 0 }
      });
      expect(stateAfter).toBe(stateBefore);
    }
  });

  it('preserves completed blocks immutability across recovery recalculations', () => {
    const sampleSetup = buildSampleSetup(TODAY);
    let state = planReducer(null, {
      type: 'GENERATE',
      payload: { setup: sampleSetup, today: TODAY }
    });

    const block = state.blocks.find((b) => b.dayIndex === 0 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: block.id, todayIndex: 0 }
    });

    const completedBlock = state.blocks.find((b) => b.id === block.id);
    expect(completedBlock.status).toBe('completed');

    // Report missed
    state = planReducer(state, {
      type: 'REPORT_MISSED',
      payload: { units: 2, todayIndex: 0 }
    });

    const completedBlockAfter = state.blocks.find((b) => b.id === block.id);
    expect(completedBlockAfter).toEqual(completedBlock);
  });
});
