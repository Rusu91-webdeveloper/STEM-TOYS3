"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  adminNavItems,
  adminNavGroups,
  activeAdminHref,
  type AdminNavItem,
} from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

export { adminNavItems } from "@/lib/admin/navigation";

export default function SidebarNav() {
  const pathname = usePathname();
  const activeHref = activeAdminHref(pathname);
  const renderItem = (item: AdminNavItem) => {
    const Icon = item.icon;
    const active = activeHref === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600",
          active
            ? "bg-violet-50 font-semibold text-violet-800"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{item.title}</span>
      </Link>
    );
  };
  return (
    <nav aria-label="Navigare administrare" className="space-y-5">
      <div className="space-y-1">{adminNavItems.map(renderItem)}</div>
      <div className="border-t border-slate-100 pt-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Instrumente de lucru
        </p>
        {adminNavGroups.map(group => (
          <details
            key={`${group.title}-${group.items.some(item => item.href === activeHref)}`}
            open={group.items.some(item => item.href === activeHref)}
            className="group mb-1"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 [&::-webkit-details-marker]:hidden">
              {group.title}
              <ChevronDown
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="ml-3 border-l border-slate-100 pl-1">
              {group.items.map(renderItem)}
            </div>
          </details>
        ))}
      </div>
    </nav>
  );
}
