'use client';

import { useEffect, useState } from 'react';
import { deleteConversation, loadConversations, saveConversation, type Conversation } from '@/lib/history';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import Composer from './Composer';

type ChatMessage = Conversation['messages'][number];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState('test-model');

  useEffect(() => { setConversations(loadConversations()); }, []);

  const active = conversations.find(c => c.id === activeId) ?? null;

  function newChat(): void {
    const c: Conversation = { id: uid(), title: 'New chat', model, updatedAt: Date.now(), messages: [] };
    saveConversation(c);
    setConversations(loadConversations());
    setActiveId(c.id);
  }

  function send(text: string): void {
    const userMsg: ChatMessage = { id: uid(), role: 'user', parts: [{ type: 'text', text }] };
    const base: Conversation = active ?? { id: uid(), title: text.slice(0, 40) || 'New chat', model, updatedAt: Date.now(), messages: [] };
    const withUser: Conversation = {
      ...base,
      title: base.messages.length === 0 ? text.slice(0, 40) || 'New chat' : base.title,
      updatedAt: Date.now(),
      messages: [...base.messages, userMsg,
        { id: uid(), role: 'assistant', parts: [{ type: 'text', text: 'Backend not connected yet.' }] }],
    };
    saveConversation(withUser);
    setConversations(loadConversations());
    setActiveId(withUser.id);
  }

  function remove(id: string): void {
    deleteConversation(id);
    setConversations(loadConversations());
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="flex h-screen">
      <Sidebar conversations={conversations} activeId={activeId} onSelect={setActiveId} onNew={newChat} onDelete={remove} model={model} onModel={setModel} />
      <main className="flex flex-1 flex-col">
        <MessageList messages={active?.messages ?? []} />
        <Composer onSend={send} />
      </main>
    </div>
  );
}
