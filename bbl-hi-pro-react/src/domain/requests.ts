// Document and appointment requests: status steps and tracking.
import type { TranslationKey } from '../i18n/dictionary';

export type RequestType = 'doc' | 'appt';

export interface TrackedRequest {
  id: string;
  type: RequestType;
  ref: string;
  titleKey: TranslationKey;
  branchKey?: TranslationKey;
  /** ISO date. */
  date: string;
  time?: string;
  /** Index into the status steps: 0 submitted/booked, 1 processing/confirmed, 2 ready/completed. */
  step: 0 | 1 | 2;
}

export const STEP_KEYS: Record<RequestType, readonly [TranslationKey, TranslationKey, TranslationKey]> = {
  doc: ['status_submitted', 'status_processing', 'status_ready'],
  appt: ['status_booked', 'status_confirmed', 'status_completed'],
};

export const isFinal = (r: TrackedRequest): boolean => r.step === 2;

export function advance(r: TrackedRequest): TrackedRequest {
  return r.step === 2 ? r : { ...r, step: (r.step + 1) as 0 | 1 | 2 };
}

export type FilterId = 'all' | 'active' | 'done';

export const matchesFilter = (r: TrackedRequest, filter: FilterId): boolean => {
  if (filter === 'active') return !isFinal(r);
  if (filter === 'done') return isFinal(r);
  return true;
};

export const pillTone = (r: TrackedRequest): '' | 'blue' | 'green' => (r.step === 2 ? 'green' : r.step === 1 ? 'blue' : '');

/** Reference numbers: BBL-DOC-40501, BBL-APT-40502 … */
export const formatRef = (prefix: 'DOC' | 'APT', seq: number): string => `BBL-${prefix}-${seq}`;
