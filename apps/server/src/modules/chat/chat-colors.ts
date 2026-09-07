export const CHAT_COLORS = [
  'purple',
  'blue',
  'cyan',
  'green',
  'red',
  'orange',
  'yellow',
  'gray',
] as const;

export type ChatColorName = (typeof CHAT_COLORS)[number];

export function nextAvailableColor(existing: string[]): ChatColorName {
  const counts = Object.fromEntries(
    CHAT_COLORS.map((color) => [color, 0]),
  ) as Record<ChatColorName, number>;

  for (const color of existing) {
    if (color in counts) {
      counts[color as ChatColorName] += 1;
    }
  }

  return CHAT_COLORS.reduce((best, color) =>
    counts[color] < counts[best] ? color : best,
  );
}
