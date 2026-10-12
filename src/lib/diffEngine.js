import { formatHours } from './units.js';

/**
 * Compares before and after plan states and derives a structured diff of changes
 * along with user-facing explanation sentences.
 *
 * @param {Object} before - Previous plan state
 * @param {Object} after - Recalculated plan state
 * @param {Object} options - Context options: { event, todayIndex, missedUnits, topicId }
 * @returns {Object} { changes, lines, deficitBeforeUnits, deficitAfterUnits }
 */
export function diffPlans(before, after, { event, todayIndex = 0, missedUnits, topicId, toggledBlockId } = {}) {
  const topics = after.topics || before.topics || [];
  const topicsById = {};
  topics.forEach((t) => {
    topicsById[t.id] = t;
  });

  const numDays = Math.max(
    before.blocks.reduce((max, b) => Math.max(max, b.dayIndex + 1), 0),
    after.blocks.reduce((max, b) => Math.max(max, b.dayIndex + 1), 0),
    todayIndex + 1
  );

  // 1. Build planned block unit maps for d >= todayIndex
  // map: [topicId][dayIndex] -> plannedUnits
  const beforePlanned = {};
  const afterPlanned = {};
  topics.forEach((t) => {
    beforePlanned[t.id] = {};
    afterPlanned[t.id] = {};
    for (let d = todayIndex; d < numDays; d++) {
      beforePlanned[t.id][d] = 0;
      afterPlanned[t.id][d] = 0;
    }
  });

  (before.blocks || []).forEach((b) => {
    if (b.status === 'planned' && b.dayIndex >= todayIndex && beforePlanned[b.topicId]) {
      beforePlanned[b.topicId][b.dayIndex] = (beforePlanned[b.topicId][b.dayIndex] || 0) + b.units;
    }
  });

  (after.blocks || []).forEach((b) => {
    // If block is planned, count it.
    // If event is 'checked' and b.id === toggledBlockId, it was checked off in this step;
    // in before state it was planned on b.dayIndex, so counting it preserves the remaining plan identity.
    const isCounted =
      b.status === 'planned' ||
      (event === 'checked' && toggledBlockId && b.id === toggledBlockId);

    if (isCounted && b.dayIndex >= todayIndex && afterPlanned[b.topicId]) {
      afterPlanned[b.topicId][b.dayIndex] = (afterPlanned[b.topicId][b.dayIndex] || 0) + b.units;
    }
  });

  // Calculate day capacity and review buffers for before & after
  const beforeCapacities = {};
  const afterCapacities = {};
  const beforeBuffers = {};
  const afterBuffers = {};

  const beforeMissed = before.missedUnitsByDay || {};
  const afterMissed = after.missedUnitsByDay || {};

  const beforeCompletedByDay = {};
  const afterCompletedByDay = {};
  for (let d = todayIndex; d < numDays; d++) {
    beforeCompletedByDay[d] = 0;
    afterCompletedByDay[d] = 0;
  }
  (before.blocks || []).forEach((b) => {
    if (b.status === 'completed' && b.dayIndex >= todayIndex) {
      beforeCompletedByDay[b.dayIndex] = (beforeCompletedByDay[b.dayIndex] || 0) + b.units;
    }
  });
  (after.blocks || []).forEach((b) => {
    if (b.status === 'completed' && b.dayIndex >= todayIndex) {
      afterCompletedByDay[b.dayIndex] = (afterCompletedByDay[b.dayIndex] || 0) + b.units;
    }
  });

  for (let d = todayIndex; d < numDays; d++) {
    const dailyU = after.exam?.dailyUnits || before.exam?.dailyUnits || 0;

    const bMiss = beforeMissed[String(d)] || beforeMissed[d] || 0;
    const bCap = Math.max(0, dailyU - bMiss - beforeCompletedByDay[d]);
    beforeCapacities[d] = bCap;

    let bPlannedTotal = 0;
    topics.forEach((t) => {
      bPlannedTotal += beforePlanned[t.id][d] || 0;
    });
    beforeBuffers[d] = Math.max(0, bCap - bPlannedTotal);

    const aMiss = afterMissed[String(d)] || afterMissed[d] || 0;
    const aCap = Math.max(0, dailyU - aMiss - afterCompletedByDay[d]);
    afterCapacities[d] = aCap;

    let aPlannedTotal = 0;
    topics.forEach((t) => {
      aPlannedTotal += afterPlanned[t.id][d] || 0;
    });
    afterBuffers[d] = Math.max(0, aCap - aPlannedTotal);
  }

  // Capacity changes
  const capacityChanges = [];
  for (let d = todayIndex; d < numDays; d++) {
    if (beforeCapacities[d] !== afterCapacities[d]) {
      capacityChanges.push({
        day: d,
        beforeUnits: beforeCapacities[d],
        afterUnits: afterCapacities[d]
      });
    }
  }

  // Calculate unallocated units (risk) and deficit
  const beforeRisk = {};
  const afterRisk = {};
  let deficitBeforeUnits = 0;
  let deficitAfterUnits = 0;

  topics.forEach((t) => {
    // Before need & plan
    const bCompleted = (before.blocks || [])
      .filter((b) => b.topicId === t.id && b.status === 'completed')
      .reduce((s, b) => s + b.units, 0);
    const bRemaining = t.mastered ? 0 : Math.max(0, t.estimatedUnits - bCompleted);
    let bPlannedFuture = 0;
    for (let d = todayIndex; d < numDays; d++) {
      bPlannedFuture += beforePlanned[t.id][d] || 0;
    }
    const bUnalloc = Math.max(0, bRemaining - bPlannedFuture);
    beforeRisk[t.id] = bUnalloc;
    deficitBeforeUnits += bUnalloc;

    // After need & plan
    const aCompleted = (after.blocks || [])
      .filter((b) => b.topicId === t.id && b.status === 'completed')
      .reduce((s, b) => s + b.units, 0);
    const aRemaining = t.mastered ? 0 : Math.max(0, t.estimatedUnits - aCompleted);
    let aPlannedFuture = 0;
    for (let d = todayIndex; d < numDays; d++) {
      aPlannedFuture += afterPlanned[t.id][d] || 0;
    }
    const aUnalloc = Math.max(0, aRemaining - aPlannedFuture);
    afterRisk[t.id] = aUnalloc;
    deficitAfterUnits += aUnalloc;
  });

  // 2. Per-topic changes: pairing removals and additions
  const topicChanges = [];

  topics.forEach((t) => {
    const tid = t.id;
    const removals = []; // [{ day, units }]
    const additions = []; // [{ day, units }]

    for (let d = todayIndex; d < numDays; d++) {
      const bUnits = beforePlanned[tid][d] || 0;
      const aUnits = afterPlanned[tid][d] || 0;
      if (bUnits > aUnits) {
        removals.push({ day: d, units: bUnits - aUnits, initialBefore: bUnits, targetAfter: aUnits });
      } else if (aUnits > bUnits) {
        additions.push({ day: d, units: aUnits - bUnits });
      }
    }

    const moves = [];
    const cuts = [];
    const gains = [];

    // Earliest-day-first matching of removals to additions
    let rIdx = 0;
    let aIdx = 0;

    while (rIdx < removals.length && aIdx < additions.length) {
      const r = removals[rIdx];
      const a = additions[aIdx];
      const matchUnits = Math.min(r.units, a.units);

      moves.push({
        fromDay: r.day,
        toDay: a.day,
        units: matchUnits
      });

      r.units -= matchUnits;
      a.units -= matchUnits;

      if (r.units === 0) rIdx++;
      if (a.units === 0) aIdx++;
    }

    // Leftover removals become cuts
    while (rIdx < removals.length) {
      const r = removals[rIdx];
      if (r.units > 0) {
        // beforeUnits for the cut is what remained after any moves: r.targetAfter + r.units
        cuts.push({
          day: r.day,
          beforeUnits: r.targetAfter + r.units,
          afterUnits: r.targetAfter,
          cutUnits: r.units
        });
      }
      rIdx++;
    }

    // Leftover additions become gains
    while (aIdx < additions.length) {
      const a = additions[aIdx];
      if (a.units > 0) {
        gains.push({
          day: a.day,
          units: a.units
        });
      }
      aIdx++;
    }

    const riskBeforeUnits = beforeRisk[tid] || 0;
    const riskAfterUnits = afterRisk[tid] || 0;

    const totalActivityUnits =
      moves.reduce((s, m) => s + m.units, 0) +
      cuts.reduce((s, c) => s + c.cutUnits, 0) +
      gains.reduce((s, g) => s + g.units, 0) +
      Math.abs(riskAfterUnits - riskBeforeUnits);

    if (totalActivityUnits > 0 || moves.length > 0 || cuts.length > 0 || gains.length > 0) {
      topicChanges.push({
        topicId: tid,
        topicName: t.name,
        moves,
        cuts,
        gains,
        riskBeforeUnits,
        riskAfterUnits,
        totalActivityUnits
      });
    }
  });

  // Buffer changes
  const bufferChanges = [];
  for (let d = todayIndex; d < numDays; d++) {
    if (beforeBuffers[d] !== afterBuffers[d]) {
      bufferChanges.push({
        day: d,
        beforeUnits: beforeBuffers[d],
        afterUnits: afterBuffers[d]
      });
    }
  }

  // Structured changes object
  const changes = {
    capacity: capacityChanges,
    topics: topicChanges,
    buffers: bufferChanges,
    deficit: {
      beforeUnits: deficitBeforeUnits,
      afterUnits: deficitAfterUnits
    }
  };

  // 3. Sentence generation
  const lines = [];

  // Event line
  if (event === 'missed') {
    const lostH = formatHours(missedUnits || 0);
    const todayFreeU = afterCapacities[todayIndex] || 0;
    if (todayFreeU === 0) {
      lines.push(`You lost ${lostH} today, so Day ${todayIndex + 1} has no study time left.`);
    } else {
      lines.push(`You lost ${lostH} today, so Day ${todayIndex + 1} has ${formatHours(todayFreeU)} of study time left.`);
    }
  } else if (event === 'mastered') {
    const t = topicsById[topicId];
    const freedU = beforePlanned[topicId]
      ? Object.values(beforePlanned[topicId]).reduce((s, u) => s + u, 0)
      : 0;
    lines.push(`${t?.name || 'Topic'} marked mastered — ${formatHours(freedU)} freed up.`);
  } else if (event === 'unmastered') {
    const t = topicsById[topicId];
    lines.push(`${t?.name || 'Topic'} is back in the plan — needs ${formatHours(t?.estimatedUnits || 0)}.`);
  } else if (event === 'dayAdvanced') {
    lines.push(`Study time planned before today wasn't checked off, so it was rescheduled.`);
  }

  // Topic lines sorted by totalActivityUnits descending
  topicChanges.sort((a, b) => b.totalActivityUnits - a.totalActivityUnits);

  topicChanges.forEach((tc) => {
    // Moves
    tc.moves.forEach((m) => {
      lines.push(`${tc.topicName}: ${formatHours(m.units)} moved from Day ${m.fromDay + 1} to Day ${m.toDay + 1}.`);
    });

    // Cuts
    tc.cuts.forEach((c) => {
      lines.push(
        `${tc.topicName}: cut from ${formatHours(c.beforeUnits)} to ${formatHours(c.afterUnits)} on Day ${c.day + 1}.`
      );
    });

    // Gains
    tc.gains.forEach((g) => {
      lines.push(`${tc.topicName}: +${formatHours(g.units)} on Day ${g.day + 1}.`);
    });
  });

  // Buffer lines
  bufferChanges.forEach((b) => {
    lines.push(
      `Day ${b.day + 1} review buffer: ${formatHours(b.beforeUnits)} → ${formatHours(b.afterUnits)}.`
    );
  });

  // Risk lines
  topicChanges.forEach((tc) => {
    if (tc.riskBeforeUnits === 0 && tc.riskAfterUnits > 0) {
      lines.push(`${tc.topicName} is now at risk — ${formatHours(tc.riskAfterUnits)} won't fit.`);
    } else if (tc.riskBeforeUnits > 0 && tc.riskAfterUnits === 0) {
      lines.push(`${tc.topicName} is no longer at risk.`);
    }
  });

  // Shortfall line
  if (deficitBeforeUnits !== deficitAfterUnits) {
    if (deficitBeforeUnits === 0 && deficitAfterUnits > 0) {
      lines.push(`Shortfall grew from ${formatHours(deficitBeforeUnits)} to ${formatHours(deficitAfterUnits)}.`);
    } else if (deficitBeforeUnits > 0 && deficitAfterUnits > deficitBeforeUnits) {
      lines.push(`Shortfall grew from ${formatHours(deficitBeforeUnits)} to ${formatHours(deficitAfterUnits)}.`);
    } else if (deficitAfterUnits === 0) {
      lines.push(`Everything fits again.`);
    } else if (deficitAfterUnits < deficitBeforeUnits) {
      lines.push(`Shortfall shrank from ${formatHours(deficitBeforeUnits)} to ${formatHours(deficitAfterUnits)}.`);
    }
  }

  if (lines.length === 0) {
    lines.push("Your remaining schedule didn't need to change.");
  }

  return {
    changes,
    lines,
    deficitBeforeUnits,
    deficitAfterUnits
  };
}
