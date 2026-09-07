'use client';

import Navbar, { NavbarItem, NavbarProps } from '@/components/navbar/app';
import { PreviewChat } from '@/components/chat/preview-chat';
import { Link, usePathname } from '@/lib/router';
import { ChatMetadataDto } from '@/lib/services/chat-service';

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
      title: 'General',
    },
    {
      link: `/chats/${chatId}/resources`,
      title: 'Resources',
    },
  ];

  return (
    <>
      <Navbar items={navbarItems} user={props.user} />

      <main className={props.className ?? ''}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white shrink-0"
              >
                Chats
              </Link>
              <span className="text-sm text-gray-300 dark:text-gray-600">/</span>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
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

          <nav className="flex gap-5 border-b border-gray-200 dark:border-gray-800">
            {nestedItems.map((item, i) => {
              const active = pathsMatch(item.link, pathname);
              return (
                <Link
                  key={i}
                  href={item.link}
                  className={`py-2 text-sm -mb-px ${
                    active
                      ? 'border-b border-gray-900 dark:border-gray-100 font-medium text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
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
