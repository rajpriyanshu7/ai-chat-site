'use client';

interface Props {
  draft: string;
  onDraft: (t: string) => void;
  onSend: (t: string) => void;
  onStop: () => void;
  busy: boolean;
}

export default function Composer({ draft, onDraft, onSend, onStop, busy }: Props) {
  function submit(): void {
    const t = draft.trim();
    if (!t || busy) return;
    onSend(t);
  }
  return (
    <div className="flex gap-2 border-t p-3">
      <input
        value={draft}
        onChange={e => onDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Message…"
        className="flex-1 rounded border px-3 py-2"
      />
      {busy ? (
        <button onClick={onStop} className="rounded bg-red-600 px-4 py-2 text-white">Stop</button>
      ) : (
        <button onClick={submit} className="rounded bg-black px-4 py-2 text-white">Send</button>
      )}
    </div>
  );
}
