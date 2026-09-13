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

export function renameConversation(id: string, title: string): boolean {
  const next = title.trim().slice(0, 60);
  if (!next) return false;
  const all = loadConversations();
  if (!all.some(x => x.id === id)) return false;
  writeAll(all.map(x => (x.id === id ? { ...x, title: next } : x)));
  return true;
}

export interface RecencyGroup {
  label: string;
  items: Conversation[];
}

/** Bucket conversations by local-timezone day boundaries derived from nowMs. */
export function groupByRecency(convs: Conversation[], nowMs: number): RecencyGroup[] {
  const now = new Date(nowMs);
  const at = (dayOffset: number): number =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset).getTime();
  const startOfToday = at(0);
  const startOfYesterday = at(-1);
  const weekAgo = at(-7);
  const groups: RecencyGroup[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Older', items: [] },
  ];
  for (const c of convs) {
    if (c.updatedAt >= startOfToday) groups[0].items.push(c);
    else if (c.updatedAt >= startOfYesterday) groups[1].items.push(c);
    else if (c.updatedAt >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }
  for (const g of groups) g.items.sort((a, b) => b.updatedAt - a.updatedAt);
  return groups.filter(g => g.items.length > 0);
}

export function importConversations(data: unknown): { imported: number; skipped: number } {
  if (!Array.isArray(data)) throw new Error('That file is not a valid chat export.');
  if (data.length === 0) throw new Error('No conversations found in that file.');
  const existing = loadConversations();
  const seen = new Set(existing.map(c => c.id));
  const fresh: Conversation[] = [];
  let skipped = 0;
  for (const item of data) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as { id?: unknown }).id !== 'string' ||
      typeof (item as { title?: unknown }).title !== 'string' ||
      typeof (item as { updatedAt?: unknown }).updatedAt !== 'number' ||
      !Array.isArray((item as { messages?: unknown }).messages)
    ) {
      throw new Error('That file is not a valid chat export.');
    }
    const c = item as { id: string; title: string; model?: unknown; updatedAt: number; messages: UIMessage[] };
    if (seen.has(c.id)) {
      skipped += 1;
      continue;
    }
    seen.add(c.id);
    // Round-trip messages opaquely; ignore unknown extra fields entirely.
    fresh.push({
      id: c.id,
      title: c.title,
      model: typeof c.model === 'string' ? c.model : '',
      updatedAt: c.updatedAt,
      messages: c.messages,
    });
  }
  if (fresh.length > 0) writeAll([...existing, ...fresh]);
  return { imported: fresh.length, skipped };
}
