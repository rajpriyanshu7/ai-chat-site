import type { UIMessage } from 'ai';

export const STORAGE_KEY = 'aichat:conversations:v1';

export interface Conversation {
  id: string;
  title: string;
  model: string;
  updatedAt: number;
  messages: UIMessage[];
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Conversation[];
  } catch {
    return [];
  }
}

function writeAll(all: Conversation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function saveConversation(c: Conversation): void {
  const rest = loadConversations().filter(x => x.id !== c.id);
  writeAll([c, ...rest]);
}

export function deleteConversation(id: string): void {
  writeAll(loadConversations().filter(x => x.id !== id));
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}
