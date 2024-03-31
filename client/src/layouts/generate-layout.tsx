'use client';

import Navbar, { NavbarItem, NavbarProps } from '@/components/navbar/app';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface GenerateLayoutProps extends NavbarProps {
  className?: string;
  children: React.ReactNode;
  navbarItems?: NavbarItem[];
  nestedItems?: NavbarItem[];
}

export default function GenerateLayout(props: GenerateLayoutProps) {
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
                    'px-3 py-2 text-sm font-semibold text-gray-700 rounded dark:text-gray-300 dark:hover:text-gray-100 '
                  }
                >
                  {item.title}
                </Link>
              ))}
            </div>
            <Button size="xs" variant="secondary-color">
              Preview
            </Button>
          </div>
        )}
      </nav>

      <main>{props.children}</main>
    </>
  );
}
