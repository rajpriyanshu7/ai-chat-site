'use client';

import { useState } from 'react';
import type { Conversation } from '@/lib/history';
import ModelPicker from './ModelPicker';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  model: string;
  onModel: (m: string) => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, model, onModel }: Props) {
  const [q, setQ] = useState('');
  const filtered = conversations.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <aside className="flex w-64 flex-col border-r p-3">
      <button onClick={onNew} className="rounded bg-black px-3 py-2 text-white">+ New chat</button>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chats" className="mt-2 rounded border px-2 py-1" />
      <div className="mt-2 flex-1 overflow-y-auto">
        {filtered.map(c => (
          <div key={c.id} className={`flex items-center justify-between rounded px-2 py-1 ${c.id === activeId ? 'bg-gray-200' : ''}`}>
            <button onClick={() => onSelect(c.id)} className="flex-1 truncate text-left">{c.title}</button>
            <button aria-label={`Delete ${c.title}`} onClick={() => onDelete(c.id)} className="ml-2 text-gray-500">×</button>
          </div>
        ))}
      </div>
      <ModelPicker model={model} onModel={onModel} />
    </aside>
  );
}
