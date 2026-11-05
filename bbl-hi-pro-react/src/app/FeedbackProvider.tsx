import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

interface FeedbackValue {
  /** Message currently shown in the toast, or '' when hidden. */
  message: string;
  /** Changes on every toast so the same text can re-announce. */
  nonce: number;
  toast: (message: string) => void;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);
const TOAST_MS = 2600;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [nonce, setNonce] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback((next: string) => {
    setMessage(next);
    setNonce(n => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), TOAST_MS);
  }, []);

  const value = useMemo(() => ({ message, nonce, toast }), [message, nonce, toast]);
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackValue {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider');
  return value;
}
