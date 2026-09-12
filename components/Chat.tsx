'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { deleteConversation, loadConversations, saveConversation, type Conversation } from '@/lib/history';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import Composer from './Composer';
import SettingsPanel from './SettingsPanel';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState('test-model');
  const [draft, setDraft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <div className="flex h-screen">
      <Sidebar conversations={conversations} activeId={activeId} onSelect={open} onNew={newChat} onDelete={remove} model={model} onModel={setModel} onSettings={() => setSettingsOpen(true)} />
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm bg-white">
            <SettingsPanel onClose={() => setSettingsOpen(false)} />
          </div>
        </div>
      )}
      <main className="flex flex-1 flex-col">
        <MessageList messages={messages} onRegenerate={() => regenerate()} onEdit={editAndRetry} />
        {status === 'error' && (
          <div role="alert" className="mx-4 mb-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error?.message ?? 'The request failed.'}{' '}
            <button onClick={() => regenerate()} className="underline">Retry</button>
          </div>
        )}
        <Composer draft={draft} onDraft={setDraft} onSend={send} onStop={stop} busy={busy} />
      </main>
    </div>
  );
}
