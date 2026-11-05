import type { ReactNode } from 'react';
import { LanguageProvider } from './LanguageProvider';
import { StoreProvider } from './StoreProvider';
import { FeedbackProvider } from './FeedbackProvider';

/** All app-wide providers in one place. Order: language → state → feedback. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <StoreProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </StoreProvider>
    </LanguageProvider>
  );
}
