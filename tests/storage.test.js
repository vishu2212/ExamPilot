import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  save,
  load,
  clear,
  isValidPlanState,
  STORAGE_KEY,
  CORRUPT_KEY
} from '../src/lib/storage.js';
import { generatePlan, derive } from '../src/lib/scheduler.js';
import { buildSampleSetup } from '../src/lib/sampleExam.js';
import { planReducer } from '../src/state/planReducer.js';

describe('Slice 4 - Persistence, Mastery, Reset & Safety', () => {
  const TODAY = '2026-10-12';

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('validates a correct PlanState data model accurately', () => {
    const sample = buildSampleSetup(TODAY);
    const plan = generatePlan(sample, TODAY);
    expect(isValidPlanState(plan)).toBe(true);
  });

  it('rejects invalid plan states (wrong version, non-existent topicId, capacity violated)', () => {
    const sample = buildSampleSetup(TODAY);
    const plan = generatePlan(sample, TODAY);

    // Wrong version
    expect(isValidPlanState({ ...plan, version: 2 })).toBe(false);

    // Missing subject
    expect(isValidPlanState({ ...plan, exam: { ...plan.exam, subject: '' } })).toBe(false);

    // Non-existent topicId in a block
    const badBlocks = [...plan.blocks, { id: 999, topicId: 'nonexistent', dayIndex: 0, units: 2, status: 'planned' }];
    expect(isValidPlanState({ ...plan, blocks: badBlocks })).toBe(false);

    // Day capacity invariant violated: day 0 has dailyUnits=8, insert 10 units block
    const overbookedBlocks = [...plan.blocks, { id: 998, topicId: 't1', dayIndex: 0, units: 10, status: 'planned' }];
    expect(isValidPlanState({ ...plan, blocks: overbookedBlocks })).toBe(false);
  });

  it('saves and loads plan state cleanly across simulated reloads', () => {
    const sample = buildSampleSetup(TODAY);
    let state = generatePlan(sample, TODAY);

    // Complete Day 1 Trees
    const day1Trees = state.blocks.find((b) => b.dayIndex === 0 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day1Trees.id, todayIndex: 0 }
    });

    // Save
    const saveOk = save(state);
    expect(saveOk).toBe(true);

    // Load
    const { state: loadedState, notice } = load();
    expect(notice).toBeNull();
    expect(loadedState).toEqual(state);
    expect(loadedState.blocks.find((b) => b.id === day1Trees.id).status).toBe('completed');
  });

  it('handles corrupted localStorage data defensively and backs it up', () => {
    localStorage.setItem(STORAGE_KEY, '{ malformed JSON @@##');

    const { state, notice } = load();
    expect(state).toBeNull();
    expect(notice).toContain("Your saved plan couldn't be read");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CORRUPT_KEY)).toBe('{ malformed JSON @@##');
  });

  it('handles invalid schema in localStorage by resetting and backing up', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, invalid: true }));

    const { state, notice } = load();
    expect(state).toBeNull();
    expect(notice).toContain("Your saved plan couldn't be read");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CORRUPT_KEY)).toContain('"version":99');
  });

  it('clears storage completely on reset', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ valid: 'test' }));
    localStorage.setItem(CORRUPT_KEY, 'corrupt backup');

    clear();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CORRUPT_KEY)).toBeNull();
  });

  it('reallocates freed study hours on topic mastery and updates progress correctly', () => {
    const sample = buildSampleSetup(TODAY);
    let state = generatePlan(sample, TODAY);

    // Step A: Complete Day 1 Trees 2h
    const day1Trees = state.blocks.find((b) => b.dayIndex === 0 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day1Trees.id, todayIndex: 0 }
    });

    // Step B: Miss 2h
    state = planReducer(state, {
      type: 'REPORT_MISSED',
      payload: { units: 4, todayIndex: 0 }
    });

    let derived = derive(state, 0);
    expect(derived.totalDeficitUnits).toBe(2); // 1h deficit in triage

    // Now mark Arrays ('t4') as mastered!
    state = planReducer(state, {
      type: 'MARK_MASTERED',
      payload: { topicId: 't4', todayIndex: 0 }
    });

    derived = derive(state, 0);

    // In Step B, Arrays had a budget of 1.5h (3 units) planned on Day 4.
    // Marking Arrays mastered removes its remaining units (4 units = 2h need) from scheduling.
    // Freed capacity on Day 4 is reallocated to Sorting ('t3') which was short by 0.5h (1 unit)!
    // Sorting now gets its full remaining need (3h), leaving 1h of review buffer on Day 4 and deficit = 0!
    expect(derived.remainingByTopic['t4']).toBe(0);
    expect(derived.atRiskByTopic['t4']).toBe(false);
    expect(derived.atRiskByTopic['t3']).toBe(false);
    expect(derived.totalDeficitUnits).toBe(0);
    expect(derived.isTriage).toBe(false);

    // Arrays must have zero future planned blocks
    const futureArraysBlocks = state.blocks.filter(
      (b) => b.topicId === 't4' && b.status === 'planned' && b.dayIndex >= 0
    );
    expect(futureArraysBlocks.length).toBe(0);

    // Diff engine explains the mastery event
    expect(state.lastChange).toBeDefined();
    expect(state.lastChange.lines.some((l) => l.includes('Arrays marked mastered'))).toBe(true);

    // Unmastering Arrays ('UNMASTER') restores it back into the plan
    state = planReducer(state, {
      type: 'UNMASTER',
      payload: { topicId: 't4', todayIndex: 0 }
    });

    derived = derive(state, 0);
    expect(derived.remainingByTopic['t4']).toBe(4); // 2h
    expect(derived.totalDeficitUnits).toBe(2); // 1h deficit returns
    expect(state.lastChange.lines.some((l) => l.includes('Arrays is back in the plan'))).toBe(true);
  });
});
