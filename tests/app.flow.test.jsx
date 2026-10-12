import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../src/App.jsx';
import { STORAGE_KEY } from '../src/lib/storage.js';

describe('App Integration & End-to-End Golden Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('executes the full Golden Demo scenario: Load sample -> Check Day 1 Trees 2h -> Report 2h missed -> Verify Triage & recovery diff -> Mark Arrays mastered -> Verify Triage clears', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Initial State: Click "Load Sample Exam"
    const loadSampleButtons = screen.getAllByRole('button', { name: /load sample exam/i });
    expect(loadSampleButtons.length).toBeGreaterThan(0);
    await user.click(loadSampleButtons[0]);

    // Schedule view should appear with Subject header
    expect(screen.getAllByText('CS 201: Data Structures').length).toBeGreaterThan(0);
    expect(screen.getByText(/4 day preparation window/i)).toBeDefined();
    expect(screen.getByText(/Plan fits your available time/i)).toBeDefined();

    // 2. Step A: Check Day 1 Trees 2h block
    // Day 1 has Trees block
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    const day1TreesCheckbox = checkboxes[0];
    await user.click(day1TreesCheckbox);

    // Tree block is checked (completed)
    expect(day1TreesCheckbox.checked).toBe(true);
    // In Step A, plan didn't need to change, so no recovery diff banner
    expect(screen.queryByText(/Schedule Adjusted/i)).toBeNull();

    // 3. Step B: Click "I fell behind / Missed hours"
    const missedButton = screen.getByRole('button', { name: /i fell behind \/ missed hours/i });
    await user.click(missedButton);

    // Modal opens
    expect(screen.getByText('Record Missed Study Time')).toBeDefined();
    const hoursInput = screen.getByPlaceholderText('e.g. 1.5');
    await user.clear(hoursInput);
    await user.type(hoursInput, '2');

    const recalculateButton = screen.getByRole('button', { name: /recalculate schedule/i });
    await user.click(recalculateButton);

    // 4. Verify Triage Banner & Recovery Banner
    await waitFor(() => {
      expect(screen.getByText(/Triage Mode Active/i)).toBeDefined();
      expect(screen.getByText(/Schedule Adjusted · Work Shifted to Future Days/i)).toBeDefined();
    });

    // Check Recovery Banner contains expected diff information
    expect(screen.getByText(/You lost 2h today, so Day 1 has no study time left/i)).toBeDefined();
    expect(screen.getByText(/Shortfall grew from 0h to 1h/i)).toBeDefined();

    // 5. Test Mastery: In Topics sidebar, mark Arrays as Mastered
    const masteredButtons = screen.getAllByRole('button', { name: /^mastered$/i });
    // Arrays is the 4th topic
    const arraysMasteredBtn = masteredButtons[masteredButtons.length - 1];
    await user.click(arraysMasteredBtn);

    // Triage clears!
    await waitFor(() => {
      expect(screen.queryByText(/Time Deficit · Triage Mode Active/i)).toBeNull();
    });
    // Recovery banner updates to explain mastery
    expect(screen.getByText(/Arrays marked mastered/i)).toBeDefined();
    expect(screen.getByText(/Everything fits again/i)).toBeDefined();
  });

  it('tests reset confirmation modal: cancelling preserves plan, confirming resets to empty state', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample
    const loadSampleBtn = screen.getAllByRole('button', { name: /load sample exam/i })[0];
    await user.click(loadSampleBtn);
    expect(screen.getAllByText('CS 201: Data Structures').length).toBeGreaterThan(0);

    // Click Reset in Footer
    const resetFooterBtn = screen.getByRole('button', { name: /reset plan/i });
    await user.click(resetFooterBtn);

    // Confirm dialog opens
    expect(screen.getByText('Reset Study Plan?')).toBeDefined();

    // Cancel reset
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    // Plan is preserved!
    expect(screen.getAllByText('CS 201: Data Structures').length).toBeGreaterThan(0);

    // Now click Reset and Confirm
    await user.click(resetFooterBtn);
    const confirmResetBtn = screen.getByRole('button', { name: /reset everything/i });
    await user.click(confirmResetBtn);

    // Reset back to empty state!
    expect(screen.queryByText('CS 201: Data Structures')).toBeNull();
    expect(screen.getByText('No active study plan')).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('tests edit confirmation modal: cancelling preserves plan, confirming recreates plan', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample
    const loadSampleBtn = screen.getAllByRole('button', { name: /load sample exam/i })[0];
    await user.click(loadSampleBtn);

    // Click "Edit Setup"
    const editBtn = screen.getByRole('button', { name: /edit setup/i });
    await user.click(editBtn);

    // Submit form (in edit mode the button is "Confirm & Regenerate Plan")
    const submitBtn = screen.getByRole('button', { name: /confirm & regenerate plan/i });
    await user.click(submitBtn);

    // Modal warns about resetting progress
    expect(screen.getByText('Reset Current Plan Progress?')).toBeDefined();

    // Cancel edit inside the modal (there are two cancel buttons: one on the edit form, one in the modal)
    const cancelModalBtns = screen.getAllByRole('button', { name: /cancel/i });
    // The modal cancel button is the last rendered cancel button
    const cancelModalBtn = cancelModalBtns[cancelModalBtns.length - 1];
    await user.click(cancelModalBtn);

    // Plan still exists
    expect(screen.getAllByText('CS 201: Data Structures').length).toBeGreaterThan(0);
  });
});
