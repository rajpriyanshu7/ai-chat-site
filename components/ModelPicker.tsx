'use client';

import { MODELS } from '@/lib/models';

// Quiet label-only dropdown for the Settings panel's "Assistant" section.
// Model ids never surface — only the labels configured in @/lib/models.
export default function ModelPicker({ model, onModel }: { model: string; onModel: (m: string) => void }) {
  return (
    <select
      value={model}
      onChange={e => onModel(e.target.value)}
      aria-label="Assistant"
      className="h-11 w-full cursor-pointer rounded-lg border border-border bg-well px-3 text-[14px] text-text md:h-10"
    >
      {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
    </select>
  );
}
