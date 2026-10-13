import { test, expect } from '@playwright/test';

test.describe('ExamPilot Critical Browser Flows & Invariants', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root and ensure fresh, isolated test context
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('Scenario 1: Application loads cleanly without JavaScript console errors', async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('/');

    // Verify main landmarks
    await expect(page.locator('h1', { hasText: 'ExamPilot' })).toBeVisible();
    await expect(page.getByText('No active study plan')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Configure Exam' })).toBeVisible();
    await expect(page.getByRole('button', { name: /load sample/i }).first()).toBeVisible();

    // Verify no console errors or uncaught page exceptions
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('Scenario 2: Initial schedule respects daily study capacity limits', async ({ page }) => {
    await page.goto('/');

    // Load sample exam
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Verify schedule rendered
    await expect(page.getByText('CS 201: Data Structures').first()).toBeVisible();
    await expect(page.getByText(/4 day preparation window/i)).toBeVisible();
    await expect(page.getByText(/Plan fits your available time/i)).toBeVisible();

    // Check each day card: capacity is 4h, allocations must never exceed 4h
    const dayCards = page.locator('div.space-y-4 > div.rounded-2xl');
    await expect(dayCards).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const text = await dayCards.nth(i).locator('span.tabular-nums:has-text("/")').textContent();
      // e.g. "4h / 4h" or "3h / 4h"
      const match = text.match(/([0-9.]+)h\s*\/\s*4h/);
      expect(match).not.toBeNull();
      const usedHours = parseFloat(match[1]);
      expect(usedHours).toBeLessThanOrEqual(4);
      expect(usedHours).toBeGreaterThan(0);
    }
  });

  test('Scenario 3: Completing a study block updates progress and topic coverage correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Initial progress in header should be 0%
    const headerProgress = page.locator('header').locator('span.tabular-nums');
    await expect(headerProgress).toHaveText('0%');

    // Find the first study block checkbox (Trees, 2h) on Day 1
    const firstCheckbox = page.getByRole('checkbox').first();
    await expect(firstCheckbox).not.toBeChecked();

    // Check the box
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();

    // Progress percentage should increase (2h completed / 15h total effort ≈ 13%)
    await expect(headerProgress).toHaveText('13%');

    // Topic coverage for Trees should reflect 2h / 5h completed
    const treesTopicRow = page.locator('div.rounded-xl', { hasText: 'Trees' }).first();
    await expect(treesTopicRow).toContainText('2h / 5h');
  });

  test('Scenario 4 & 6: Completed blocks remain completed after recalculation and reload without double-counting', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Step A: Mark Day 1 Trees 2h block completed
    const firstCheckbox = page.getByRole('checkbox').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();

    // Step B: Report 2h missed on Day 1
    await page.getByRole('button', { name: /i fell behind \/ missed hours/i }).click();
    await expect(page.getByText('Record Missed Study Time')).toBeVisible();

    const hoursInput = page.getByPlaceholder('e.g. 1.5');
    await hoursInput.fill('2');
    await page.getByRole('button', { name: /recalculate schedule/i }).click();

    // Recalculation triggers Triage mode (1h shortfall) and Recovery banner
    await expect(page.getByText(/Triage Mode Active/i)).toBeVisible();
    await expect(page.getByText(/1h Shortfall/i)).toBeVisible();
    await expect(page.getByText(/Schedule Adjusted · Work Shifted to Future Days/i)).toBeVisible();
    await expect(page.getByText(/You lost 2h today, so Day 1 has no study time left/i)).toBeVisible();

    // Invariant: Completed Trees block on Day 1 remains checked and completed
    await expect(firstCheckbox).toBeChecked();

    // Day 1 used hours: 2h completed + 2h missed = 4h / 4h
    const day1Card = page.locator('div.space-y-4 > div.rounded-2xl').first();
    await expect(day1Card).toContainText('2h missed');
    await expect(day1Card).toContainText('4h / 4h');

    // Step C: Refresh the page to verify persistence
    await page.reload();

    // After refresh, the plan must remain hydrated with all progress and recovery state intact
    await expect(page.getByText('CS 201: Data Structures').first()).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toBeChecked();
    await expect(page.locator('header').locator('span.tabular-nums')).toHaveText('13%');
    await expect(page.getByText(/Triage Mode Active/i)).toBeVisible();
    await expect(page.locator('div.space-y-4 > div.rounded-2xl').first()).toContainText('2h missed');
  });

  test('Scenario 5: Reporting missed study time cannot exceed the allowed maximum', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Complete Day 1 Trees 2h block, leaving 2h free on Day 1
    await page.getByRole('checkbox').first().click();

    // Open Missed Time modal
    await page.getByRole('button', { name: /i fell behind \/ missed hours/i }).click();
    await expect(page.getByText('Record Missed Study Time')).toBeVisible();

    // Max available to miss is 2h
    await expect(page.getByText('Maximum available to miss today: 2h')).toBeVisible();

    const hoursInput = page.getByPlaceholder('e.g. 1.5');

    // Attempt to enter 3.0h (exceeding maximum 2h)
    await hoursInput.fill('3.0');
    await page.getByRole('button', { name: /recalculate schedule/i }).click();

    // HTML5 native constraint blocks form submission because max=2
    const isRangeOverflow = await hoursInput.evaluate((el) => el.validity.rangeOverflow);
    expect(isRangeOverflow).toBe(true);
    await expect(page.getByText('Record Missed Study Time')).toBeVisible();

    // Also verify application JS validation displays explicit message when form is submitted
    await hoursInput.evaluate((el) => el.form.setAttribute('novalidate', 'true'));
    await page.getByRole('button', { name: /recalculate schedule/i }).click();
    await expect(page.getByText(/Cannot miss more than 2h/i)).toBeVisible();
    await expect(page.getByText('Record Missed Study Time')).toBeVisible();

    // Attempt to enter non-half-hour increment
    await hoursInput.fill('1.3');
    await page.getByRole('button', { name: /recalculate schedule/i }).click();
    await expect(page.getByText(/must be in 0.5-hour increments/i)).toBeVisible();

    // Cancel modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Record Missed Study Time')).not.toBeVisible();

    // Verify schedule remains untouched and no missed time banner
    await expect(page.locator('div.space-y-4').locator('span:has-text("missed")')).not.toBeVisible();
  });

  test('Scenario 7: Every day allocated study time strictly respects daily capacity limits', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Check all day cards initially
    const dayCards = page.locator('div.space-y-4 > div.rounded-2xl');
    await expect(dayCards).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const card = dayCards.nth(i);
      const usageText = await card.locator('span.tabular-nums:has-text("/")').textContent();
      const match = usageText.match(/([0-9.]+)h\s*\/\s*([0-9.]+)h/);
      expect(match).not.toBeNull();
      const used = parseFloat(match[1]);
      const limit = parseFloat(match[2]);
      expect(used).toBeLessThanOrEqual(limit);
    }

    // Report 1.0h missed
    await page.getByRole('button', { name: /i fell behind \/ missed hours/i }).click();
    await page.getByPlaceholder('e.g. 1.5').fill('1.0');
    await page.getByRole('button', { name: /recalculate schedule/i }).click();

    // Verify all day cards again after recovery
    for (let i = 0; i < 4; i++) {
      const card = dayCards.nth(i);
      const usageText = await card.locator('span.tabular-nums:has-text("/")').textContent();
      const match = usageText.match(/([0-9.]+)h\s*\/\s*([0-9.]+)h/);
      expect(match).not.toBeNull();
      const used = parseFloat(match[1]);
      const limit = parseFloat(match[2]);
      expect(used).toBeLessThanOrEqual(limit);
    }
  });

  test('Scenario 8: Remaining effort, capacity, feasibility status, and explanations stay consistent', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Initially: Plan fits available time
    await expect(page.getByText('Plan fits your available time')).toBeVisible();

    // Complete Day 1 Trees (2h)
    await page.getByRole('checkbox').first().click();

    // Report 2h missed -> triggers triage mode with Arrays at risk
    await page.getByRole('button', { name: /i fell behind \/ missed hours/i }).click();
    await page.getByPlaceholder('e.g. 1.5').fill('2');
    await page.getByRole('button', { name: /recalculate schedule/i }).click();

    await expect(page.getByText('Triage Mode Active')).toBeVisible();
    await expect(page.getByText('1h Shortfall')).toBeVisible();
    await expect(page.getByText('-0.5h clipped').first()).toBeVisible();

    // Recovery banner shows explanation lines
    await expect(page.getByText('Schedule Adjusted · Work Shifted to Future Days')).toBeVisible();

    // Dismiss recovery banner
    const dismissBtn = page.locator('button[title="Dismiss notification"]');
    await dismissBtn.click();
    await expect(page.getByText('Schedule Adjusted · Work Shifted to Future Days')).not.toBeVisible();

    // In Topic Coverage list, find Arrays row and click 'Mark Mastered'
    const arraysRow = page.locator('div.rounded-xl', { hasText: 'Arrays' });
    const markMasteredBtn = arraysRow.getByRole('button', { name: /mark mastered/i });
    await markMasteredBtn.click();

    // Triage clears because remaining effort now fits within available capacity!
    await expect(page.getByText('Triage Mode Active')).not.toBeVisible();
    await expect(page.getByText('Plan fits your available time')).toBeVisible();

    // Recovery banner re-appears explaining that Arrays was marked mastered and schedule fits
    await expect(page.getByText(/Arrays marked mastered/i)).toBeVisible();
    await expect(page.getByText(/Everything fits again/i)).toBeVisible();
  });

  test('Scenario 9: Data persists correctly across reloads and safe reset confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Complete Day 1 Trees 2h
    await page.getByRole('checkbox').first().click();
    await expect(page.locator('header').locator('span.tabular-nums')).toHaveText('13%');

    // Reload page and check persistence
    await page.reload();
    await expect(page.getByText('CS 201: Data Structures').first()).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toBeChecked();
    await expect(page.locator('header').locator('span.tabular-nums')).toHaveText('13%');

    // Test Reset Confirmation: Cancel preserves plan
    await page.getByRole('button', { name: /reset plan & data/i }).click();
    await expect(page.getByText('Reset Study Plan?')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Reset Study Plan?')).not.toBeVisible();
    // Plan is still active
    await expect(page.getByText('CS 201: Data Structures').first()).toBeVisible();

    // Test Reset Confirmation: Confirm clears everything
    await page.getByRole('button', { name: /reset plan & data/i }).click();
    await page.getByRole('button', { name: 'Reset Everything' }).click();

    // Returns to Empty State
    await expect(page.getByText('No active study plan')).toBeVisible();

    // Reload page: empty state persists (localStorage was cleared)
    await page.reload();
    await expect(page.getByText('No active study plan')).toBeVisible();
  });
});
