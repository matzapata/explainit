"use client";

import { Bars4Icon } from "@heroicons/react/24/solid";
import Logo from "../brand/logo";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const navbarItems = [
  { title: "Home", href: "/" },
  { title: "Features", href: "/#features" },
  { title: "FAQ", href: "/#faq" },
  { title: "Pricing", href: "/#pricing" },
];

export default function Navbar() {
  const { user } = useKindeBrowserClient();

  return (
    <div className="flex justify-center w-full">
      <div className="px-4 md:px-16 max-w-6xl w-full flex justify-between py-4 items-center">
        <div className="flex items-center">
          <Logo />
        </div>

        <div className="hidden md:flex items-center space-x-2">
            {navbarItems.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="px-3 py-1 text-md font-semibold text-gray-700 dark:text-gray-200"
              >
                {item.title}
              </Link>
            ))}
          </div>

        {/* login / signup / dashboard buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <Link href={"/app/chat"}>
              <Button variant={"secondary-gray"} size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <LoginLink postLoginRedirectURL="/app/chat">
                <Button className="bg-transparent" variant="tertiary-gray">
                  Log in
                </Button>
              </LoginLink>

              <RegisterLink postLoginRedirectURL="/app/chat">
                <Button variant="primary">Sign up</Button>
              </RegisterLink>
            </>
          )}
        </div>

        {/* Mobile burger and menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="items-center h-9 w-9 p-0 flex justify-center text-gray-900 dark:text-white">
                <Bars4Icon className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="inset-y-0 flex h-auto w-[300px] flex-col p-0 dark:border-r-gray-800"
            >
              <div>
                <div className="p-4 border-b dark:border-b-gray-800">
                  <Logo />
                </div>
                <div className="space-y-2 py-4 border-b dark:border-b-gray-800">
                  {navbarItems.map((item, i) => (
                    <Link
                      href={item.href}
                      key={i}
                      className="px-4 py-3 font-semibold block text-gray-700 dark:text-gray-200"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
                <div className="py-6 px-4 flex flex-col space-y-3">
                  {user ? (
                    <Link href={"/app/chat"}>
                      <Button variant={"secondary-gray"} size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <RegisterLink postLoginRedirectURL="/app/chat">
                        <Button variant="primary" className="w-full">
                          Sign up
                        </Button>
                      </RegisterLink>

                      <LoginLink postLoginRedirectURL="/app/chat">
                        <Button variant="secondary-gray" className="w-full">
                          Log in
                        </Button>
                      </LoginLink>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
