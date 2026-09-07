"use client";

import Logo from "../brand/logo";
import { Link } from '@/lib/router';
import { LogoutLink } from "@/lib/auth/links";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLogOut } from "../ui/icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center sm:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          {items.length > 0 && (
            <div className="hidden md:flex items-center gap-4">
              {items.map((item, i) => (
                <Link
                  key={i}
                  href={item.link}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar>
              <AvatarImage src={props.user?.picture ?? undefined} />
              <AvatarFallback>
                {Array.from(props.user?.email ?? "c")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p>My Account</p>
                <p className="font-normal pr-4">{props.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutLink postLogoutRedirectURL="/">
                <div className="flex space-x-2 items-center">
                  <IconLogOut className="h-4 w-4 text-gray-900" />
                  <span className="ml-2">Logout</span>
                </div>
              </LogoutLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
