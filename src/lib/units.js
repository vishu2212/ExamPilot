/**
 * Time units: 1 unit = 30 minutes (0.5 hours).
 * All scheduler and storage math operates on integer units.
 */

export function hoursToUnits(hours) {
  if (typeof hours !== 'number' || isNaN(hours)) return 0;
  return Math.round(hours * 2);
}

export function unitsToHours(units) {
  if (typeof units !== 'number' || isNaN(units)) return 0;
  return units / 2;
}

export function formatHours(units) {
  const h = unitsToHours(units);
  return `${h}h`;
}

export function isHalfHourMultiple(hours) {
  if (typeof hours !== 'number' || isNaN(hours) || hours <= 0) return false;
  return Number.isInteger(hours * 2);
}
