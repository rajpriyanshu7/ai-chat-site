'use client';

import { MODELS } from '@/lib/models';

export default function ModelPicker({ model, onModel }: { model: string; onModel: (m: string) => void }) {
  return (
    <select value={model} onChange={e => onModel(e.target.value)} className="mt-2 rounded border px-2 py-1">
      {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
    </select>
  );
}
