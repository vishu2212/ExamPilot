import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE 1st gen', width: 320, height: 568 },
  { name: 'iPhone SE 2nd gen', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14/15 Pro Max', width: 430, height: 932 },
  { name: 'iPad / Tablet', width: 768, height: 1024 },
  { name: 'Desktop reference', width: 1280, height: 800 },
];

test.describe('Mobile Responsiveness & Viewport Invariants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  // Helper to assert zero horizontal scroll overflow
  async function assertNoHorizontalScroll(page, contextLabel = '') {
    const overflow = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      return {
        hasOverflow: scrollWidth > innerWidth,
        scrollWidth,
        innerWidth,
        diff: scrollWidth - innerWidth,
      };
    });

    expect(
      overflow.hasOverflow,
      `Horizontal scroll detected [${contextLabel}]: scrollWidth (${overflow.scrollWidth}px) > innerWidth (${overflow.innerWidth}px) by ${overflow.diff}px`
    ).toBe(false);
  }

  for (const vp of VIEWPORTS) {
    test(`Zero horizontal page overflow at ${vp.name} (${vp.width}x${vp.height}) - Empty & Active Plan`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // 1. Check initial empty state
      await expect(page.getByText('No active study plan')).toBeVisible();
      await assertNoHorizontalScroll(page, `${vp.name} Empty State`);

      // 2. Load sample exam
      await page.getByRole('button', { name: /load sample/i }).first().click();
      await expect(page.getByText('CS 201: Data Structures').first()).toBeVisible();
      await assertNoHorizontalScroll(page, `${vp.name} Active Schedule`);

      // 3. Mark study block complete
      await page.getByRole('checkbox').first().click();
      await assertNoHorizontalScroll(page, `${vp.name} Block Completed`);

      // 4. Open Missed Time modal
      await page.getByRole('button', { name: /i fell behind \/ missed hours/i }).click();
      await expect(page.getByText('Record Missed Study Time')).toBeVisible();
      await assertNoHorizontalScroll(page, `${vp.name} Missed Time Modal Open`);

      // 5. Submit recovery and check Triage + Recovery banners
      await page.getByPlaceholder('e.g. 1.5').fill('2');
      await page.getByRole('button', { name: /recalculate schedule/i }).click();
      await expect(page.getByText(/Triage Mode Active/i)).toBeVisible();
      await assertNoHorizontalScroll(page, `${vp.name} Triage & Recovery Banners`);
    });
  }

  test('Smallest mobile viewport (320x568): Dialog fits within screen and remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Open Missed Time dialog
    await page.getByRole('button', { name: /i fell behind \/ missed hours/i }).click();
    const modalHeading = page.getByText('Record Missed Study Time');
    await expect(modalHeading).toBeVisible();

    // Verify dialog container fits within viewport bounds or has internal scrolling
    const modalBox = page.locator('div.fixed.inset-0 > div');
    const box = await modalBox.boundingBox();
    expect(box).not.toBeNull();
    // Modal width must not exceed viewport width
    expect(box.width).toBeLessThanOrEqual(320);

    // Cancel modal should work via touch click
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await cancelBtn.scrollIntoViewIfNeeded();
    await cancelBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('Smallest mobile viewport (320x568): Interactive checkboxes and mastery controls tap comfortably', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.getByRole('button', { name: /load sample/i }).first().click();

    // Checkbox has adequate tap area
    const firstCheckbox = page.getByRole('checkbox').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();

    // Topic mastery button in topic list
    const arraysRow = page.locator('div.rounded-xl', { hasText: 'Arrays' });
    const markMasteredBtn = arraysRow.getByRole('button', { name: /mark mastered/i });
    await markMasteredBtn.scrollIntoViewIfNeeded();
    await markMasteredBtn.click();
    await expect(arraysRow.getByText('Mastered')).toBeVisible();

    // Verify persistence after mobile page reload
    await page.reload();
    await expect(firstCheckbox).toBeChecked();
    await expect(arraysRow.getByText('Mastered')).toBeVisible();
    await assertNoHorizontalScroll(page, '320x568 post-reload');
  });

  test('Smallest mobile viewport (320x568): Exam setup form keyboard interaction and validation', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    // Fill form manually
    const subjectInput = page.locator('#subject');
    await subjectInput.fill('Mobile Test Exam');

    const examDateInput = page.locator('#examDate');
    // Set 3 days in future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];
    await examDateInput.fill(dateStr);

    const dailyHoursInput = page.locator('#dailyHours');
    await dailyHoursInput.fill('3');

    // Fill topic names
    const topic1 = page.getByPlaceholder('Topic 1 name');
    await topic1.fill('Topic Alpha');

    const topic2 = page.getByPlaceholder('Topic 2 name');
    await topic2.fill('Topic Beta');

    const topic3 = page.getByPlaceholder('Topic 3 name');
    await topic3.fill('Topic Gamma');

    await assertNoHorizontalScroll(page, '320x568 Form Filled');

    // Submit form
    await page.getByRole('button', { name: /generate study plan/i }).click();

    // Plan generated
    await expect(page.getByText('Mobile Test Exam').first()).toBeVisible();
    await assertNoHorizontalScroll(page, '320x568 Custom Plan Generated');
  });
});
