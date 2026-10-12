import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { buildSampleSetup } from '../src/lib/sampleExam.js';
import { generatePlan, recalculate, derive } from '../src/lib/scheduler.js';
import { planReducer } from '../src/state/planReducer.js';

describe('UI Consistency & Calculation Integrity', () => {
  const TODAY = '2026-10-12';

  beforeEach(() => {
    localStorage.clear();
  });

  it('Issue 1: unmastered topics with 0h progress do not display "Mastered" badge and show "Mark Mastered" action', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample exam
    const loadSampleBtns = screen.getAllByRole('button', { name: /load sample exam/i });
    await user.click(loadSampleBtns[0]);

    // In initial plan, NO topic should have a "Mastered" status badge
    // The only things matching /master/i should be the "Mark Mastered" action buttons
    const masteredBadges = screen.queryAllByText(/^mastered$/i);
    expect(masteredBadges.length).toBe(0);

    // Each of the 4 topics should have a "Mark Mastered" button
    const markMasteredButtons = screen.getAllByRole('button', { name: /mark mastered/i });
    expect(markMasteredButtons.length).toBe(4);

    // Click "Mark Mastered" on Arrays (last topic)
    await user.click(markMasteredButtons[3]);

    // Now Arrays DOES have a "Mastered" badge and an "Undo" button
    const newMasteredBadges = screen.getAllByText(/^mastered$/i);
    expect(newMasteredBadges.length).toBe(1);

    const undoButtons = screen.getAllByRole('button', { name: /undo/i });
    expect(undoButtons.length).toBe(1);
  });

  it('Issue 2: verifies mathematical consistency of estimated effort, daily allocations, available capacity, and review buffer', () => {
    const sample = buildSampleSetup(TODAY);
    const plan = generatePlan(sample, TODAY);
    const derived = derive(plan, 0);

    // Total estimated effort: 5h + 5h + 3h + 2h = 15h (30 units)
    const totalEstimatedUnits = plan.topics.reduce((sum, t) => sum + t.estimatedUnits, 0);
    expect(totalEstimatedUnits).toBe(30);

    // Total daily capacity across 4 days: 4 * 4h = 16h (32 units)
    expect(derived.totalAvailableFutureUnits).toBe(32);

    // Total planned blocks across all days = 30 units (15h)
    const totalPlannedUnits = plan.blocks.reduce((sum, b) => sum + b.units, 0);
    expect(totalPlannedUnits).toBe(30);

    // Review buffer on Day 4: 1h (2 units)
    const totalBuffer = Object.values(derived.reviewBuffers).reduce((s, u) => s + u, 0);
    expect(totalBuffer).toBe(2);

    // Mathematical identity: Planned (30) + Review Buffer (2) === Available Capacity (32)
    expect(totalPlannedUnits + totalBuffer).toBe(derived.totalAvailableFutureUnits);
  });

  it('Issue 3: completing a scheduled session updates topic progress without mutating mastery state, and full completion displays "Done"', () => {
    const sample = buildSampleSetup(TODAY);
    let state = generatePlan(sample, TODAY);

    // Toggle 2h Trees block on Day 1
    const day1Trees = state.blocks.find((b) => b.dayIndex === 0 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day1Trees.id, todayIndex: 0 }
    });

    let derived = derive(state, 0);
    // Trees progress updated to 2h (4 units)
    expect(derived.completedByTopic['t1']).toBe(4);
    expect(derived.remainingByTopic['t1']).toBe(6); // 3h remaining
    // Trees must NOT be marked mastered
    const treesTopic = state.topics.find((t) => t.id === 't1');
    expect(treesTopic.mastered).toBe(false);

    // Now complete remaining Trees blocks (Day 2: 2h, Day 3: 1h)
    const day2Trees = state.blocks.find((b) => b.dayIndex === 1 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day2Trees.id, todayIndex: 0 }
    });

    const day3Trees = state.blocks.find((b) => b.dayIndex === 2 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day3Trees.id, todayIndex: 0 }
    });

    derived = derive(state, 0);
    // All 5h (10 units) of Trees completed!
    expect(derived.completedByTopic['t1']).toBe(10);
    expect(derived.remainingByTopic['t1']).toBe(0);
    // Topic remains mastered === false, but is completely fulfilled
    expect(state.topics.find((t) => t.id === 't1').mastered).toBe(false);
  });

  it('verifies Trees with 4h completed out of 5h estimated: Day 2 block is completed session, remaining effort is 1h, zero over-allocation', () => {
    const sample = buildSampleSetup(TODAY);
    let state = generatePlan(sample, TODAY);

    // Complete Day 1 Trees (2h)
    const day1Trees = state.blocks.find((b) => b.dayIndex === 0 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day1Trees.id, todayIndex: 0 }
    });

    // Complete Day 2 Trees (2h)
    const day2Trees = state.blocks.find((b) => b.dayIndex === 1 && b.topicId === 't1');
    state = planReducer(state, {
      type: 'TOGGLE_BLOCK',
      payload: { blockId: day2Trees.id, todayIndex: 0 }
    });

    const derived = derive(state, 0);

    // 1. Progress: Trees has 4h completed (8 units) out of 5h (10 units)
    expect(derived.completedByTopic['t1']).toBe(8); // 4.0h
    // 2. Remaining effort is exactly 1h (2 units), never negative
    expect(derived.remainingByTopic['t1']).toBe(2); // 1.0h
    expect(derived.remainingByTopic['t1']).toBeGreaterThanOrEqual(0);

    // 3. Day 2 Trees block is an IMMUTABLE COMPLETED block (not a planned over-allocation)
    const day2TreesBlock = state.blocks.find((b) => b.dayIndex === 1 && b.topicId === 't1');
    expect(day2TreesBlock.status).toBe('completed');
    expect(day2TreesBlock.units).toBe(4); // 2.0h

    // 4. In future planned blocks, Trees is allocated ONLY 1h (2 units on Day 3)
    const futurePlannedTrees = state.blocks.filter(
      (b) => b.topicId === 't1' && b.status === 'planned' && b.dayIndex >= 0
    );
    expect(futurePlannedTrees.length).toBe(1);
    expect(futurePlannedTrees[0].dayIndex).toBe(2); // Day 3
    expect(futurePlannedTrees[0].units).toBe(2); // 1.0h

    // 5. Total study time allocated to Trees across all days = 2h + 2h + 1h = 5h (exact match)
    const totalTreesAllocated = state.blocks
      .filter((b) => b.topicId === 't1')
      .reduce((sum, b) => sum + b.units, 0);
    expect(totalTreesAllocated).toBe(10); // 5.0h total, 0.0h over-allocation!

    // 6. Completed blocks remain deep-equal across re-recalculation (immutability)
    const day1Completed = state.blocks.find((b) => b.dayIndex === 0 && b.topicId === 't1');
    const recalculated = recalculate(state, 0);
    const day1CompletedAfter = recalculated.blocks.find((b) => b.id === day1Completed.id);
    const day2CompletedAfter = recalculated.blocks.find((b) => b.id === day2TreesBlock.id);
    expect(day1CompletedAfter).toEqual(day1Completed);
    expect(day2CompletedAfter).toEqual(day2TreesBlock);

    // 7. Feasibility banner and review buffer reflect actual schedule
    expect(derived.isTriage).toBe(false);
    expect(derived.totalDeficitUnits).toBe(0);
    expect(derived.totalRemainingUnits).toBe(22); // 11.0h remaining
    expect(derived.totalAvailableFutureUnits).toBe(24); // 12.0h available
    expect(derived.reviewBuffers[3]).toBe(2); // 1.0h buffer on Day 4
  });

  it('verifies that if a topic has completed hours exceeding estimated hours, remaining effort clamps to 0 and 0 future units are planned', () => {
    const sample = buildSampleSetup(TODAY);
    let state = generatePlan(sample, TODAY);

    // Artificially inject completed blocks totaling 6h (12 units) for Trees (estimated 5h / 10 units)
    state.blocks = [
      { id: 'b_past1', dayIndex: 0, topicId: 't1', units: 6, status: 'completed' },
      { id: 'b_past2', dayIndex: 1, topicId: 't1', units: 6, status: 'completed' },
      ...state.blocks.filter((b) => b.topicId !== 't1')
    ];

    const derived = derive(state, 0);
    // Remaining required effort is clamped to 0, never negative
    expect(derived.completedByTopic['t1']).toBe(12);
    expect(derived.remainingByTopic['t1']).toBe(0);
    expect(derived.remainingByTopic['t1']).toBeGreaterThanOrEqual(0);

    const recalculated = recalculate(state, 0);
    // Zero future planned blocks allocated to Trees
    const futurePlannedTrees = recalculated.blocks.filter(
      (b) => b.topicId === 't1' && b.status === 'planned'
    );
    expect(futurePlannedTrees.length).toBe(0);
  });

  it('verifies full DOM rendering in Trees 4h completed state: Day 2 block is checked, Day 3 has 1h Trees, and banner shows 11h in 12h capacity', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample exam
    const loadSampleBtns = screen.getAllByRole('button', { name: /load sample exam/i });
    await user.click(loadSampleBtns[0]);

    // Check Day 1 Trees (2h)
    const day1Checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is Day 1 Trees
    await user.click(day1Checkboxes[0]);

    // Now Day 2 Trees is the 3rd checkbox in DOM
    const updatedCheckboxes = screen.getAllByRole('checkbox');
    await user.click(updatedCheckboxes[2]);

    // Topic progress: Trees shows 4h / 5h
    expect(screen.getByText('4h / 5h')).toBeDefined();

    // Feasibility banner reflects 11h remaining in 12h capacity
    expect(screen.getByText(/All 11h of remaining study effort fit within your 12h of available study capacity/i)).toBeDefined();
    expect(screen.getByText(/Includes a 1h review buffer/i)).toBeDefined();

    // Day 4 review buffer element is visible
    expect(screen.getByText(/Review Buffer \/ Free Study Time/i)).toBeDefined();
  });
});
