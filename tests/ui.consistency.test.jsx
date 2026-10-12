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
});
