import { daysBetween } from './dates.js';

export const STORAGE_KEY = 'exampilot:v1';
export const CORRUPT_KEY = 'exampilot:v1:corrupt';

/**
 * Validates whether an object conforms to the valid ExamPilot PlanState data model.
 *
 * Rules from spec.md:
 * - version === 1
 * - Required fields and types
 * - Valid enums
 * - Positive integer units
 * - Every block's topicId exists in topics
 * - dayIndex in [0, numDays)
 * - Invariant 1: for every day, completed + planned + missed <= dailyUnits
 * - examDate > planStartDate
 */
export function isValidPlanState(state) {
  if (!state || typeof state !== 'object') return false;
  if (state.version !== 1) return false;

  // Exam object
  const exam = state.exam;
  if (!exam || typeof exam !== 'object') return false;
  if (typeof exam.subject !== 'string' || !exam.subject.trim()) return false;
  if (typeof exam.examDate !== 'string' || typeof exam.planStartDate !== 'string') return false;

  const numDays = daysBetween(exam.planStartDate, exam.examDate);
  if (isNaN(numDays) || numDays <= 0) return false;

  if (!Number.isInteger(exam.dailyUnits) || exam.dailyUnits <= 0) return false;

  // Topics
  const topics = state.topics;
  if (!Array.isArray(topics) || topics.length < 3 || topics.length > 6) return false;

  const topicIds = new Set();
  for (const t of topics) {
    if (!t || typeof t !== 'object') return false;
    if (typeof t.id !== 'string' || !t.id) return false;
    if (typeof t.name !== 'string' || !t.name.trim()) return false;
    if (!Number.isInteger(t.confidence) || t.confidence < 1 || t.confidence > 5) return false;
    if (!['high', 'medium', 'low'].includes(t.importance)) return false;
    if (!Number.isInteger(t.estimatedUnits) || t.estimatedUnits <= 0) return false;
    if (typeof t.mastered !== 'boolean') return false;
    topicIds.add(t.id);
  }

  // Blocks
  const blocks = state.blocks;
  if (!Array.isArray(blocks)) return false;

  const dayCompleted = {};
  const dayPlanned = {};
  for (let d = 0; d < numDays; d++) {
    dayCompleted[d] = 0;
    dayPlanned[d] = 0;
  }

  for (const b of blocks) {
    if (!b || typeof b !== 'object') return false;
    if (!Number.isInteger(b.id) && typeof b.id !== 'string') return false;
    if (!topicIds.has(b.topicId)) return false;
    if (!Number.isInteger(b.dayIndex) || b.dayIndex < 0 || b.dayIndex >= numDays) return false;
    if (!Number.isInteger(b.units) || b.units <= 0) return false;
    if (!['planned', 'completed'].includes(b.status)) return false;

    if (b.status === 'completed') {
      dayCompleted[b.dayIndex] += b.units;
    } else {
      dayPlanned[b.dayIndex] += b.units;
    }
  }

  // Missed units by day
  const missedUnitsByDay = state.missedUnitsByDay || {};
  if (typeof missedUnitsByDay !== 'object') return false;

  for (const [key, val] of Object.entries(missedUnitsByDay)) {
    const day = Number(key);
    if (!Number.isInteger(day) || day < 0 || day >= numDays) return false;
    if (!Number.isInteger(val) || val < 0) return false;
  }

  // Invariant 1 check: completed + planned + missed <= dailyUnits
  for (let d = 0; d < numDays; d++) {
    const missed = missedUnitsByDay[String(d)] || missedUnitsByDay[d] || 0;
    const total = dayCompleted[d] + dayPlanned[d] + missed;
    if (total > exam.dailyUnits) {
      return false;
    }
  }

  return true;
}

/**
 * Saves plan state to localStorage.
 * Non-blocking on failure (returns boolean ok).
 */
export function save(state) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("ExamPilot: couldn't save to localStorage", err);
    return false;
  }
}

/**
 * Loads plan state from localStorage with validation and corruption handling.
 *
 * @returns {Object} { state: Object|null, notice: string|null }
 */
export function load() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { state: null, notice: null };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: null, notice: null };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON parse failed
      window.localStorage.setItem(CORRUPT_KEY, raw);
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        state: null,
        notice: "Your saved plan couldn't be read, so ExamPilot started fresh."
      };
    }

    if (!isValidPlanState(parsed)) {
      window.localStorage.setItem(CORRUPT_KEY, raw);
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        state: null,
        notice: "Your saved plan couldn't be read, so ExamPilot started fresh."
      };
    }

    return { state: parsed, notice: null };
  } catch (err) {
    console.warn('ExamPilot: error reading localStorage', err);
    return { state: null, notice: null };
  }
}

/**
 * Clears main saved plan and corrupt backup from localStorage.
 */
export function clear() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(CORRUPT_KEY);
    }
  } catch (err) {
    console.warn('ExamPilot: error clearing localStorage', err);
  }
}
