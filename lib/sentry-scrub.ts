import type { ErrorEvent } from '@sentry/nextjs';

/** Breadcrumb payload keys that must never leave the site (chat text, keys). */
const SENSITIVE_CRUMB_KEYS = ['messages', 'apiKey', 'apikey', 'authorization'];

/** Request bodies longer than this may contain full chat transcripts — drop them. */
const MAX_REQUEST_BODY_LENGTH = 2000;

export const REDACTED_REQUEST_BODY = '[redacted: oversized request body]';

/**
 * Shared Sentry `beforeSend` scrub: never ship chat contents or keys to Sentry.
 * Used by both the client (`instrumentation-client.ts`) and server/edge
 * (`instrumentation.ts`) configs so the behavior is identical everywhere.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (
    event.request?.data &&
    typeof event.request.data === 'string' &&
    event.request.data.length > MAX_REQUEST_BODY_LENGTH
  ) {
    event.request.data = REDACTED_REQUEST_BODY;
  }
  if (event.breadcrumbs) {
    for (const b of event.breadcrumbs) {
      if (b.data && typeof b.data === 'object') {
        for (const k of SENSITIVE_CRUMB_KEYS) delete (b.data as Record<string, unknown>)[k];
      }
    }
  }
  return event;
}
