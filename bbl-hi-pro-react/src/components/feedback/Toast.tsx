import { useFeedback } from '../../app/FeedbackProvider';

/** Polite status message (not announced twice for the same text thanks to the nonce key). */
export function Toast() {
  const { message, nonce } = useFeedback();
  return (
    <div className={'toast' + (message ? ' show' : '')} id="toast" role="status" aria-live="polite" key={nonce}>
      {message}
    </div>
  );
}
