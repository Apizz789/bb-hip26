// Document request rules (simulated: nothing is sent or stored outside the page).
import type { TranslationKey } from '../i18n/dictionary';

export const DOC_TYPES = ['statement', 'income', 'balance', 'tax'] as const;
export type DocType = (typeof DOC_TYPES)[number];
export type Delivery = 'email' | 'branch';

const DOC_TYPE_KEYS: Record<DocType, TranslationKey> = {
  statement: 'opt_statement', income: 'opt_income', balance: 'opt_balance', tax: 'opt_tax',
};
export const docTypeKey = (type: DocType): TranslationKey => DOC_TYPE_KEYS[type];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface DocInput {
  type: string;
  copies: number;
  delivery: Delivery;
  email: string;
}

export type DocErrors = Partial<Record<'type' | 'copies' | 'email', TranslationKey>>;

export function validateDocRequest(input: DocInput): DocErrors {
  const errors: DocErrors = {};
  if (!(DOC_TYPES as readonly string[]).includes(input.type)) errors.type = 'err_doc_type';
  if (!Number.isInteger(input.copies) || input.copies < 1 || input.copies > 5) errors.copies = 'err_copies';
  if (input.delivery === 'email' && !EMAIL_RE.test(input.email.trim())) errors.email = 'err_email';
  return errors;
}

export const clampCopies = (n: number): number => {
  const v = Number.isNaN(n) ? 1 : n;
  return Math.min(5, Math.max(1, v));
};
