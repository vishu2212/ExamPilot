import { daysBetween } from './dates.js';
import { isHalfHourMultiple } from './units.js';

export function validateSetup(form, todayDateStr) {
  const errors = {};

  if (!form || typeof form !== 'object') {
    return { ok: false, errors: { form: 'Invalid form data' } };
  }

  // Subject
  const subject = (form.subject || '').trim();
  if (!subject) {
    errors.subject = 'Subject name is required';
  } else if (subject.length > 60) {
    errors.subject = 'Subject name must be 60 characters or less';
  }

  // Exam Date
  if (!form.examDate) {
    errors.examDate = 'Exam date is required';
  } else {
    const days = daysBetween(todayDateStr, form.examDate);
    if (isNaN(days)) {
      errors.examDate = 'Invalid exam date';
    } else if (days < 1) {
      errors.examDate = 'Exam date must be at least 1 day in the future';
    } else if (days > 14) {
      errors.examDate = 'Exam date must be within 14 days';
    }
  }

  // Daily Hours
  const dailyHours = Number(form.dailyHours);
  if (isNaN(dailyHours) || dailyHours < 0.5 || dailyHours > 12) {
    errors.dailyHours = 'Daily study hours must be between 0.5 and 12';
  } else if (!isHalfHourMultiple(dailyHours)) {
    errors.dailyHours = 'Daily study hours must be in 0.5-hour increments (e.g. 2, 2.5, 3)';
  }

  // Topics: 3–6 rows
  const topics = Array.isArray(form.topics) ? form.topics : [];
  if (topics.length < 3) {
    errors.topics = 'Please add at least 3 topics (max 6)';
  } else if (topics.length > 6) {
    errors.topics = 'Maximum of 6 topics allowed for focused planning';
  } else {
    const seenNames = new Set();
    const topicErrors = [];

    topics.forEach((t, i) => {
      const tErr = {};
      const name = (t.name || '').trim();
      if (!name) {
        tErr.name = 'Topic name is required';
      } else if (name.length > 40) {
        tErr.name = 'Max 40 characters';
      } else if (seenNames.has(name.toLowerCase())) {
        tErr.name = 'Topic names must be unique';
      } else {
        seenNames.add(name.toLowerCase());
      }

      const conf = Number(t.confidence);
      if (!Number.isInteger(conf) || conf < 1 || conf > 5) {
        tErr.confidence = 'Confidence must be 1 to 5';
      }

      if (!['high', 'medium', 'low'].includes(t.importance)) {
        tErr.importance = 'Importance must be High, Medium, or Low';
      }

      const est = Number(t.estimatedHours);
      if (isNaN(est) || est < 0.5 || est > 20) {
        tErr.estimatedHours = 'Estimated hours must be between 0.5 and 20';
      } else if (!isHalfHourMultiple(est)) {
        tErr.estimatedHours = 'Must be in 0.5-hour increments';
      }

      if (Object.keys(tErr).length > 0) {
        topicErrors[i] = tErr;
      }
    });

    if (topicErrors.length > 0) {
      errors.topicRows = topicErrors;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}

export function validateMissed(hours, todayFreeUnits) {
  const h = Number(hours);
  if (isNaN(h) || h <= 0) {
    return { ok: false, error: 'Enter a positive number of hours' };
  }
  if (!isHalfHourMultiple(h)) {
    return { ok: false, error: 'Must be in 0.5-hour increments (e.g. 1.0, 1.5, 2.0)' };
  }
  const maxHours = todayFreeUnits / 2;
  if (h > maxHours) {
    return { ok: false, error: `Cannot miss more than ${maxHours}h (remaining free time today)` };
  }
  return { ok: true, units: Math.round(h * 2) };
}
