'use client';

import { useEffect, useRef } from 'react';
import type { Conversation } from '@/lib/history';
import MessageItem from './MessageItem';

interface Props {
  messages: Conversation['messages'];
  onRegenerate: () => void;
  onEdit: (index: number) => void;
  /** A reply is currently streaming — shows the caret on the last part. */
  streaming: boolean;
  /** Fills the composer with a suggestion and focuses it (does not send). */
  onSuggest: (text: string) => void;
}

const SUGGESTIONS = [
  'Explain a concept from scratch',
  'Solve this step by step',
  'Summarize something for me',
  'Help me draft a reply',
];

const NEAR_BOTTOM_PX = 80;

export default function MessageList({ messages, onRegenerate, onEdit, streaming, onSuggest }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const prevLen = useRef(0);
  const prevFirstId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const el = listRef.current;
    const grew = messages.length > prevLen.current;
    const switched = messages[0]?.id !== prevFirstId.current;
    prevLen.current = messages.length;
    prevFirstId.current = messages[0]?.id;
    if (!el) return;
    // Follow new content while streaming only if the user is at (or near)
    // the bottom; always jump for a new message (own send) or when switching
    // conversations — never yank the view while the user is reading back.
    if (grew || switched || stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 overflow-y-auto px-4 py-8">
        <div className="m-auto flex w-full max-w-xl flex-col items-center py-10">
          <h2 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-text">
            Hi. What are we working on?
          </h2>
          <div className="mt-8 grid w-full grid-cols-1 gap-2.5 md:grid-cols-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggest(s)}
                className="min-h-[44px] rounded-xl border border-border bg-transparent px-4 py-3 text-left text-[14px] text-text transition-colors hover:bg-hover"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  let lastAssistant = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { lastAssistant = i; break; }
  }

  function handleScroll(): void {
    const el = listRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-6 px-4 py-6 md:px-6">
        {messages.map((m, i) => (
          <MessageItem
            key={m.id}
            message={m}
            onEdit={m.role === 'user' ? () => onEdit(i) : undefined}
            onRegenerate={i === lastAssistant ? onRegenerate : undefined}
            streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
      </div>
    </div>
  );
}
