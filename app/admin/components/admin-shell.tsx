"use client";

import { Home, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { adminPageTitle, disconnectedReports } from "@/lib/admin/navigation";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

import AdminOrderNotificationsBell from "./admin-order-notifications-bell";
import { DisconnectedReport } from "./disconnected-report";
import SidebarNav from "./sidebar-nav";

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; role?: string };
}) {
  const { data: session, status } = useOptimizedSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const allowed =
    (status === "authenticated" && session?.user?.role === "ADMIN") ||
    (status === "loading" && user.role === "ADMIN");

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setSidebarOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (status !== "loading" && !allowed)
      router.replace("/auth/login?callbackUrl=/admin");
  }, [allowed, router, status]);
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const links =
      sidebar.current?.querySelectorAll<HTMLElement>("a, button, summary");
    links?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
      if (event.key === "Tab" && sidebar.current) {
        const visible = Array.from(
          sidebar.current.querySelectorAll<HTMLElement>("a, button, summary")
        ).filter(element => element.getClientRects().length > 0);
        const first = visible[0];
        const last = visible[visible.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (window.innerWidth < 1024) menuButton.current?.focus();
    };
  }, [sidebarOpen]);

  if (status === "loading" && !allowed)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p role="status" className="text-slate-500">
          Se încarcă administrarea…
        </p>
      </div>
    );
  if (!allowed) return null;
  const disconnected = disconnectedReports[pathname];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#admin-content"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Mergi la conținut
      </a>
      <header
        inert={sidebarOpen}
        className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={menuButton}
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Deschide meniul"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" className="relative h-9 w-20 shrink-0">
            <Image
              src="/TechTots_LOGO.png"
              alt="TechTots — administrare"
              fill
              sizes="80px"
              className="object-contain"
            />
          </Link>
          <span className="hidden h-5 border-l border-slate-200 sm:block" />
          <p className="hidden truncate text-sm font-medium text-slate-600 sm:block">
            {adminPageTitle(pathname)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <AdminOrderNotificationsBell />
          <Link
            href="/"
            className="hidden min-h-11 items-center gap-2 px-2 text-sm text-slate-500 hover:text-slate-900 md:flex"
          >
            <Home className="h-4 w-4" />
            Vezi magazinul
          </Link>
          <span className="hidden border-l border-slate-200 pl-4 text-sm text-slate-500 xl:block">
            {session?.user?.name || user.name || "Administrator"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Deconectare"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Ieșire</span>
          </Button>
        </div>
      </header>
      <div className="flex">
        {sidebarOpen ? (
          <div
            className="fixed inset-0 top-16 z-30 bg-slate-950/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        ) : null}
        <aside
          id="admin-sidebar"
          ref={sidebar}
          aria-label="Meniu administrare"
          role={sidebarOpen ? "dialog" : undefined}
          aria-modal={sidebarOpen || undefined}
          className={`fixed bottom-0 left-0 top-16 z-40 w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 transition-transform lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:w-64 lg:translate-x-0 lg:visible ${sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"}`}
        >
          <div className="mb-3 flex items-center justify-between px-3 lg:hidden">
            <span className="text-sm font-semibold">Administrare magazin</span>
            <button
              aria-label="Închide meniul"
              className="rounded-lg p-2"
              onClick={() => {
                setSidebarOpen(false);
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav />
          <Link
            href="/"
            className="mt-5 flex min-h-11 items-center gap-3 border-t border-slate-100 px-3 pt-3 text-sm text-slate-500"
          >
            <Home className="h-4 w-4" />
            Vezi magazinul
          </Link>
        </aside>
        <main
          inert={sidebarOpen}
          id="admin-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-7xl">
            {disconnected ? (
              <DisconnectedReport title={disconnected} />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
