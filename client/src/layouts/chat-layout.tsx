import Navbar, { NavbarItem, NavbarProps } from "@/components/navbar/app";
import {  RectangleStackIcon } from "@heroicons/react/24/outline";

interface ChatLayoutProps extends NavbarProps {
  children: React.ReactNode;
  navbarItems?: NavbarItem[];
}

export default async function ChatLayout(props: ChatLayoutProps) {
  const navbarItems = props.navbarItems ?? [
    {
      title: "Chats",
      link: "/app/chat",
      icon: <RectangleStackIcon className="h-5 w-5 text-gray-500" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-50 shrink-0 h-16 bg-white w-screen">
        <Navbar items={navbarItems} user={props.user} />
      </nav>

      <main>{props.children}</main>
    </div>
  );
}
