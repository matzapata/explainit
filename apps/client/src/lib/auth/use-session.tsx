'use client';

import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
import { type AuthMode, NONE_ACCESS_TOKEN } from './config';

export interface SessionUser {
  email?: string;
}

interface SessionValue {
  accessToken: string;
  user: SessionUser | null;
  isAuthenticated: boolean;
  mode: AuthMode;
}

const SessionContext = createContext<SessionValue>({
  accessToken: NONE_ACCESS_TOKEN,
  user: { email: 'local' },
  isAuthenticated: true,
  mode: 'none',
});

function userFromToken(token: string, mode: AuthMode): SessionUser | null {
  if (mode === 'none') {
    return { email: 'local' };
  }
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );
    return { email: json.email };
  } catch {
    return { email: undefined };
  }
}

export function AuthProvider({
  children,
  accessToken,
  mode,
}: {
  children: React.ReactNode;
  accessToken: string;
  mode: AuthMode;
}) {
  const value = useMemo<SessionValue>(() => {
    const user = userFromToken(accessToken, mode);
    return {
      accessToken,
      user,
      isAuthenticated: mode === 'none' ? true : !!accessToken,
      mode,
    };
  }, [accessToken, mode]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

export function useAccessToken(): string {
  return useContext(SessionContext).accessToken;
}
