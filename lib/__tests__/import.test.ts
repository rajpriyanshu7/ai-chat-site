import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  importConversations,
  loadConversations,
  renameConversation,
  saveConversation,
  type Conversation,
} from '../history';

function memStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memStorage());
});

function conv(id: string, title = id): Conversation {
  return { id, title, model: 'm', updatedAt: 1, messages: [] };
}

describe('importConversations', () => {
  it('round-trips an export shape', () => {
    const exported = JSON.parse(JSON.stringify([conv('a', 'A'), conv('b', 'B')]));
    const res = importConversations(exported);
    expect(res).toEqual({ imported: 2, skipped: 0 });
    expect(loadConversations().map(c => c.title)).toEqual(['A', 'B']);
  });

  it('skips colliding ids and counts them', () => {
    saveConversation(conv('a', 'A'));
    const res = importConversations([conv('a', 'Changed'), conv('b', 'B')]);
    expect(res).toEqual({ imported: 1, skipped: 1 });
    // Colliding id keeps its stored title.
    expect(loadConversations().find(c => c.id === 'a')?.title).toBe('A');
  });

  it('throws the user-facing message for non-array input', () => {
    for (const bad of [{}, 'nope', 42, true]) {
      expect(() => importConversations(bad)).toThrow('That file is not a valid chat export.');
    }
  });

  it('throws the user-facing message for null/undefined', () => {
    expect(() => importConversations(null)).toThrow('That file is not a valid chat export.');
    expect(() => importConversations(undefined)).toThrow('That file is not a valid chat export.');
  });

  it('throws when the file holds no conversations', () => {
    expect(() => importConversations([])).toThrow('No conversations found in that file.');
  });

  it('throws on items with missing fields', () => {
    expect(() => importConversations([{ id: 'x' }])).toThrow('That file is not a valid chat export.');
    expect(() => importConversations([null])).toThrow('That file is not a valid chat export.');
    expect(() => importConversations([{ id: 'x', title: 'T', updatedAt: 1 }])).toThrow(
      'That file is not a valid chat export.',
    );
  });

  it('ignores unknown extra fields', () => {
    const res = importConversations([
      { id: 'a', title: 'A', updatedAt: 1, messages: [], whatever: 'x' },
    ]);
    expect(res).toEqual({ imported: 1, skipped: 0 });
    expect(loadConversations()[0]).toEqual({ id: 'a', title: 'A', model: '', updatedAt: 1, messages: [] });
  });
});

describe('renameConversation', () => {
  it('persists a rename', () => {
    saveConversation(conv('a', 'Old'));
    expect(renameConversation('a', 'New')).toBe(true);
    expect(loadConversations()[0].title).toBe('New');
  });

  it('trims whitespace', () => {
    saveConversation(conv('a', 'Old'));
    expect(renameConversation('a', '  Spaced  ')).toBe(true);
    expect(loadConversations()[0].title).toBe('Spaced');
  });

  it('truncates over-60-char titles instead of rejecting', () => {
    saveConversation(conv('a', 'Old'));
    const long = 'x'.repeat(80);
    expect(renameConversation('a', long)).toBe(true);
    expect(loadConversations()[0].title).toBe('x'.repeat(60));
  });

  it('returns false for a missing id', () => {
    expect(renameConversation('ghost', 'New')).toBe(false);
  });

  it('is a no-op for empty titles', () => {
    saveConversation(conv('a', 'Old'));
    expect(renameConversation('a', '   ')).toBe(false);
    expect(renameConversation('a', '')).toBe(false);
    expect(loadConversations()[0].title).toBe('Old');
  });

  it('leaves other fields untouched', () => {
    saveConversation({ id: 'a', title: 'Old', model: 'm', updatedAt: 7, messages: [] });
    renameConversation('a', 'Renamed');
    expect(loadConversations()[0]).toEqual({ id: 'a', title: 'Renamed', model: 'm', updatedAt: 7, messages: [] });
  });
});
