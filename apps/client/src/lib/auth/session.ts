import { cookies } from 'next/headers';
import {
  getAuthMode,
  NONE_ACCESS_TOKEN,
  TOKEN_COOKIE,
} from './config';

export { getAuthMode, loginHref, safeReturnTo } from './config';
export type { AuthMode } from './config';

export async function getAccessToken(): Promise<string> {
  if (getAuthMode() === 'none') {
    return NONE_ACCESS_TOKEN;
  }

  return cookies().get(TOKEN_COOKIE)?.value ?? '';
}

export async function isAuthenticated(): Promise<boolean> {
  if (getAuthMode() === 'none') {
    return true;
  }

  return !!(await getAccessToken());
}
