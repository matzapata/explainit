"use client";

import Navbar, { NavbarItem, NavbarProps } from "@/components/navbar/app";
import { IconHome } from "@/components/ui/icons";
import { Link, usePathname } from '@/lib/router';

interface SettingsLayoutProps extends NavbarProps {
  className?: string;
  children: React.ReactNode;
  navbarItems?: NavbarItem[];
  nestedItems?: NavbarItem[];
}

export default function SettingsLayout(props: SettingsLayoutProps) {
  const pathname = usePathname();
  const navbarItems = props.navbarItems ?? [
    {
      title: "Generate",
      icon: <IconHome className="h-5 w-5 text-gray-500" />,
      link: "/",
    },
  ];
  const nestedItems = props.nestedItems ?? [];

  return (
    <>
      <nav className={props.className ?? ""}>
        <Navbar items={navbarItems} user={props.user} />

        {/* Submenu */}
        {nestedItems.length > 0 && (
          <div className="border-b h-10 border-b-gray-200 flex justify-center bg-white dark:bg-gray-950 dark:border-b-gray-800">
            <div className="px-2 md:px-8 w-full flex py-2 items-center">
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
          </div>
        )}
      </nav>

      <main>{props.children}</main>
    </>
  );
}
