import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, deleteConversation, loadConversations, saveConversation, STORAGE_KEY } from '../history';

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

describe('history store', () => {
  it('round-trips a conversation', () => {
    saveConversation({ id: 'c1', title: 'Hi', model: 'm', updatedAt: 1, messages: [] });
    const all = loadConversations();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('c1');
    expect(JSON.parse((localStorage.getItem(STORAGE_KEY) as string)).length).toBe(1);
  });

  it('deletes one conversation and clears all', () => {
    saveConversation({ id: 'a', title: 'A', model: 'm', updatedAt: 1, messages: [] });
    saveConversation({ id: 'b', title: 'B', model: 'm', updatedAt: 2, messages: [] });
    deleteConversation('a');
    expect(loadConversations().map(c => c.id)).toEqual(['b']);
    clearAll();
    expect(loadConversations()).toEqual([]);
  });

  it('returns [] on corrupt data instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    expect(loadConversations()).toEqual([]);
  });
});
