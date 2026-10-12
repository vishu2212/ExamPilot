import { describe, it, expect } from 'vitest';
import {
  hoursToUnits,
  unitsToHours,
  formatHours,
  isHalfHourMultiple
} from '../src/lib/units.js';

describe('units utility', () => {
  it('converts hours to units and back correctly', () => {
    expect(hoursToUnits(0.5)).toBe(1);
    expect(hoursToUnits(1)).toBe(2);
    expect(hoursToUnits(2.5)).toBe(5);
    expect(hoursToUnits(4)).toBe(8);

    expect(unitsToHours(1)).toBe(0.5);
    expect(unitsToHours(2)).toBe(1);
    expect(unitsToHours(5)).toBe(2.5);
    expect(unitsToHours(8)).toBe(4);
  });

  it('formats hours accurately with appropriate suffixes', () => {
    expect(formatHours(1)).toBe('0.5h');
    expect(formatHours(2)).toBe('1h');
    expect(formatHours(3)).toBe('1.5h');
    expect(formatHours(5)).toBe('2.5h');
    expect(formatHours(0)).toBe('0h');
  });

  it('validates half-hour multiples accurately', () => {
    expect(isHalfHourMultiple(0.5)).toBe(true);
    expect(isHalfHourMultiple(1.0)).toBe(true);
    expect(isHalfHourMultiple(1.5)).toBe(true);
    expect(isHalfHourMultiple(2.0)).toBe(true);

    expect(isHalfHourMultiple(0.25)).toBe(false);
    expect(isHalfHourMultiple(1.15)).toBe(false);
    expect(isHalfHourMultiple(3.33)).toBe(false);
  });
});
