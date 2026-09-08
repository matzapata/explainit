'use client';

import { PreviewChat } from '@/components/chat/preview-chat';
import Navbar, {
  type NavbarItem,
  type NavbarProps,
} from '@/components/navbar/app';
import { Link, usePathname } from '@/lib/router';
import type { ChatMetadataDto } from '@/lib/services/chat-service';

interface GenerateLayoutProps extends NavbarProps {
  className?: string;
  children: React.ReactNode;
  navbarItems?: NavbarItem[];
  nestedItems?: NavbarItem[];
  chat: ChatMetadataDto;
}

function pathsMatch(a: string, b: string) {
  return a.replace(/\/$/, '') === b.replace(/\/$/, '');
}

export default function GenerateLayout(props: GenerateLayoutProps) {
  const pathname = usePathname();
  const chatId = props.chat.id;
  const chatName = props.chat.name?.trim() || 'Untitled chat';

  const navbarItems = props.navbarItems ?? [];
  const nestedItems = props.nestedItems ?? [
    {
      link: `/chats/${chatId}`,
      title: 'Settings',
    },
    {
      link: `/chats/${chatId}/resources`,
      title: 'Resources',
    },
    {
      link: `/chats/${chatId}/setup`,
      title: 'Setup',
    },
  ];

  return (
    <>
      <Navbar items={navbarItems} user={props.user} />

      <main className={props.className ?? ''}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <Link
                href="/"
                className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100 shrink-0"
              >
                Chats
              </Link>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <h1 className="font-medium text-gray-900 dark:text-white truncate">
                {chatName}
              </h1>
            </div>
            <PreviewChat
              chat={props.chat}
              variant="outline"
              size="sm"
              className="shrink-0"
            />
          </div>

          <nav className="flex gap-5 border-b border-gray-200 dark:border-white/10">
            {nestedItems.map((item) => {
              const active = pathsMatch(item.link, pathname);
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  data-text={item.title}
                  className={`tab-link py-2 text-sm -mb-px ${
                    active
                      ? 'border-b border-gray-900 dark:border-gray-100 font-medium text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5">{props.children}</div>
        </div>
      </main>
    </>
  );
}
