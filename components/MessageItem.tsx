'use client';

import type { Conversation } from '@/lib/history';

type ChatMessage = Conversation['messages'][number];

function textOf(m: ChatMessage): string {
  const parts = (m as unknown as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter(
      (p): p is { type: string; text?: unknown } =>
        typeof p === 'object' && p !== null && (p as { type?: unknown }).type === 'text',
    )
    .map(p => (typeof p.text === 'string' ? p.text : ''))
    .join('');
}

export default function MessageItem({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user';
  return (
    <div className={`max-w-2xl whitespace-pre-wrap rounded p-3 ${mine ? 'ml-auto bg-gray-100' : 'bg-white'}`}>
      {textOf(message)}
    </div>
  );
}
