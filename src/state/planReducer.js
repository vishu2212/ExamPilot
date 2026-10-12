import { generatePlan, recalculate } from '../lib/scheduler.js';

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

    default:
      return state;
  }
}
