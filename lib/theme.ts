// Theme persistence. Dark is the default at first paint (no class on <html>);
// the `.light` class opts into the light token set. The persisted choice lives
// in localStorage under THEME_KEY and is applied by (a) a tiny inline script in
// app/layout.tsx before first paint and (b) the Settings panel when changed.

export type ThemeChoice = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_KEY = 'aichat:theme:v1';
export const DEFAULT_THEME: ThemeChoice = 'dark';

/** Minimal storage surface (localStorage-compatible) so tests can stub it. */
export interface ThemeStorage {
  getItem(key: string): string | null;
}

/** Reads the persisted choice; anything missing/corrupt falls back to dark. */
export function readThemeChoice(storage: ThemeStorage): ThemeChoice {
  try {
    const raw = storage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // storage unavailable (private mode, SSR, ...) — fall through to default
  }
  return DEFAULT_THEME;
}

/** Resolves a choice (including 'system') to a concrete theme. */
export function effectiveTheme(choice: ThemeChoice, prefersLight: boolean): EffectiveTheme {
  if (choice === 'system') return prefersLight ? 'light' : 'dark';
  return choice;
}

/** Applies a concrete theme by toggling the `.light` class on an element. */
export function applyTheme(
  el: { classList: { add(c: string): void; remove(c: string): void } },
  theme: EffectiveTheme,
): void {
  if (theme === 'light') el.classList.add('light');
  else el.classList.remove('light');
}

/** Builds the value a client should persist for a choice (never throws). */
export function persistThemeChoice(storage: { setItem(k: string, v: string): void }, choice: ThemeChoice): void {
  try {
    storage.setItem(THEME_KEY, choice);
  } catch {
    // storage unavailable — theme still applies for this session
  }
}
