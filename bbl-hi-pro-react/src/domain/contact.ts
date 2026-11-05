// Contact form rules. Submissions are simulated and never sent.
import type { TranslationKey } from '../i18n/dictionary';
import { EMAIL_RE } from './documents';

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}
export type ContactErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', TranslationKey>>;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  if (input.name.trim().length < 2) errors.name = 'err_name';
  if (!EMAIL_RE.test(input.email.trim())) errors.email = 'err_email_c';
  if (!input.subject) errors.subject = 'err_subject';
  const len = input.message.trim().length;
  if (len < 10 || len > 500) errors.message = 'err_message';
  return errors;
}
