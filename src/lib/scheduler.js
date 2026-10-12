import { daysBetween } from './dates.js';
import { hoursToUnits } from './units.js';

export function getImportanceWeight(importance) {
  switch ((importance || '').toLowerCase()) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 1;
  }
}

export function priority(topic) {
  const weight = getImportanceWeight(topic.importance);
  const conf = Math.max(1, Math.min(5, Number(topic.confidence) || 3));
  return weight * (6 - conf); // Range: 1..15
}

export function rankTopics(topics) {
  return [...topics]
    .map((t, idx) => ({ ...t, originalIndex: idx }))
    .sort((a, b) => {
      const priA = priority(a);
      const priB = priority(b);
      if (priB !== priA) return priB - priA; // Higher priority first
      if (a.confidence !== b.confidence) return a.confidence - b.confidence; // Lower confidence first
      return a.originalIndex - b.originalIndex; // Original list order
    });
}

/**
 * Calculates all derived values from PlanState.
 * Never stores deficit or at-risk values; they are always derived.
 */
export function derive(state, todayIndex = 0) {
  const { exam, topics, blocks = [], missedUnitsByDay = {} } = state;
  const numDays = daysBetween(exam.planStartDate, exam.examDate);

  // Completed units per topic
  const completedByTopic = {};
  topics.forEach((t) => {
    completedByTopic[t.id] = 0;
  });

  // Completed units per day
  const completedByDay = {};
  for (let d = 0; d < numDays; d++) {
    completedByDay[d] = 0;
  }

  // Planned future units per topic
  const plannedFutureByTopic = {};
  topics.forEach((t) => {
    plannedFutureByTopic[t.id] = 0;
  });

  // Planned units per day
  const plannedByDay = {};
  for (let d = 0; d < numDays; d++) {
    plannedByDay[d] = 0;
  }

  blocks.forEach((b) => {
    if (b.status === 'completed') {
      completedByTopic[b.topicId] = (completedByTopic[b.topicId] || 0) + b.units;
      if (b.dayIndex >= 0 && b.dayIndex < numDays) {
        completedByDay[b.dayIndex] = (completedByDay[b.dayIndex] || 0) + b.units;
      }
    } else if (b.status === 'planned') {
      if (b.dayIndex >= todayIndex) {
        plannedFutureByTopic[b.topicId] = (plannedFutureByTopic[b.topicId] || 0) + b.units;
      }
      if (b.dayIndex >= 0 && b.dayIndex < numDays) {
        plannedByDay[b.dayIndex] = (plannedByDay[b.dayIndex] || 0) + b.units;
      }
    }
  });

  // Remaining units per topic
  const remainingByTopic = {};
  const unallocatedByTopic = {};
  const atRiskByTopic = {};

  let totalCompletedUnits = 0;
  let totalRemainingUnits = 0;
  let totalDeficitUnits = 0;

  topics.forEach((t) => {
    const comp = completedByTopic[t.id] || 0;
    totalCompletedUnits += comp;

    const rem = t.mastered ? 0 : Math.max(0, t.estimatedUnits - comp);
    remainingByTopic[t.id] = rem;
    totalRemainingUnits += rem;

    const planned = plannedFutureByTopic[t.id] || 0;
    const unalloc = Math.max(0, rem - planned);
    unallocatedByTopic[t.id] = unalloc;
    atRiskByTopic[t.id] = unalloc > 0;
    totalDeficitUnits += unalloc;
  });

  // Day capacity & Review buffers
  const dayCapacities = {};
  const reviewBuffers = {};
  let totalAvailableFutureUnits = 0;

  for (let d = 0; d < numDays; d++) {
    if (d < todayIndex) {
      dayCapacities[d] = 0;
      reviewBuffers[d] = 0;
    } else {
      const missed = missedUnitsByDay[String(d)] || missedUnitsByDay[d] || 0;
      const completedOnDay = completedByDay[d] || 0;
      const cap = Math.max(0, exam.dailyUnits - missed - completedOnDay);
      dayCapacities[d] = cap;
      totalAvailableFutureUnits += cap;

      const plannedOnDay = plannedByDay[d] || 0;
      reviewBuffers[d] = Math.max(0, cap - plannedOnDay);
    }
  }

  const denominator = totalCompletedUnits + totalRemainingUnits;
  const progressPercent = denominator > 0 ? (totalCompletedUnits / denominator) * 100 : 100;

  return {
    numDays,
    completedByTopic,
    remainingByTopic,
    plannedFutureByTopic,
    unallocatedByTopic,
    atRiskByTopic,
    dayCapacities,
    reviewBuffers,
    completedByDay,
    plannedByDay,
    totalCompletedUnits,
    totalRemainingUnits,
    totalAvailableFutureUnits,
    totalDeficitUnits,
    isTriage: totalDeficitUnits > 0,
    progressPercent
  };
}

/**
 * Computes integer budgets for active topics based on capacity.
 * Enforces starvation floor (soft) and priority fill.
 */
export function computeBudgets(activeTopics, capacityUnits) {
  const budgets = {};
  activeTopics.forEach((t) => {
    budgets[t.id] = 0;
  });

  const totalNeeded = activeTopics.reduce((sum, t) => sum + t.remainingUnits, 0);

  // If fits completely
  if (totalNeeded <= capacityUnits) {
    activeTopics.forEach((t) => {
      budgets[t.id] = t.remainingUnits;
    });
    return budgets;
  }

  // Triage mode
  let capacityLeft = capacityUnits;
  const ranked = rankTopics(activeTopics);

  // 1. Soft Starvation floor: min(remainingUnits, 2, capacityLeft)
  for (const topic of ranked) {
    if (capacityLeft <= 0) break;
    const floor = Math.min(topic.remainingUnits, 2, capacityLeft);
    budgets[topic.id] = floor;
    capacityLeft -= floor;
  }

  // 2. Priority fill: 1 unit at a time to highest priority score
  while (capacityLeft > 0) {
    const eligible = ranked.filter((t) => budgets[t.id] < t.remainingUnits);
    if (eligible.length === 0) break;

    let bestTopic = eligible[0];
    let bestScore = -1;

    for (const t of eligible) {
      const pri = priority(t);
      const ratio = 1 - budgets[t.id] / t.remainingUnits;
      const score = pri * ratio;
      if (score > bestScore) {
        bestScore = score;
        bestTopic = t;
      }
    }

    budgets[bestTopic.id] += 1;
    capacityLeft -= 1;
  }

  return budgets;
}

/**
 * Places topic budgets onto days d >= startDayIndex.
 * Enforces:
 * - Pass 1: max 4 units (2h) per topic per day (including frozen units on that day)
 * - Pass 2: fill any remaining day capacity in priority rank order
 */
export function placeBudgets(
  budgets,
  dayCapacities,
  frozenBlocksByDay,
  rankedTopics,
  startDayIndex,
  numDays,
  startNextId = 1
) {
  const remainingBudget = { ...budgets };
  const newBlocks = [];
  let nextIdCounter = startNextId;

  // Day by day from startDayIndex forward
  for (let d = startDayIndex; d < numDays; d++) {
    let dayRoom = dayCapacities[d] || 0;
    if (dayRoom <= 0) continue;

    const frozenOnDay = frozenBlocksByDay[d] || [];
    const frozenUnitsByTopic = {};
    frozenOnDay.forEach((b) => {
      frozenUnitsByTopic[b.topicId] = (frozenUnitsByTopic[b.topicId] || 0) + b.units;
    });

    const dayAllocations = {}; // topicId -> units placed today

    // Pass 1: Up to 4 units (2h) per topic per day
    for (const topic of rankedTopics) {
      if (dayRoom <= 0) break;
      const budgetLeft = remainingBudget[topic.id] || 0;
      if (budgetLeft <= 0) continue;

      const frozenAlready = frozenUnitsByTopic[topic.id] || 0;
      const maxPass1 = Math.max(0, 4 - frozenAlready);
      const give = Math.min(budgetLeft, maxPass1, dayRoom);

      if (give > 0) {
        dayAllocations[topic.id] = (dayAllocations[topic.id] || 0) + give;
        remainingBudget[topic.id] -= give;
        dayRoom -= give;
      }
    }

    // Pass 2: Fill remaining day capacity ignoring 2h soft cap
    if (dayRoom > 0) {
      for (const topic of rankedTopics) {
        if (dayRoom <= 0) break;
        const budgetLeft = remainingBudget[topic.id] || 0;
        if (budgetLeft <= 0) continue;

        const give = Math.min(budgetLeft, dayRoom);
        if (give > 0) {
          dayAllocations[topic.id] = (dayAllocations[topic.id] || 0) + give;
          remainingBudget[topic.id] -= give;
          dayRoom -= give;
        }
      }
    }

    // Create block objects for today
    for (const topic of rankedTopics) {
      const units = dayAllocations[topic.id];
      if (units && units > 0) {
        newBlocks.push({
          id: `b${nextIdCounter++}`,
          dayIndex: d,
          topicId: topic.id,
          units,
          status: 'planned'
        });
      }
    }
  }

  return { newBlocks, nextIdCounter };
}

/**
 * Generates a fresh plan from setup data.
 */
export function generatePlan(setup, todayDateStr) {
  const planStartDate = todayDateStr;
  const numDays = daysBetween(planStartDate, setup.examDate);
  const dailyUnits = hoursToUnits(setup.dailyHours);

  const topics = setup.topics.map((t, idx) => ({
    id: t.id || `t${idx + 1}`,
    name: t.name.trim(),
    confidence: Number(t.confidence),
    importance: t.importance.toLowerCase(),
    estimatedHours: Number(t.estimatedHours),
    estimatedUnits: hoursToUnits(Number(t.estimatedHours)),
    mastered: false
  }));

  const activeTopics = topics.map((t) => ({
    ...t,
    remainingUnits: t.estimatedUnits
  }));

  const totalCapacity = numDays * dailyUnits;
  const dayCapacities = {};
  for (let d = 0; d < numDays; d++) {
    dayCapacities[d] = dailyUnits;
  }

  const budgets = computeBudgets(activeTopics, totalCapacity);
  const ranked = rankTopics(topics);

  const { newBlocks, nextIdCounter } = placeBudgets(
    budgets,
    dayCapacities,
    {},
    ranked,
    0,
    numDays,
    1
  );

  return {
    version: 1,
    exam: {
      subject: setup.subject.trim(),
      examDate: setup.examDate,
      planStartDate,
      dailyUnits
    },
    topics,
    blocks: newBlocks,
    missedUnitsByDay: {},
    lastScheduledDayIndex: 0,
    nextId: nextIdCounter,
    lastChange: null
  };
}

/**
 * Recalculates remaining future blocks while keeping past & completed blocks frozen.
 */
export function recalculate(state, todayIndex = 0) {
  const { exam, topics, blocks = [], missedUnitsByDay = {}, nextId = 1 } = state;
  const numDays = daysBetween(exam.planStartDate, exam.examDate);

  // Step 1: Freeze completed blocks and past blocks
  const frozenBlocks = blocks.filter(
    (b) => b.status === 'completed' || b.dayIndex < todayIndex
  );

  // Derive current status with frozen blocks
  const interimState = {
    ...state,
    blocks: frozenBlocks
  };
  const derived = derive(interimState, todayIndex);

  // Step 2: Active topics needing time
  const activeTopics = topics
    .filter((t) => !t.mastered && derived.remainingByTopic[t.id] > 0)
    .map((t) => ({
      ...t,
      remainingUnits: derived.remainingByTopic[t.id]
    }));

  // Step 3: Compute remaining future budgets
  const budgets = computeBudgets(activeTopics, derived.totalAvailableFutureUnits);
  const ranked = rankTopics(topics);

  // Group frozen blocks by day
  const frozenByDay = {};
  frozenBlocks.forEach((b) => {
    if (!frozenByDay[b.dayIndex]) frozenByDay[b.dayIndex] = [];
    frozenByDay[b.dayIndex].push(b);
  });

  // Step 4: Place budgets
  const { newBlocks, nextIdCounter } = placeBudgets(
    budgets,
    derived.dayCapacities,
    frozenByDay,
    ranked,
    todayIndex,
    numDays,
    nextId
  );

  return {
    ...state,
    blocks: [...frozenBlocks, ...newBlocks],
    lastScheduledDayIndex: todayIndex,
    nextId: nextIdCounter
  };
}
