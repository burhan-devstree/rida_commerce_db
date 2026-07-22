"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HomeIcon, DocumentIcon, CubeIcon, BanknotesIcon, ArrowRightOnRectangleIcon } from "./icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/invoices", label: "Invoices", icon: DocumentIcon },
  { href: "/rida", label: "Rida Module", icon: CubeIcon },
  { href: "/expenses", label: "Expenses", icon: BanknotesIcon },
];

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function handleLinkClick() {
    onClose();
  }

  function handleSignOut() {
    onClose();
    logout();
    router.replace("/login");
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
          <span className="font-semibold text-zinc-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
            aria-label="Close menu"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-blue-600 text-white" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
            Sign out
          </button>
        </nav>
      </div>
    </div>
  );
}
