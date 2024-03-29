import Link from "next/link";
import Logo from "../brand/logo";
import { brandConfig } from "@/config/brand";

export default function FooterSection() {
  const items = [
    { title: "Home", href: "/" },
    { title: "Pricing", href: "/#pricing" },
    { title: "FAQ", href: "/#faq" },
    { title: "Features", href: "/#features" },
  ];

  return (
    <footer className="space-y-12 py-12 border-t dark:border-t-gray-800 md:flex md:justify-between md:items-center md:space-y-0">
      <div className="px-4">
        <Logo />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 px-4 place-items-start md:place-items-center gap-y-3">
        {items.map((item, i) => (
          <Link
            className="text-gray-600 dark:text-gray-300 font-semibold"
            key={i}
            href={item.href}
          >
            {item.title}
          </Link>
        ))}
      </div>

      <div className="px-4">
        <p className="text-gray-600 dark:text-gray-300">© {brandConfig.name.toLowerCase()}</p>
      </div>
    </footer>
  );
}
