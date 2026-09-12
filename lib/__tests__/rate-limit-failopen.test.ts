import { afterEach, describe, expect, it, vi } from 'vitest';
// Static import: if importing the chain threw without DATABASE_URL,
// this suite would fail at collection time before any test runs.
import { checkRateLimit } from '../rate-limit';

describe('fail-open without DATABASE_URL', () => {
  const saved = process.env.DATABASE_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = saved;
    vi.restoreAllMocks();
  });

  it('checkRateLimit resolves { ok: true } and logs metadata only', async () => {
    delete process.env.DATABASE_URL;
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(checkRateLimit('203.0.113.7')).resolves.toEqual({ ok: true });
    expect(err).toHaveBeenCalledTimes(1);
    const logged = String(err.mock.calls[0]?.[0] ?? '');
    expect(logged).toContain('fail-open');
    expect(logged).not.toContain('203.0.113.7');
  });
});
