'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { ArrowUpIcon, StopIcon } from './icons';

interface Props {
  draft: string;
  onDraft: (t: string) => void;
  onSend: (t: string) => void;
  onStop: () => void;
  busy: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

const MAX_CHARS = 8000; // server cap (/api/chat) — mirror it client-side
const COUNTER_AT = 7000; // counter appears (dim)
const RED_AT = 7900; // counter turns red near the edge
const MAX_HEIGHT = 212; // ~8 rows at 15.5px/1.7 — then the textarea scrolls

export default function Composer({ draft, onDraft, onSend, onStop, busy, inputRef }: Props) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const taRef = inputRef ?? localRef;

  // Auto-grow: shrink-to-fit then expand, capped so long pastes scroll
  // instead of pushing the layout. Runs on every draft change (typing,
  // suggestion chips, edit-and-retry) — the textarea is always in sync.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [draft, taRef]);

  function submit(): void {
    const t = draft.trim();
    if (!t || busy) return;
    onSend(t);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const len = draft.length;
  const showCounter = len >= COUNTER_AT;
  const nearEdge = len >= RED_AT;
  const canSend = draft.trim().length > 0 && !busy;

  return (
    <div className="w-full border-t border-border px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-6">
      <div className="mx-auto w-full max-w-[46rem]">
        <div className="rounded-3xl border border-border bg-well p-2 transition-colors focus-within:border-accent">
          <div className="flex items-end gap-2 pl-2 pr-1 pt-1.5">
            <textarea
              ref={taRef}
              value={draft}
              onChange={e => onDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message…"
              rows={1}
              maxLength={MAX_CHARS}
              aria-label="Message"
              className="max-h-[212px] min-h-[26px] flex-1 resize-none bg-transparent text-[15.5px] leading-[1.7] text-text placeholder:text-dim focus:outline-none"
            />
            {busy ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop"
                title="Stop"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-bg md:size-[34px]"
              >
                <StopIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label="Send"
                title="Send"
                className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors md:size-[34px] ${
                  // text-bg tracks the theme: dark arrow on the accent in dark
                  // mode (per design), near-white in light mode for contrast.
                  canSend ? 'bg-accent text-bg hover:opacity-90' : 'bg-hover text-dim'
                }`}
              >
                <ArrowUpIcon size={18} />
              </button>
            )}
          </div>
          {showCounter && (
            <div
              aria-live="off"
              className={`px-2 pb-1 pt-0.5 text-right text-[11.5px] tabular-nums ${nearEdge ? 'text-err' : 'text-dim'}`}
            >
              {len.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
