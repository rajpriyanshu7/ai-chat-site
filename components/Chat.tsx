'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { deleteConversation, loadConversations, saveConversation, type Conversation } from '@/lib/history';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import Composer from './Composer';
import SettingsPanel from './SettingsPanel';
import { AlertIcon, GearIcon, MenuIcon, SquarePenIcon } from './icons';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState('test-model');
  const [draft, setDraft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // NOTE (Task 7 adaptation): useChat builds its Chat once on mount and keeps
  // the transport instance, so a plain `body: { model }` object would freeze
  // the first model value forever. `body` accepts a function resolved per
  // request, so read the live model through a ref instead.
  const modelRef = useRef(model);
  modelRef.current = model;

  const { messages, sendMessage, stop, status, regenerate, setMessages, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat', body: () => ({ model: modelRef.current }) }),
  });
  const busy = status === 'streaming' || status === 'submitted';

  useEffect(() => { setConversations(loadConversations()); }, []);

  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    const firstText = messages.find(m => m.role === 'user')?.parts.find(p => p.type === 'text');
    const title = (firstText && 'text' in firstText ? firstText.text : 'Chat').slice(0, 40);
    saveConversation({ id: activeId, title, model, updatedAt: Date.now(), messages });
    setConversations(loadConversations());
  }, [messages, activeId, model]);

  // Top bar title — same derivation as the history store (first user text).
  const title = useMemo(() => {
    const firstText = messages.find(m => m.role === 'user')?.parts.find(p => p.type === 'text');
    return (firstText && 'text' in firstText ? firstText.text : '').slice(0, 40);
  }, [messages]);

  // Escape closes the topmost surface: settings first, then the mobile drawer.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key !== 'Escape') return;
      if (settingsOpen) setSettingsOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, drawerOpen]);

  function newChat(): void {
    setMessages([]);
    setActiveId(uid());
  }

  function send(text: string): void {
    if (!activeId) setActiveId(uid());
    setDraft('');
    void sendMessage({ parts: [{ type: 'text', text }] });
  }

  function editAndRetry(index: number): void {
    const msg = messages[index];
    if (!msg || msg.role !== 'user') return;
    const t = msg.parts.filter(p => p.type === 'text').map(p => ('text' in p ? p.text : '')).join('');
    setMessages(messages.slice(0, index));
    setDraft(t);
    composerRef.current?.focus();
  }

  function open(id: string): void {
    const c = loadConversations().find(x => x.id === id);
    if (!c) return;
    setActiveId(id);
    setModel(c.model);
    setMessages(c.messages);
  }

  function remove(id: string): void {
    deleteConversation(id);
    setConversations(loadConversations());
    if (id === activeId) {
      setMessages([]);
      setActiveId(uid());
    }
  }

  function suggest(text: string): void {
    setDraft(text);
    composerRef.current?.focus();
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-text">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={open}
        onNew={newChat}
        onDelete={remove}
        onSettings={() => setSettingsOpen(true)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Slim top bar: hamburger + title + settings on mobile; title +
            new-chat on desktop. No status text, no jargon. */}
        <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-2 md:px-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex size-11 items-center justify-center rounded-lg text-dim transition-colors hover:bg-hover hover:text-text md:hidden"
          >
            <MenuIcon size={19} />
          </button>
          <div className="min-w-0 flex-1 truncate px-2 text-[13.5px] text-dim">{title}</div>
          <button
            type="button"
            aria-label="New chat"
            title="New chat"
            onClick={newChat}
            className="hidden size-9 items-center justify-center rounded-lg text-dim transition-colors hover:bg-hover hover:text-text md:flex"
          >
            <SquarePenIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
            className="flex size-11 items-center justify-center rounded-lg text-dim transition-colors hover:bg-hover hover:text-text md:hidden"
          >
            <GearIcon size={19} />
          </button>
        </header>

        <MessageList
          messages={messages}
          onRegenerate={() => regenerate()}
          onEdit={editAndRetry}
          streaming={busy}
          onSuggest={suggest}
        />

        {status === 'error' && (
          <div role="alert" className="mx-auto w-full max-w-[46rem] px-3 pb-2 md:px-6">
            <div className="flex items-start gap-2.5 rounded-lg border-l-[3px] border-l-err bg-hover px-3.5 py-2.5">
              <span className="mt-0.5 shrink-0 text-err">
                <AlertIcon size={16} />
              </span>
              <p className="min-w-0 flex-1 py-0.5 text-[14px] leading-snug text-text">
                {error?.message ?? 'The request failed.'}
              </p>
              <button
                type="button"
                onClick={() => regenerate()}
                className="mt-0.5 shrink-0 rounded-full border border-border px-3 py-1 text-[13px] font-medium text-text transition-colors hover:bg-well"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <Composer draft={draft} onDraft={setDraft} onSend={send} onStop={stop} busy={busy} inputRef={composerRef} />
      </main>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-side shadow-[var(--sheet-shadow)] sm:rounded-2xl">
            <SettingsPanel onClose={() => setSettingsOpen(false)} model={model} onModel={setModel} />
          </div>
        </div>
      )}
    </div>
  );
}
