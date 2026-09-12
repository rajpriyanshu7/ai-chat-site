import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from './lib/sentry-scrub';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    // No DSN exists yet (the owner creates the Sentry project later and sets
    // SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN). Until then stay dormant: error
    // calls such as Sentry.captureMessage are safe no-ops.
    const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    Sentry.init({
      dsn,
      // Performance tracing, prod sample rate. No session replay (privacy).
      tracesSampleRate: 0.1,
      beforeSend: scrubSentryEvent,
    });
  }
}

// Reports errors from nested React Server Components and route handlers.
export const onRequestError = Sentry.captureRequestError;
