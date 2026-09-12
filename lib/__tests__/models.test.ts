import { describe, expect, it } from 'vitest';
import { MODELS } from '../models';

describe('models', () => {
  it('exposes at least one model with id and label', () => {
    expect(MODELS.length).toBeGreaterThan(0);
    for (const m of MODELS) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.label).toBe('string');
    }
  });
});
