'use client';

import { useState } from 'react';
import type { Conversation } from '@/lib/history';
import Markdown from './Markdown';
import { CopyIcon, PencilIcon, RotateIcon } from './icons';

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
  /** Show the blinking block caret (set on the streaming assistant message). */
  streaming?: boolean;
}

export default function MessageItem({ message, onEdit, onRegenerate, streaming }: Props) {
  const mine = message.role === 'user';
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(textOf(message));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), 1500);
  }

  if (mine) {
    return (
      <div className="group flex flex-col items-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-well px-4 py-2.5 text-[15.5px] leading-[1.7] text-text md:max-w-[75%]">
          {textOf(message)}
        </div>
        {onEdit != null && (
          <div className="reveal mt-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-dim transition-colors hover:bg-hover hover:text-text"
            >
              <PencilIcon size={14} />
              Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group flex flex-col">
      <div className={streaming ? 'md-caret' : undefined}>
        <Markdown text={textOf(message)} />
      </div>
      <div className="reveal mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={copy}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-dim transition-colors hover:bg-hover hover:text-text"
        >
          <CopyIcon size={14} />
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
        </button>
        {onRegenerate != null && (
          <button
            type="button"
            onClick={onRegenerate}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-dim transition-colors hover:bg-hover hover:text-text"
          >
            <RotateIcon size={14} />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
