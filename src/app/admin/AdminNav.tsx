"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Khách hàng", match: (p: string) => p === "/admin" || p.startsWith("/admin/customers") },
  { href: "/admin/settings", label: "Cài đặt", match: (p: string) => p.startsWith("/admin/settings") },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar order-last flex w-full min-w-0 gap-1 overflow-x-auto sm:order-none sm:w-auto">
      {LINKS.map((l) => {
        const on = l.match(path);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] transition ${on ? "gold-btn font-medium text-cream" : "text-taupe hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
