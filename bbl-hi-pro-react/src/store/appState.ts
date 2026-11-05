// Application state (mock only). A pure reducer: no storage, no network.
// Every action mirrors one behaviour of the HTML prototype.
import { advance, formatRef, type FilterId, type TrackedRequest } from '../domain/requests';
import { applySimulatedSave, type Goal, type GoalInput } from '../domain/goals';
import { INITIAL_ACTIVITY, INITIAL_GOALS, INITIAL_NOTIFICATIONS, INITIAL_REQUESTS, TODAY, type MockActivity, type MockNotification } from '../data/mock';
import { isoOf } from '../utils/format';

export interface AppState {
  goals: Goal[];
  goalSeq: number;
  requests: TrackedRequest[];
  reqSeq: number;
  notifications: MockNotification[];
  activity: MockActivity[];
  recDone: boolean[];
  filter: FilterId;
  range: 6 | 12;
  /** 0–11, the overview month (11 = November). */
  ovIndex: number;
  apptDate: number | null;
  apptTime: string | null;
  /** Last goal that received a simulated save. `seq` increases on every save so the highlight can replay. */
  lastSimulated: { id: string; seq: number } | null;
}

export const initialState: AppState = {
  goals: INITIAL_GOALS,
  goalSeq: 3,
  requests: INITIAL_REQUESTS,
  reqSeq: 40500,
  notifications: INITIAL_NOTIFICATIONS,
  activity: INITIAL_ACTIVITY,
  recDone: [false, false, false],
  filter: 'all',
  range: 6,
  ovIndex: 11,
  apptDate: null,
  apptTime: null,
  lastSimulated: null,
};

export type Action =
  | { type: 'goal/simulateSave'; id: string; amount: number }
  | { type: 'goal/create'; input: GoalInput }
  | { type: 'goal/update'; id: string; input: GoalInput; keepNameKey: boolean }
  | { type: 'request/addDoc'; titleKey: TrackedRequest['titleKey'] }
  | { type: 'request/addAppt'; titleKey: TrackedRequest['titleKey']; branchKey: TrackedRequest['branchKey']; date: string; time: string }
  | { type: 'request/advance'; id: string }
  | { type: 'rec/toggle'; index: number }
  | { type: 'notif/read'; key: MockNotification['key'] }
  | { type: 'notif/readAll' }
  | { type: 'filter/set'; filter: FilterId }
  | { type: 'range/set'; range: 6 | 12 }
  | { type: 'overview/set'; index: number }
  | { type: 'appt/date'; index: number | null }
  | { type: 'appt/time'; time: string | null };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'goal/simulateSave': {
      const g = state.goals.find(x => x.id === action.id);
      if (!g || g.saved >= g.target) return state;
      const { goal } = applySimulatedSave(g, action.amount);
      const seq = (state.lastSimulated?.seq ?? 0) + 1;
      return {
        ...state,
        goals: state.goals.map(x => (x.id === goal.id ? goal : x)),
        lastSimulated: { id: goal.id, seq },
      };
    }
    case 'goal/create': {
      const id = 'g' + (state.goalSeq + 1);
      const goal: Goal = {
        id,
        name: action.input.name.trim(),
        target: action.input.target,
        saved: action.input.saved,
        start: isoOf(TODAY),
        date: action.input.date,
      };
      return { ...state, goals: [...state.goals, goal], goalSeq: state.goalSeq + 1 };
    }
    case 'goal/update': {
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== action.id) return g;
          const name = action.input.name.trim();
          // Keep the translated built-in name unless the user changed the text.
          const keepKey = action.keepNameKey && g.nameKey !== undefined;
          return {
            ...g,
            nameKey: keepKey ? g.nameKey : undefined,
            name: keepKey ? undefined : name,
            target: action.input.target,
            saved: action.input.saved,
            date: action.input.date,
          };
        }),
      };
    }
    case 'request/addDoc': {
      const seq = state.reqSeq + 1;
      const ref = formatRef('DOC', seq);
      const item: TrackedRequest = { id: ref, type: 'doc', ref, titleKey: action.titleKey, date: isoOf(TODAY), step: 0 };
      return { ...state, reqSeq: seq, requests: [item, ...state.requests] };
    }
    case 'request/addAppt': {
      const seq = state.reqSeq + 1;
      const ref = formatRef('APT', seq);
      const item: TrackedRequest = {
        id: ref, type: 'appt', ref, titleKey: action.titleKey, branchKey: action.branchKey,
        date: action.date, time: action.time, step: 0,
      };
      return { ...state, reqSeq: seq, requests: [item, ...state.requests] };
    }
    case 'request/advance':
      return {
        ...state,
        requests: state.requests.map(r => (r.id === action.id ? advance(r) : r)),
      };
    case 'rec/toggle':
      return { ...state, recDone: state.recDone.map((v, i) => (i === action.index ? !v : v)) };
    case 'notif/read':
      return { ...state, notifications: state.notifications.map(n => (n.key === action.key ? { ...n, read: true } : n)) };
    case 'notif/readAll':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case 'filter/set':
      return { ...state, filter: action.filter };
    case 'range/set':
      return { ...state, range: action.range };
    case 'overview/set':
      return { ...state, ovIndex: Math.min(11, Math.max(0, action.index)) };
    case 'appt/date':
      return { ...state, apptDate: action.index, apptTime: null };
    case 'appt/time':
      return { ...state, apptTime: action.time };
  }
}

/** First request that is not finished: the "continue where you left off" item. */
export const resumeRequest = (state: AppState): TrackedRequest | undefined =>
  state.requests.find(r => r.step !== 2);
