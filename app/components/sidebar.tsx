"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/tickets", label: "Tickets" },
  { href: "/members", label: "Members" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col gap-2 border-r bg-muted/40 p-4">
      <Link className="font-semibold text-lg" href="/">
        Pulseboard
      </Link>
      <nav className="mt-4 flex flex-col gap-1 text-sm">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              className={cn(
                "rounded-md px-3 py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-primary/10 text-primary"
              )}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
