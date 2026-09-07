import { describe, expect, it, vi } from 'vitest';
import {
  allowWheelThroughScrollLock,
  canConsumeWheel,
} from './composed-wheel-scroll';

function scrollBox(opts: { top: number; height: number; content: number }) {
  const el = document.createElement('div');
  el.style.overflowY = 'auto';
  Object.defineProperty(el, 'scrollTop', { value: opts.top, writable: true });
  Object.defineProperty(el, 'clientHeight', { value: opts.height });
  Object.defineProperty(el, 'scrollHeight', { value: opts.content });
  return el;
}

describe('canConsumeWheel', () => {
  it('allows scrolling down when content remains below', () => {
    const el = scrollBox({ top: 0, height: 100, content: 400 });
    expect(canConsumeWheel(el, 80)).toBe(true);
  });

  it('does not steal wheel-up when already at the top', () => {
    const el = scrollBox({ top: 0, height: 100, content: 400 });
    expect(canConsumeWheel(el, -80)).toBe(false);
  });

  it('ignores non-scrollable nodes', () => {
    const el = document.createElement('div');
    expect(canConsumeWheel(el, 80)).toBe(false);
  });
});

describe('allowWheelThroughScrollLock', () => {
  it('scrolls the overflow node and blocks later document listeners', () => {
    const el = scrollBox({ top: 0, height: 100, content: 400 });
    const event = {
      deltaY: 80,
      cancelable: true,
      composedPath: () => [el],
      stopImmediatePropagation: vi.fn(),
      preventDefault: vi.fn(),
    };

    allowWheelThroughScrollLock(event as unknown as WheelEvent);

    expect(event.stopImmediatePropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(el.scrollTop).toBe(80);
  });

  it('scrolls a closed-shadow overflow node hidden from composedPath', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    const el = scrollBox({ top: 0, height: 100, content: 400 });
    shadow.appendChild(el);
    Object.assign(shadow, { elementFromPoint: () => el });

    const event = {
      deltaY: 80,
      clientX: 12,
      clientY: 12,
      cancelable: true,
      composedPath: () => [host, document],
      stopImmediatePropagation: vi.fn(),
      preventDefault: vi.fn(),
    };

    allowWheelThroughScrollLock(event as unknown as WheelEvent, shadow);

    expect(event.stopImmediatePropagation).toHaveBeenCalled();
    expect(el.scrollTop).toBe(80);
  });
});
