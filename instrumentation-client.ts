import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from './lib/sentry-scrub';

// No DSN exists yet (the owner creates the Sentry project later and sets
// NEXT_PUBLIC_SENTRY_DSN). Until then stay dormant.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    // Performance tracing, prod sample rate. No session replay (privacy):
    // visitor screens are never recorded.
    tracesSampleRate: 0.1,
    beforeSend: scrubSentryEvent,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
