vi.mock('server-only', () => ({}));

import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('AI_PROVIDER_BASE_URL', 'https://provider.example/v1');
vi.stubEnv('AI_PROVIDER_API_KEY', 'secret');
vi.stubEnv('AI_MODELS_JSON', JSON.stringify([{ id: 'm1', label: 'M1', inPer1k: 0.001, outPer1k: 0.002 }]));
vi.stubEnv('AI_SYSTEM_PROMPT', 'Be helpful.');

import { buildModelMessages, estimateCostCents, getModel, mapProviderError } from '../provider';

describe('provider adapter', () => {
  it('builds a model for a known id', () => {
    expect(() => getModel('m1')).not.toThrow();
  });

  it('throws ProviderError for unknown model', () => {
    expect(() => getModel('nope')).toThrowError(/unknown model/i);
  });

  it('prepends system prompt and truncates to last 20 messages', () => {
    const ui = Array.from({ length: 25 }, (_, i) => ({
      id: `u${i}`, role: 'user' as const, parts: [{ type: 'text' as const, text: `hi ${i}` }],
    }));
    const out = buildModelMessages(ui);
    expect(out[0]).toMatchObject({ role: 'system', content: 'Be helpful.' });
    expect(out.filter(m => m.role !== 'system')).toHaveLength(20);
    expect(out[out.length - 1]).toMatchObject({ content: [{ type: 'text', text: 'hi 24' }] });
  });

  it('estimates cost in cents', () => {
    // 1000 in-tokens @ $0.001/1k + 1000 out-tokens @ $0.002/1k = $0.003 = 0.3c
    expect(estimateCostCents('m1', 1000, 1000)).toBeCloseTo(0.3, 5);
  });

  it('maps rate-limit errors to 429', () => {
    const err = Object.assign(new Error('Rate limit exceeded'), { statusCode: 429 });
    expect(mapProviderError(err)).toMatchObject({ status: 429 });
  });
});
