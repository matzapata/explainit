import { describe, expect, it } from 'vitest';
import { parseHostTheme, resolveHostTheme } from './host-theme';

describe('parseHostTheme', () => {
  it('accepts light, dark, and system', () => {
    expect(parseHostTheme('light')).toBe('light');
    expect(parseHostTheme('dark')).toBe('dark');
    expect(parseHostTheme('system')).toBe('system');
  });

  it('defaults unknown values to system', () => {
    expect(parseHostTheme(undefined)).toBe('system');
    expect(parseHostTheme('auto')).toBe('system');
    expect(parseHostTheme(1)).toBe('system');
  });
});

describe('resolveHostTheme', () => {
  it('returns light or dark when the Host asks for them', () => {
    expect(resolveHostTheme('light', true)).toBe('light');
    expect(resolveHostTheme('dark', false)).toBe('dark');
  });

  it('follows prefers-color-scheme when the Host asks for system', () => {
    expect(resolveHostTheme('system', true)).toBe('dark');
    expect(resolveHostTheme('system', false)).toBe('light');
  });
});
