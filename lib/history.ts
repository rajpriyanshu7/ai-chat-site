// NOTE: Brief specifies `import type { UIMessage } from 'ai'`, but the `ai`
// package is not installed until Task 5, so that import would fail. Define the
// message type structurally here instead (no extra exports). Shape matches the
// real UIMessage core (id + role) with an index signature so extra fields
// (e.g. parts/content) still type-check; revisit when `ai` lands.
type UIMessage = {
  id: string;
  role: string;
  [key: string]: unknown;
};

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
