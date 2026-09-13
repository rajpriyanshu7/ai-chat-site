'use client';

import { useState } from 'react';
import { clearAll, loadConversations } from '@/lib/history';
import { applyTheme, effectiveTheme, persistThemeChoice, readThemeChoice, type ThemeChoice } from '@/lib/theme';
import ModelPicker from './ModelPicker';
import { DownloadIcon, XIcon } from './icons';

interface Props {
  onClose: () => void;
  model: string;
  onModel: (m: string) => void;
}

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsPanel({ onClose, model, onModel }: Props) {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice(window.localStorage));

  function chooseTheme(c: ThemeChoice): void {
    setChoice(c);
    persistThemeChoice(window.localStorage, c);
    applyTheme(
      document.documentElement,
      effectiveTheme(c, window.matchMedia('(prefers-color-scheme: light)').matches),
    );
  }

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

  return (
    <div role="dialog" aria-modal="true" aria-label="Settings" className="flex max-h-[85dvh] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-[16px] font-semibold text-text">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          autoFocus
          className="flex size-11 items-center justify-center rounded-lg text-dim transition-colors hover:bg-hover hover:text-text md:size-9"
        >
          <XIcon size={17} />
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
        <section>
          <h3 className="mb-2 text-[13px] font-medium text-dim">Appearance</h3>
          {/* Toggle-button group (not radiogroup: no arrow-key APG pattern to
              violate); aria-pressed carries the selected state. */}
          <div role="group" aria-label="Theme" className="flex rounded-lg border border-border bg-well p-1">
            {THEMES.map(t => (
              <button
                key={t.value}
                type="button"
                aria-pressed={choice === t.value}
                onClick={() => chooseTheme(t.value)}
                className={`h-11 flex-1 rounded-md text-[13.5px] font-medium transition-colors md:h-9 ${
                  choice === t.value ? 'bg-bg text-text' : 'text-dim hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[13px] font-medium text-dim">Assistant</h3>
          <ModelPicker model={model} onModel={onModel} />
        </section>

        <section>
          <h3 className="mb-2 text-[13px] font-medium text-dim">Data</h3>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={exportJson}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-3 text-[14px] text-text transition-colors hover:bg-hover md:h-10"
            >
              <DownloadIcon size={15} />
              Export my chats
            </button>
            <button
              type="button"
              onClick={wipe}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-err/40 px-3 text-[14px] text-err transition-colors hover:bg-hover md:h-10"
            >
              Delete all chats
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
