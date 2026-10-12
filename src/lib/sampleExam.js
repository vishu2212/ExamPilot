import { addDays } from './dates.js';
import { hoursToUnits } from './units.js';

export function buildSampleSetup(todayDateStr) {
  return {
    subject: 'CS 201: Data Structures',
    examDate: addDays(todayDateStr, 4),
    dailyHours: 4,
    topics: [
      {
        id: 't1',
        name: 'Trees',
        confidence: 1,
        importance: 'high',
        estimatedHours: 5,
        estimatedUnits: hoursToUnits(5),
        mastered: false
      },
      {
        id: 't2',
        name: 'Graphs',
        confidence: 2,
        importance: 'high',
        estimatedHours: 5,
        estimatedUnits: hoursToUnits(5),
        mastered: false
      },
      {
        id: 't3',
        name: 'Sorting',
        confidence: 3,
        importance: 'medium',
        estimatedHours: 3,
        estimatedUnits: hoursToUnits(3),
        mastered: false
      },
      {
        id: 't4',
        name: 'Arrays',
        confidence: 4,
        importance: 'medium',
        estimatedHours: 2,
        estimatedUnits: hoursToUnits(2),
        mastered: false
      }
    ]
  };
}
