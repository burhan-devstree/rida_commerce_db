"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, DocumentIcon, CubeIcon, BanknotesIcon } from "./icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/invoices", label: "Invoices", icon: DocumentIcon },
  { href: "/rida", label: "Rida Module", icon: CubeIcon },
  { href: "/expenses", label: "Expenses", icon: BanknotesIcon },
];

type SidebarProps = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 lg:flex"
      style={{ width: collapsed ? "var(--sidebar-collapsed, 5rem)" : "var(--sidebar-width, 16rem)" }}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
