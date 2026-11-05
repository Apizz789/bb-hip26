import type { Goal } from '../../domain/goals';
import type { Translator } from '../../i18n/translate';

/** Built-in goals are translated; user goals keep the text they typed. */
export const goalName = (g: Goal, t: Translator): string => (g.nameKey ? t(g.nameKey) : g.name ?? '');
