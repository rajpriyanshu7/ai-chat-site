'use client';

import { useState } from 'react';

export default function Composer({ onSend, disabled }: { onSend: (t: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('');
  function submit(): void {
    const t = value.trim();
    if (!t || disabled) return;
    setValue('');
    onSend(t);
  }
  return (
    <div className="flex gap-2 border-t p-3">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Message…"
        disabled={disabled}
        className="flex-1 rounded border px-3 py-2"
      />
      <button onClick={submit} disabled={disabled} className="rounded bg-black px-4 py-2 text-white">Send</button>
    </div>
  );
}
