"use client";

import { Bars4Icon } from "@heroicons/react/24/solid";
import Logo from "../brand/logo";
import Link from "next/link";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLifeBuoy, IconLogOut, IconSettings } from "../ui/icons";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import GoProButton from "../billing/go-pro-button";

export interface NavbarProps {
  items?: NavbarItem[];
  user: { email?: string; isPro?: boolean; picture?: string };
}
export interface NavbarItem {
  title: string;
  link: string;
  icon?: React.ReactNode;
}

export default function Navbar(props: NavbarProps) {
  const items = props.items ?? [];

  return (
    <div className="border-b h-16 bg-white dark:bg-gray-950 border-b-gray-200 dark:border-b-gray-800 flex justify-center">
      <div className="px-4 md:px-8 w-full flex justify-between py-3 items-center">
        <div className="flex items-center">
          <Logo />
          <div className="hidden md:flex items-center space-x-2 ml-4">
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.link}
                className={"px-3 py-1 text-md font-semibold text-gray-700 dark:text-gray-200"}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div>
            {props.user.isPro ? (
              <div className="bg-brand-200 text-xs px-2 py-0.5 rounded-full text-brand-600 font-medium border border-brand-600">
                PRO
              </div>
            ) : (
              <GoProButton />
            )}
          </div>

          <Link
            href={"/app/settings"}
            className="rounded-md py-2 px-[10px] hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <IconSettings className="h-5 w-5 dark:text-gray-100" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Avatar>
                {/* TODO: add image */}
                <AvatarImage src={undefined} />
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
        </div>

        {/* Mobile burger and menu */}
        <div className="md:hidden flex space-x-4 items-center">
          <div>
            {props.user.isPro ? (
              <div className="bg-brand-200 text-xs px-2 py-0.5 rounded-full text-brand-600 font-medium border border-brand-600">
                PRO
              </div>
            ) : (
              <GoProButton />
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="items-center h-9 w-9 p-0 flex justify-center text-gray-900 dark:text-white">
                <Bars4Icon className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="inset-y-0 flex h-auto w-[300px] flex-col p-0"
            >
              <div className="p-4 border-b">
                <Logo />
              </div>

              <div className="space-y-2 px-2 flex-1">
                {items.map((item, i) => (
                  <SidebarNavItem
                    key={i}
                    href={item.link}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>

              <div className="divide-y">
                <div className="mb-6 space-y-2">
                  <SidebarNavItem
                    href="/contact"
                    title="Support"
                    icon={<IconLifeBuoy className="h-5 w-5 text-gray-500" />}
                  />
                  <SidebarNavItem
                    title="Settings"
                    href="/app/settings"
                    icon={<IconSettings className="h-5 w-5 text-gray-500" />}
                  />
                </div>

                <div className="flex items-center justify-between py-6 px-2">
                  <div className="flex ml-2">
                    {/* Avatar */}
                    <Avatar>
                      <AvatarImage src={props.user?.picture ?? undefined} />
                      <AvatarFallback>
                        {Array.from(props.user?.email ?? "c")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name and email */}
                    <div className="ml-3 items-center flex">
                      <p className="text-sm">{props.user?.email}</p>
                    </div>
                  </div>

                  <LogoutLink postLogoutRedirectURL="/">
                    <button className="p-2">
                      <IconLogOut className="h-5 w-5 text-gray-500" />
                    </button>
                  </LogoutLink>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

function SidebarNavItem(props: {
  active?: boolean;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={props.href}>
      <div
        className={`px-3 flex space-x-3 py-2 items-center rounded-md ${
          props.active ? "bg-gray-50" : ""
        }`}
      >
        {props.icon}
        <a href="#" className="text-gray-700 font-semibold">
          {props.title}
        </a>
      </div>
    </Link>
  );
}
