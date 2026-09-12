'use client';

import type { Conversation } from '@/lib/history';
import MessageItem from './MessageItem';

export default function MessageList({ messages }: { messages: Conversation['messages'] }) {
  if (messages.length === 0) return <div className="flex flex-1 items-center justify-center text-gray-500">Ask anything to begin.</div>;
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map(m => <MessageItem key={m.id} message={m} />)}
    </div>
  );
}
