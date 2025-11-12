"use client";

import {
  User,
  Package,
  MapPin,
  Settings,
  LogOut,
  RotateCcw,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import React from "react";

import { gradientButtonClass } from "@/features/home/components/homeTheme";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session, status } = useOptimizedSession();
  const isAuthenticated =
    status === "authenticated" && !!session?.user && !session.user.error;

  const navItems = [
    {
      label: t("profile"),
      href: "/account",
      icon: User,
      exact: true,
    },
    {
      label: t("orders"),
      href: "/account/orders",
      icon: Package,
      exact: false,
    },
    {
      label: t("returns"),
      href: "/account/returns",
      icon: RotateCcw,
      exact: false,
    },
    {
      label: t("addresses"),
      href: "/account/addresses",
      icon: MapPin,
      exact: false,
    },
    {
      label: t("settings"),
      href: "/account/settings",
      icon: Settings,
      exact: false,
    },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] w-full border-t border-white/10 bg-slate-950/70 pb-[env(safe-area-inset-bottom)] text-slate-200 shadow-[0_-20px_40px_-20px_rgba(14,165,233,0.35)] backdrop-blur-xl">
      <div className="mx-auto grid h-full grid-cols-5">
        {navItems.slice(0, 4).map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center transition-colors",
                isActive
                  ? "text-sky-300"
                  : "text-slate-400 hover:text-sky-200"
              )}
            >
              {isActive && (
                <span className="absolute top-0 block h-1 w-10 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform hover:scale-110",
                  isActive && "text-sky-300"
                )}
              />
              <span className="mt-1 text-center text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
        {isAuthenticated ? (
          <Link
            href="/account"
            className="relative flex flex-col items-center justify-center text-slate-400 transition-colors hover:text-sky-200"
          >
            <User className="w-5 h-5 transition-transform hover:scale-110" />
            <span className="mt-1 text-center text-xs font-medium">
              {t("account")}
            </span>
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="relative flex flex-col items-center justify-center text-slate-400 transition-colors hover:text-sky-200"
          >
            <LogIn className="w-5 h-5 transition-transform hover:scale-110" />
            <span className="mt-1 text-center text-xs font-medium">
              {t("login")}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
