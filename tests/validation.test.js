import { describe, it, expect } from 'vitest';
import { validateSetup, validateMissed } from '../src/lib/validation.js';

describe('Validation Engine', () => {
  const baseToday = '2026-10-12';

  const validForm = {
    subject: 'CS 201: Data Structures',
    examDate: '2026-10-16', // 4 days later
    dailyHours: 4,
    topics: [
      { name: 'Trees', confidence: 1, importance: 'high', estimatedHours: 5 },
      { name: 'Graphs', confidence: 2, importance: 'high', estimatedHours: 5 },
      { name: 'Sorting', confidence: 3, importance: 'medium', estimatedHours: 3 },
      { name: 'Arrays', confidence: 4, importance: 'medium', estimatedHours: 2 }
    ]
  };

  it('accepts a fully valid exam setup', () => {
    const res = validateSetup(validForm, baseToday);
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual({});
  });

  it('rejects empty and overlong subject names', () => {
    expect(validateSetup({ ...validForm, subject: '   ' }, baseToday).ok).toBe(false);
    expect(validateSetup({ ...validForm, subject: 'A'.repeat(61) }, baseToday).ok).toBe(false);
  });

  it('rejects exam dates that are today, in the past, or beyond 14 days', () => {
    // today
    expect(validateSetup({ ...validForm, examDate: '2026-10-12' }, baseToday).ok).toBe(false);
    // past
    expect(validateSetup({ ...validForm, examDate: '2026-10-11' }, baseToday).ok).toBe(false);
    // exactly 14 days
    expect(validateSetup({ ...validForm, examDate: '2026-10-26' }, baseToday).ok).toBe(true);
    // 15 days
    expect(validateSetup({ ...validForm, examDate: '2026-10-27' }, baseToday).ok).toBe(false);
  });

  it('enforces 0.5-hour increments and limits on dailyHours', () => {
    expect(validateSetup({ ...validForm, dailyHours: 0.25 }, baseToday).ok).toBe(false);
    expect(validateSetup({ ...validForm, dailyHours: 0.5 }, baseToday).ok).toBe(true);
    expect(validateSetup({ ...validForm, dailyHours: 12 }, baseToday).ok).toBe(true);
    expect(validateSetup({ ...validForm, dailyHours: 12.5 }, baseToday).ok).toBe(false);
  });

  it('enforces 3 to 6 topics and rejects duplicates', () => {
    // 2 topics
    const twoTopics = { ...validForm, topics: validForm.topics.slice(0, 2) };
    expect(validateSetup(twoTopics, baseToday).ok).toBe(false);

    // duplicate topic names (case-insensitive)
    const dupTopics = {
      ...validForm,
      topics: [
        { name: 'Trees', confidence: 1, importance: 'high', estimatedHours: 5 },
        { name: 'trees', confidence: 2, importance: 'high', estimatedHours: 5 },
        { name: 'Sorting', confidence: 3, importance: 'medium', estimatedHours: 3 }
      ]
    };
    const dupRes = validateSetup(dupTopics, baseToday);
    expect(dupRes.ok).toBe(false);
    expect(dupRes.errors.topicRows[1].name).toMatch(/unique/i);
  });

  it('validates missed hours against remaining free units', () => {
    // 4 free units = 2.0 free hours
    expect(validateMissed(1.5, 4).ok).toBe(true);
    expect(validateMissed(2.0, 4).ok).toBe(true);
    expect(validateMissed(2.5, 4).ok).toBe(false);
    expect(validateMissed(0.25, 4).ok).toBe(false);
    expect(validateMissed(-1, 4).ok).toBe(false);
  });
});
