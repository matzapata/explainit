export const HOST_THEMES = ['light', 'dark', 'system'] as const;

export type HostTheme = (typeof HOST_THEMES)[number];
export type ResolvedHostTheme = 'light' | 'dark';

export function parseHostTheme(value: unknown): HostTheme {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

export function resolveHostTheme(
  theme: HostTheme,
  prefersDark: boolean,
): ResolvedHostTheme {
  if (theme === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return theme;
}
