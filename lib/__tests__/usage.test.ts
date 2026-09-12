vi.mock('server-only', () => ({}));

import { describe, expect, it, vi } from 'vitest';
import { todayKey } from '../usage';

describe('usage', () => {
  it('formats UTC day key', () => {
    expect(todayKey(new Date('2026-09-12T00:30:00+05:30'))).toBe('2026-09-11');
    expect(todayKey(new Date('2026-09-12T10:00:00Z'))).toBe('2026-09-12');
  });
});
