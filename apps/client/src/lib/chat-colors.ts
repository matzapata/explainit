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

export const CHAT_COLOR_CLASSES: Record<ChatColorName, string> = {
  purple: 'bg-purple-400',
  blue: 'bg-sky-400',
  cyan: 'bg-cyan-300',
  green: 'bg-emerald-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  gray: 'bg-gray-400',
};

export function isChatColor(
  value: string | undefined | null,
): value is ChatColorName {
  return !!value && (CHAT_COLORS as readonly string[]).includes(value);
}

export function chatColorClass(color?: string | null): string {
  if (isChatColor(color)) {
    return CHAT_COLOR_CLASSES[color];
  }
  return CHAT_COLOR_CLASSES.blue;
}

export function nextAvailableColor(
  existing: Array<string | undefined | null>,
): ChatColorName {
  const counts = Object.fromEntries(
    CHAT_COLORS.map((color) => [color, 0]),
  ) as Record<ChatColorName, number>;

  for (const color of existing) {
    if (isChatColor(color)) {
      counts[color] += 1;
    }
  }

  return CHAT_COLORS.reduce((best, color) =>
    counts[color] < counts[best] ? color : best,
  );
}
