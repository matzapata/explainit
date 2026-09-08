'use client';

import { useId } from 'react';
import {
  CHAT_COLORS,
  type ChatColorName,
  chatColorClass,
} from '@/lib/chat-colors';

export function ChatColorDot({
  color,
  className = 'h-2.5 w-2.5',
}: {
  color?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`shrink-0 rounded-full ${className} ${chatColorClass(color)}`}
      aria-hidden
    />
  );
}

export function ChatColorPicker({
  value,
  onChange,
}: {
  value: ChatColorName;
  onChange: (color: ChatColorName) => void;
}) {
  const inputName = useId();

  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-1.5">Color</legend>
      <div className="flex gap-1.5">
        {CHAT_COLORS.map((color) => (
          <label key={color} className="cursor-pointer">
            <input
              type="radio"
              name={inputName}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              className="peer sr-only"
            />
            <span
              className={`block h-6 w-6 rounded-full ${chatColorClass(color)} peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-gray-400 dark:peer-checked:ring-offset-gray-950`}
            />
            <span className="sr-only">{color}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
