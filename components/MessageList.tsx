'use client';

import type { Conversation } from '@/lib/history';
import MessageItem from './MessageItem';

interface Props {
  messages: Conversation['messages'];
  onRegenerate: () => void;
  onEdit: (index: number) => void;
}

export default function MessageList({ messages, onRegenerate, onEdit }: Props) {
  if (messages.length === 0) return <div className="flex flex-1 items-center justify-center text-gray-500">Ask anything to begin.</div>;
  let lastAssistant = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { lastAssistant = i; break; }
  }
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((m, i) => (
        <MessageItem
          key={m.id}
          message={m}
          onEdit={m.role === 'user' ? () => onEdit(i) : undefined}
          onRegenerate={i === lastAssistant ? onRegenerate : undefined}
        />
      ))}
    </div>
  );
}
