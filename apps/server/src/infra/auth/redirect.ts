export function safeReturnTo(value?: string | null, fallback = '/'): string {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

export function clientOrigin(corsOrigin: string): string {
  const trimmed = corsOrigin.trim();
  if (!trimmed || trimmed === '*') {
    return 'http://localhost:3000';
  }
  return trimmed.split(',')[0].trim().replace(/\/$/, '');
}
