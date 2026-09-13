import { describe, expect, it } from 'vitest';
import { applyTheme, effectiveTheme, persistThemeChoice, readThemeChoice, THEME_KEY, type ThemeChoice } from '../theme';

function memStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    snapshot: () => store,
  };
}

describe('theme persistence', () => {
  it('defaults to dark when nothing valid is stored', () => {
    expect(readThemeChoice(memStorage())).toBe('dark');
    expect(readThemeChoice(memStorage({ [THEME_KEY]: 'solarized' }))).toBe('dark');
  });

  it('returns the stored light/dark/system choice', () => {
    for (const choice of ['light', 'dark', 'system'] as ThemeChoice[]) {
      expect(readThemeChoice(memStorage({ [THEME_KEY]: choice }))).toBe(choice);
    }
  });

  it('does not throw when storage access raises', () => {
    const boom = {
      getItem: () => { throw new Error('denied'); },
    };
    expect(readThemeChoice(boom)).toBe('dark');
  });

  it('resolves system against the OS preference', () => {
    expect(effectiveTheme('system', true)).toBe('light');
    expect(effectiveTheme('system', false)).toBe('dark');
    expect(effectiveTheme('light', false)).toBe('light');
    expect(effectiveTheme('dark', true)).toBe('dark');
  });

  it('toggles the light class only', () => {
    const classes = new Set<string>();
    const el = { classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) } };
    applyTheme(el, 'light');
    expect(classes.has('light')).toBe(true);
    applyTheme(el, 'dark');
    expect(classes.has('light')).toBe(false);
  });

  it('persists choices and swallows write errors', () => {
    const s = memStorage();
    persistThemeChoice(s, 'system');
    expect(s.snapshot()[THEME_KEY]).toBe('system');
    expect(() => persistThemeChoice({ setItem: () => { throw new Error('full'); } }, 'light')).not.toThrow();
  });
});
