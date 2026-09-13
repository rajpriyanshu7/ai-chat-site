'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Conversation } from '@/lib/history';
import { GearIcon, SearchIcon, SquarePenIcon, TrashIcon } from './icons';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  /** Mobile drawer: open/closed state (ignored at md+ where it is static). */
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, onSettings, open, onClose }: Props) {
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = conversations.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));

  // Cmd/Ctrl+K focuses chat search (desktop only, where the sidebar is visible).
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (!window.matchMedia('(min-width: 768px)').matches) return;
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside
      aria-label="Chats"
      className={`drawer-slide fixed inset-y-0 left-0 z-40 flex h-full w-[264px] max-w-[85vw] shrink-0 flex-col border-r border-border bg-side md:static md:z-auto md:max-w-none md:translate-x-0 ${
        // Closed drawer is visibility-hidden below md so its controls leave
        // the tab order and a11y tree; desktop is always visible (md: rule).
        open ? 'translate-x-0' : '-translate-x-full max-md:invisible'
      }`}
    >
      <div className="flex flex-col gap-2 p-3">
        <button
          type="button"
          onClick={() => { onNew(); onClose(); }}
          className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-well px-4 text-[14px] font-medium text-text transition-colors hover:bg-hover md:h-10"
        >
          <SquarePenIcon size={17} />
          New chat
        </button>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            <SearchIcon size={15} />
          </span>
          <input
            ref={searchRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search chats"
            className="h-11 w-full rounded-full border border-transparent bg-well pl-9 pr-3 text-[13.5px] text-text placeholder:text-dim focus:border-accent focus:outline-none md:h-10"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-2" aria-label="Chat history">
        {filtered.map(c => (
          <div
            key={c.id}
            className={`group mb-0.5 flex items-center rounded-lg ${
              c.id === activeId ? 'bg-accent-soft' : 'hover:bg-hover'
            }`}
          >
            <button
              type="button"
              onClick={() => { onSelect(c.id); onClose(); }}
              className={`min-h-11 flex-1 truncate px-3 py-2 text-left text-[13.5px] ${
                c.id === activeId ? 'text-accent' : 'text-text'
              }`}
            >
              {c.title}
            </button>
            <button
              type="button"
              aria-label={`Delete ${c.title}`}
              onClick={e => { e.stopPropagation(); onDelete(c.id); }}
              className="reveal mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-dim transition-colors hover:bg-hover hover:text-text md:size-9"
            >
              <TrashIcon size={15} />
            </button>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { onSettings(); onClose(); }}
          className="flex h-11 items-center gap-2.5 rounded-lg px-2 text-[13.5px] text-text transition-colors hover:bg-hover md:h-10"
        >
          <GearIcon size={17} />
          Settings
        </button>
        <nav className="flex gap-3 px-2 pt-1.5 text-[12px] text-dim" aria-label="Legal">
          <Link href="/privacy" className="flex min-h-[44px] items-center hover:text-text hover:underline md:min-h-0">Privacy</Link>
          <Link href="/terms" className="flex min-h-[44px] items-center hover:text-text hover:underline md:min-h-0">Terms</Link>
        </nav>
      </div>
    </aside>
  );
}
