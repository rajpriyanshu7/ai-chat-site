'use client';

import { clearAll, loadConversations } from '@/lib/history';

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  function exportJson(): void {
    const blob = new Blob([JSON.stringify(loadConversations(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-chats.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function wipe(): void {
    if (confirm('Delete all chats on this device?')) {
      clearAll();
      onClose();
      location.reload();
    }
  }
  function toggleTheme(): void {
    document.documentElement.classList.toggle('dark');
  }
  return (
    <div className="rounded border p-4">
      <h2 className="font-bold">Settings</h2>
      <div className="mt-2 flex flex-col gap-2">
        <button onClick={exportJson} className="rounded border px-3 py-1">Export my chats (JSON)</button>
        <button onClick={toggleTheme} className="rounded border px-3 py-1">Toggle theme</button>
        <button onClick={wipe} className="rounded border border-red-500 px-3 py-1 text-red-600">Delete all my chats</button>
        <button onClick={onClose} className="rounded px-3 py-1 text-gray-500">Close</button>
      </div>
    </div>
  );
}
