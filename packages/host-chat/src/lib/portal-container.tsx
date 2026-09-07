import { createContext, useContext } from 'react';

/** When set (Host widget ShadowRoot), Radix portals render here instead of document.body. */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}
