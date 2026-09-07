import {
  createContext,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  parseHostTheme,
  resolveHostTheme,
  type HostTheme,
  type ResolvedHostTheme,
} from '@/lib/host-theme';
import { usePortalContainer } from '@/lib/portal-container';

const HostThemeContext = createContext<ResolvedHostTheme>('light');

export function useHostTheme(): ResolvedHostTheme {
  return useContext(HostThemeContext);
}

function subscribePrefersDark(onStoreChange: () => void): () => void {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mq) {
    return () => undefined;
  }
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function prefersDarkSnapshot(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function usePrefersDark(): boolean {
  return useSyncExternalStore(
    subscribePrefersDark,
    prefersDarkSnapshot,
    () => false,
  );
}

export function HostThemeRoot(props: {
  theme?: HostTheme | string;
  children: ReactNode;
}) {
  const portal = usePortalContainer();
  const parsed = parseHostTheme(props.theme);
  const prefersDark = usePrefersDark();
  const resolved = resolveHostTheme(parsed, prefersDark);

  useLayoutEffect(() => {
    if (!portal) {
      return;
    }
    portal.classList.toggle('dark', resolved === 'dark');
    portal.style.colorScheme = resolved;
    return () => {
      portal.classList.remove('dark');
      portal.style.colorScheme = '';
    };
  }, [portal, resolved]);

  return (
    <HostThemeContext.Provider value={resolved}>
      {props.children}
    </HostThemeContext.Provider>
  );
}
