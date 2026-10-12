import { derive } from '../src/lib/scheduler.js';
import { daysBetween } from '../src/lib/dates.js';

export function blocksTable(state, topics) {
  const topicsById = {};
  topics.forEach((t) => {
    topicsById[t.id] = t.name;
  });

  const numDays = daysBetween(state.exam.planStartDate, state.exam.examDate);
  const table = {};

  for (let d = 0; d < numDays; d++) {
    table[`Day ${d + 1}`] = {};
  }

  state.blocks.forEach((b) => {
    const dayKey = `Day ${b.dayIndex + 1}`;
    const name = topicsById[b.topicId] || b.topicId;
    table[dayKey][name] = (table[dayKey][name] || 0) + b.units / 2; // in hours
  });

  return table;
}

export function assertInvariants(state, todayIndex = 0) {
  const { exam, topics, blocks = [], missedUnitsByDay = {} } = state;
  const numDays = daysBetween(exam.planStartDate, exam.examDate);
  const derived = derive(state, todayIndex);

  // Invariant 1: For every day d >= todayIndex: completed + planned + missed <= dailyUnits
  for (let d = todayIndex; d < numDays; d++) {
    const comp = derived.completedByDay[d] || 0;
    const plan = derived.plannedByDay[d] || 0;
    const miss = missedUnitsByDay[String(d)] || missedUnitsByDay[d] || 0;
    if (comp + plan + miss > exam.dailyUnits) {
      throw new Error(
        `Invariant 1 violated on Day ${d}: comp (${comp}) + plan (${plan}) + miss (${miss}) > dailyUnits (${exam.dailyUnits})`
      );
    }
  }

  // Invariant 3: Mastered topic has no planned blocks with dayIndex >= todayIndex
  topics.forEach((t) => {
    if (t.mastered) {
      const futurePlanned = blocks.filter(
        (b) => b.topicId === t.id && b.status === 'planned' && b.dayIndex >= todayIndex
      );
      if (futurePlanned.length > 0) {
        throw new Error(`Invariant 3 violated: Mastered topic ${t.name} has future planned blocks`);
      }
    }
  });

  // Invariant 4: No topic's plannedFutureUnits exceeds remainingUnits
  topics.forEach((t) => {
    const planned = derived.plannedFutureByTopic[t.id] || 0;
    const remaining = derived.remainingByTopic[t.id] || 0;
    if (planned > remaining) {
      throw new Error(
        `Invariant 4 violated: Topic ${t.name} planned future (${planned}) > remaining (${remaining})`
      );
    }
  });

  // Invariant 5: sum(plannedFutureUnits) == min(N, C) and deficitUnits == max(0, N - C)
  const totalPlannedFuture = Object.values(derived.plannedFutureByTopic).reduce((s, u) => s + u, 0);
  const expectedPlanned = Math.min(derived.totalRemainingUnits, derived.totalAvailableFutureUnits);
  if (totalPlannedFuture !== expectedPlanned) {
    throw new Error(
      `Invariant 5 violated: total planned future (${totalPlannedFuture}) !== min(N, C) (${expectedPlanned})`
    );
  }
  const expectedDeficit = Math.max(0, derived.totalRemainingUnits - derived.totalAvailableFutureUnits);
  if (derived.totalDeficitUnits !== expectedDeficit) {
    throw new Error(
      `Invariant 5 violated: deficitUnits (${derived.totalDeficitUnits}) !== max(0, N - C) (${expectedDeficit})`
    );
  }

  // Invariant 6: All units positive integers
  blocks.forEach((b) => {
    if (!Number.isInteger(b.units) || b.units <= 0) {
      throw new Error(`Invariant 6 violated: Non-positive integer block units: ${b.units}`);
    }
  });

  // Invariant 7: Review buffer > 0 on any day => deficitUnits == 0
  const hasBuffer = Object.values(derived.reviewBuffers).some((b) => b > 0);
  if (hasBuffer && derived.totalDeficitUnits > 0) {
    throw new Error(
      `Invariant 7 violated: Has positive review buffer while deficit is ${derived.totalDeficitUnits}`
    );
  }

  // Invariant 9: No double counting
  topics.forEach((t) => {
    if (!t.mastered) {
      const comp = derived.completedByTopic[t.id] || 0;
      const plan = derived.plannedFutureByTopic[t.id] || 0;
      const unalloc = derived.unallocatedByTopic[t.id] || 0;
      if (comp + plan + unalloc !== Math.max(t.estimatedUnits, comp)) {
        throw new Error(
          `Invariant 9 violated on topic ${t.name}: comp (${comp}) + plan (${plan}) + unalloc (${unalloc}) !== max(est, comp)`
        );
      }
    }
  });

  return true;
}
