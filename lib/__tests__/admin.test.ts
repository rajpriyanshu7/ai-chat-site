import { describe, expect, it } from 'vitest';
import { isAdmin } from '../admin';

describe('admin gate', () => {
  it('accepts the configured token', () => {
    process.env.ADMIN_TOKEN = 's3cret';
    expect(isAdmin(new Request('http://x/', { headers: { Authorization: 'Bearer s3cret' } }))).toBe(true);
    expect(isAdmin(new Request('http://x/'))).toBe(false);
    expect(isAdmin(new Request('http://x/', { headers: { Authorization: 'Bearer wrong' } }))).toBe(false);
    delete process.env.ADMIN_TOKEN;
  });
});
