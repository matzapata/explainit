'use client';

import { LogoutLink } from '@/lib/auth/links';
import { useSession } from '@/lib/auth/use-session';
import { Link } from '@/lib/router';
import Logo from '../brand/logo';

export interface NavbarProps {
  items?: NavbarItem[];
  user: { email?: string; picture?: string };
}
export interface NavbarItem {
  title: string;
  link: string;
  icon?: React.ReactNode;
}

export default function Navbar(props: NavbarProps) {
  const items = props.items ?? [];
  const { mode } = useSession();

  return (
    <>
      <header
        className={
          mode === 'none' ? '' : 'border-b border-gray-200 dark:border-white/10'
        }
      >
        <nav className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            {items.length > 0 && (
              <div className="hidden md:flex items-center gap-4">
                {items.map((item) => (
                  <Link
                    key={item.link}
                    href={item.link}
                    className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {mode !== 'none' ? (
            <LogoutLink
              postLogoutRedirectURL="/"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Logout
            </LogoutLink>
          ) : null}
        </nav>
      </header>
      {mode === 'none' ? <NoAuthBanner /> : null}
    </>
  );
}

function NoAuthBanner() {
  return (
    <div className="border-y border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      No auth configured. Set{' '}
      <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-amber-900/60">
        HTTP_AUTH_USERNAME
      </code>{' '}
      /{' '}
      <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-amber-900/60">
        HTTP_AUTH_PASSWORD
      </code>{' '}
      to secure this instance.
    </div>
  );
}
