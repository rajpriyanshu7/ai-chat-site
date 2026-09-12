import type { ErrorEvent } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';
import { REDACTED_REQUEST_BODY, scrubSentryEvent } from '../sentry-scrub';

function eventWith(overrides: Record<string, unknown>): ErrorEvent {
  return overrides as unknown as ErrorEvent;
}

describe('scrubSentryEvent', () => {
  it('redacts oversized string request bodies', () => {
    const event = eventWith({ request: { url: 'https://x/api/chat', data: 'a'.repeat(2001) } });
    const out = scrubSentryEvent(event);
    expect(out.request?.data).toBe(REDACTED_REQUEST_BODY);
  });

  it('keeps short request bodies untouched', () => {
    const event = eventWith({ request: { url: 'https://x/api/chat', data: '{"model":"m"}' } });
    const out = scrubSentryEvent(event);
    expect(out.request?.data).toBe('{"model":"m"}');
  });

  it('keeps non-string request bodies untouched', () => {
    const event = eventWith({ request: { url: 'https://x/api/chat', data: { model: 'm' } } });
    const out = scrubSentryEvent(event);
    expect(out.request?.data).toEqual({ model: 'm' });
  });

  it('strips sensitive keys from breadcrumb data but keeps the rest', () => {
    const event = eventWith({
      breadcrumbs: [
        { message: 'fetch', data: { url: '/api/chat', messages: [{ role: 'user' }], apiKey: 'sk-x', apikey: 'sk-y', authorization: 'Bearer z', status: 200 } },
        { message: 'plain' },
      ],
    });
    const out = scrubSentryEvent(event);
    const data = out.breadcrumbs?.[0]?.data as Record<string, unknown>;
    expect(data).toEqual({ url: '/api/chat', status: 200 });
    expect(out.breadcrumbs?.[1]).toEqual({ message: 'plain' });
  });

  it('passes normal events through unchanged', () => {
    const event = eventWith({ exception: { values: [{ value: 'boom' }] } });
    expect(scrubSentryEvent(event)).toBe(event);
  });
});
