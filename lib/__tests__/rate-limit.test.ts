import { describe, expect, it } from 'vitest';
import { isAllowed } from '../rate-limit';

describe('sliding window', () => {
  it('allows under the limit', () => {
    expect(isAllowed([1000, 2000], 3000, 3, 60_000)).toBe(true);
  });

  it('blocks at the limit', () => {
    expect(isAllowed([1000, 2000, 2500], 3000, 3, 60_000)).toBe(false);
  });

  it('forgets hits outside the window', () => {
    expect(isAllowed([1, 2, 3], 120_000, 3, 60_000)).toBe(true);
  });
});
