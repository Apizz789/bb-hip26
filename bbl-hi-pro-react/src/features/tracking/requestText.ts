import type { TrackedRequest } from '../../domain/requests';
import type { Translator } from '../../i18n/translate';
import { fmtDate, type Lang } from '../../utils/format';

/** Second line of a request: branch · date · time for appointments, date only for documents. */
export function requestMeta(r: TrackedRequest, t: Translator, lang: Lang): string {
  if (r.type === 'appt') return `${t(r.branchKey ?? 'br_silom')} · ${fmtDate(r.date, lang)} · ${r.time ?? ''}`;
  return fmtDate(r.date, lang);
}
