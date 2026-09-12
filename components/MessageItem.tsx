'use client';

import type { Conversation } from '@/lib/history';
import Markdown from './Markdown';

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

interface Props {
  message: ChatMessage;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

export default function MessageItem({ message, onEdit, onRegenerate }: Props) {
  const mine = message.role === 'user';
  return (
    <div className={`max-w-2xl whitespace-pre-wrap rounded p-3 ${mine ? 'ml-auto bg-gray-100' : 'bg-white'}`}>
      {mine ? textOf(message) : <Markdown text={textOf(message)} />}
      {(onEdit ?? onRegenerate) != null && (
        <div className="mt-1 flex gap-3 text-xs text-gray-500">
          {mine && onEdit != null && <button onClick={onEdit} className="underline">Edit</button>}
          {!mine && onRegenerate != null && <button onClick={onRegenerate} className="underline">Regenerate</button>}
        </div>
      )}
    </div>
  );
}
