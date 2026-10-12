import { generatePlan, recalculate } from '../lib/scheduler.js';
import { diffPlans } from '../lib/diffEngine.js';

export function planReducer(state, action) {
  switch (action.type) {
    case 'GENERATE': {
      const { setup, today } = action.payload;
      return generatePlan(setup, today);
    }

    case 'HYDRATE': {
      return action.payload;
    }

    case 'RESET': {
      return null;
    }

    case 'DISMISS_CHANGE': {
      if (!state) return state;
      return {
        ...state,
        lastChange: null
      };
    }

    case 'REPORT_MISSED': {
      if (!state) return state;
      const { units, todayIndex = 0 } = action.payload;
      const currentMissed = state.missedUnitsByDay[String(todayIndex)] || state.missedUnitsByDay[todayIndex] || 0;
      const newMissed = currentMissed + units;

      const stateWithMissed = {
        ...state,
        missedUnitsByDay: {
          ...state.missedUnitsByDay,
          [todayIndex]: newMissed
        }
      };

      const recalculated = recalculate(stateWithMissed, todayIndex);
      const diff = diffPlans(state, recalculated, {
        event: 'missed',
        todayIndex,
        missedUnits: units
      });

      return {
        ...recalculated,
        lastChange: diff
      };
    }

    case 'TOGGLE_BLOCK': {
      if (!state) return state;
      const { blockId, todayIndex = 0 } = action.payload;
      const targetBlock = state.blocks.find((b) => b.id === blockId);
      if (!targetBlock) return state;

      const isMarkingCompleted = targetBlock.status !== 'completed';

      // If marking completed, check capacity invariant:
      // completedUnitsOnDay(d) + missedUnitsByDay[d] + block.units <= dailyUnits
      if (isMarkingCompleted) {
        const day = targetBlock.dayIndex;
        const currentCompletedOnDay = state.blocks
          .filter((b) => b.dayIndex === day && b.status === 'completed')
          .reduce((s, b) => s + b.units, 0);
        const missedOnDay = state.missedUnitsByDay[String(day)] || state.missedUnitsByDay[day] || 0;

        if (currentCompletedOnDay + missedOnDay + targetBlock.units > state.exam.dailyUnits) {
          // Refuse if exceeding capacity
          return state;
        }
      }

      const updatedBlocks = state.blocks.map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          status: isMarkingCompleted ? 'completed' : 'planned'
        };
      });

      const stateWithToggled = {
        ...state,
        blocks: updatedBlocks
      };

      const recalculated = recalculate(stateWithToggled, todayIndex);
      const diff = diffPlans(state, recalculated, {
        event: 'checked',
        todayIndex,
        toggledBlockId: blockId
      });

      // Spec: for checked events, show banner only if diff isn't empty and has real changes
      const hasRealChanges = diff.lines.length > 0 &&
        !diff.lines.every((l) => l.includes("didn't need to change"));

      return {
        ...recalculated,
        lastChange: hasRealChanges ? diff : null
      };
    }

    case 'MARK_MASTERED': {
      if (!state) return state;
      const { topicId, todayIndex = 0 } = action.payload;
      const updatedTopics = state.topics.map((t) =>
        t.id === topicId ? { ...t, mastered: true } : t
      );
      const stateWithMastered = {
        ...state,
        topics: updatedTopics
      };
      const recalculated = recalculate(stateWithMastered, todayIndex);
      const diff = diffPlans(state, recalculated, {
        event: 'mastered',
        todayIndex,
        topicId
      });

      return {
        ...recalculated,
        lastChange: diff
      };
    }

    case 'UNMASTER': {
      if (!state) return state;
      const { topicId, todayIndex = 0 } = action.payload;
      const updatedTopics = state.topics.map((t) =>
        t.id === topicId ? { ...t, mastered: false } : t
      );
      const stateWithUnmastered = {
        ...state,
        topics: updatedTopics
      };
      const recalculated = recalculate(stateWithUnmastered, todayIndex);
      const diff = diffPlans(state, recalculated, {
        event: 'unmastered',
        todayIndex,
        topicId
      });

      return {
        ...recalculated,
        lastChange: diff
      };
    }

    case 'DAY_ADVANCED': {
      if (!state) return state;
      const { todayIndex = 0 } = action.payload;
      const recalculated = recalculate(state, todayIndex);
      const diff = diffPlans(state, recalculated, {
        event: 'dayAdvanced',
        todayIndex
      });

      return {
        ...recalculated,
        lastChange: diff
      };
    }

    default:
      return state;
  }
}
