import type { ReactNode } from 'react';

interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  /** Id of the error paragraph (linked with aria-describedby on the control). */
  errorId: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + inline error message. */
export function Field({ label, htmlFor, error, errorId, children, className = 'field' }: FieldProps) {
  return (
    <div className={className}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      <p className={'err' + (error ? ' show' : '')} id={errorId}>{error ?? ''}</p>
    </div>
  );
}

/** Class name for a control, with the .invalid state when there is an error. */
export const controlClass = (base: string, error?: string): string => (error ? `${base} invalid` : base);

/** aria-invalid attribute for a control (undefined when valid). */
export const ariaInvalid = (error?: string): true | undefined => (error ? true : undefined);
