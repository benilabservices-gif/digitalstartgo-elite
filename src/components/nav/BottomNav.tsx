"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/diagnostic", label: "Diagnostic" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-dark/5 bg-white sm:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex-1 py-3 text-center text-xs font-medium ${
            pathname === item.href ? "text-royal" : "text-secondary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
