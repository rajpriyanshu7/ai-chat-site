vi.mock('server-only', () => ({}));

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { estimateCostCents, getCandidate, listCandidates, ProviderError } from '../provider';

const CHAIN = [
  {
    name: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: 'or-key',
    models: [
      { id: 'or-free-a', label: 'Free A', inPer1k: 0, outPer1k: 0 },
      { id: 'or-free-b', label: 'Free B', inPer1k: 0, outPer1k: 0 },
    ],
  },
  {
    name: 'nvidia',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: 'nv-key',
    models: [{ id: 'nv-direct', label: 'Direct', inPer1k: 0.001, outPer1k: 0.002 }],
  },
];

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('failover chain', () => {
  it('flattens providers and models in order', () => {
    vi.stubEnv('AI_CANDIDATES_JSON', JSON.stringify(CHAIN));
    const ids = listCandidates().map(c => c.id);
    expect(ids).toEqual(['or-free-a', 'or-free-b', 'nv-direct']);
    expect(listCandidates()[2]).toMatchObject({ providerName: 'nvidia', baseURL: 'https://integrate.api.nvidia.com/v1', apiKey: 'nv-key' });
  });

  it('falls back to legacy single-provider vars', () => {
    vi.stubEnv('AI_PROVIDER_BASE_URL', 'https://provider.example/v1');
    vi.stubEnv('AI_PROVIDER_API_KEY', 'secret');
    vi.stubEnv('AI_MODELS_JSON', JSON.stringify([{ id: 'm1', label: 'M1', inPer1k: 0.001, outPer1k: 0.002 }]));
    expect(listCandidates().map(c => c.id)).toEqual(['m1']);
  });

  it('ignores malformed chain entries and falls back when empty', () => {
    vi.stubEnv('AI_CANDIDATES_JSON', JSON.stringify([{ nope: true }, 'junk', { baseURL: 'x', apiKey: 'y', models: [{ id: 42 }] }]));
    vi.stubEnv('AI_PROVIDER_BASE_URL', 'https://provider.example/v1');
    vi.stubEnv('AI_PROVIDER_API_KEY', 'secret');
    vi.stubEnv('AI_MODELS_JSON', JSON.stringify([{ id: 'm1', label: 'M1' }]));
    expect(listCandidates().map(c => c.id)).toEqual(['m1']);
  });

  it('returns [] when nothing is configured', () => {
    expect(listCandidates()).toEqual([]);
  });

  it('getCandidate resolves and rejects unknown ids', () => {
    vi.stubEnv('AI_CANDIDATES_JSON', JSON.stringify(CHAIN));
    expect(getCandidate('nv-direct').providerName).toBe('nvidia');
    expect(() => getCandidate('ghost')).toThrowError(ProviderError);
  });

  it('estimateCostCents searches the whole union', () => {
    vi.stubEnv('AI_CANDIDATES_JSON', JSON.stringify(CHAIN));
    expect(estimateCostCents('nv-direct', 1000, 1000)).toBeCloseTo(0.3, 6);
    expect(estimateCostCents('or-free-a', 1000, 1000)).toBe(0);
    expect(estimateCostCents('ghost', 1000, 1000)).toBe(0);
  });
});
