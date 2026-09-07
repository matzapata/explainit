import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PortalContainerContext } from '@/lib/portal-container';
import { HostThemeRoot, useHostTheme } from './host-theme-root';

function ThemeLabel() {
  const theme = useHostTheme();
  return <span>{theme}</span>;
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe('HostThemeRoot', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('puts dark class and color-scheme on the portal container when theme is dark', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    render(
      <PortalContainerContext.Provider value={container}>
        <HostThemeRoot theme="dark">
          <ThemeLabel />
        </HostThemeRoot>
      </PortalContainerContext.Provider>,
    );

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(container.classList.contains('dark')).toBe(true);
    expect(container.style.colorScheme).toBe('dark');
    container.remove();
  });

  it('keeps the portal container light when theme is light', () => {
    mockMatchMedia(true);
    const container = document.createElement('div');
    document.body.appendChild(container);

    render(
      <PortalContainerContext.Provider value={container}>
        <HostThemeRoot theme="light">
          <ThemeLabel />
        </HostThemeRoot>
      </PortalContainerContext.Provider>,
    );

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(container.classList.contains('dark')).toBe(false);
    expect(container.style.colorScheme).toBe('light');
    container.remove();
  });

  it('follows prefers-color-scheme when theme is system', () => {
    mockMatchMedia(true);
    const container = document.createElement('div');
    document.body.appendChild(container);

    render(
      <PortalContainerContext.Provider value={container}>
        <HostThemeRoot theme="system">
          <ThemeLabel />
        </HostThemeRoot>
      </PortalContainerContext.Provider>,
    );

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(container.classList.contains('dark')).toBe(true);
    container.remove();
  });
});
