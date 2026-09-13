'use client';

import { useEffect, useRef, useState } from 'react';
import type { Conversation } from '@/lib/history';
import MessageItem from './MessageItem';
import { ArrowDownIcon } from './icons';

function textOfPart(m: Conversation['messages'][number]): string {
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
  const [stuck, setStuck] = useState(true);
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
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stick.current = near;
    setStuck(prev => (prev === near ? prev : near));
  }

  function scrollToLatest(): void {
    const el = listRef.current;
    if (!el) return;
    stick.current = true;
    setStuck(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }

  const last = messages[messages.length - 1];
  const showGenerating = streaming && last?.role === 'assistant' && textOfPart(last) === '';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
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
          {showGenerating && (
            <div role="status" className="text-[13.5px] text-dim">
              Generating…
            </div>
          )}
        </div>
      </div>
      {!stuck && (
        <button
          type="button"
          onClick={scrollToLatest}
          aria-label="Scroll to latest"
          className="absolute bottom-3 left-1/2 flex min-h-[44px] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-side px-4 text-[13.5px] text-text shadow-[var(--sheet-shadow)]"
        >
          <ArrowDownIcon size={15} />
          Scroll to latest
        </button>
      )}
    </div>
  );
}
