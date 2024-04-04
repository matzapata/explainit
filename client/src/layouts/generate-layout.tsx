'use client';

import Navbar, { NavbarItem, NavbarProps } from '@/components/navbar/app';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface GenerateLayoutProps extends NavbarProps {
  className?: string;
  children: React.ReactNode;
  navbarItems?: NavbarItem[];
  nestedItems?: NavbarItem[];
  chatId?: string;
}

export default function GenerateLayout(props: GenerateLayoutProps) {
  const pathname = usePathname();

  const navbarItems = props.navbarItems ?? [];
  const nestedItems = props.nestedItems ?? [
    {
      link: '/app/generate',
      title: 'General',
    },
    {
      link: '/app/generate/resources',
      title: 'Resources',
    },
  ];

  return (
    <>
      <nav className={props.className ?? ''}>
        <Navbar items={navbarItems} user={props.user} />

        {/* Submenu */}
        {nestedItems && (
          <div className="border-b px-2 md:px-8  py-2 h-10 border-b-gray-200 flex justify-center items-center bg-white dark:bg-gray-950 dark:border-b-gray-800">
            <div className=" w-full flex items-center">
              {nestedItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.link}
                  className={
                    `${item.link == pathname? "dark:text-white" : "dark:text-gray-300"} px-3 py-2 text-sm font-semibold text-gray-700 rounded`
                  }
                >
                  {item.title}
                </Link>
              ))}
            </div>
            {props.chatId && (
              <Button size="xs" variant="secondary-color">
                <Link href={`/app/chat/${props.chatId}`}>Preview</Link>
              </Button>
            )}
          </div>
        )}
      </nav>

      <main>{props.children}</main>
    </>
  );
}
