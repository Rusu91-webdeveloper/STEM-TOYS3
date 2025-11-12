"use client";

import {
  User,
  Package,
  MapPin,
  CreditCard,
  Heart,
  Settings,
  LogOut,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import React from "react";

import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    {
      label: t("profile"),
      href: "/account",
      icon: User,
    },
    {
      label: t("orders"),
      href: "/account/orders",
      icon: Package,
    },
    {
      label: t("returns"),
      href: "/account/returns",
      icon: RotateCcw,
    },
    {
      label: t("addresses"),
      href: "/account/addresses",
      icon: MapPin,
    },
    {
      label: t("paymentMethods"),
      href: "/account/payment-methods",
      icon: CreditCard,
    },
    {
      label: t("wishlist"),
      href: "/account/wishlist",
      icon: Heart,
    },
    {
      label: t("settings"),
      href: "/account/settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="space-y-2 text-slate-200">
      {navItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-xl border border-transparent px-4 py-3 text-sm transition-all duration-200",
              isActive
                ? "border-sky-400/40 bg-sky-500/20 text-white shadow-lg shadow-sky-500/25"
                : "text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-slate-50"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5",
                isActive ? "text-sky-200" : "text-slate-300"
              )}
            />
            <span className="font-medium">{item.label}</span>
            {isActive && (
              <div className="ml-auto h-2 w-2 rounded-full bg-white/40" />
            )}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-white/10 pt-4">
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-200 transition-all duration-200 hover:border-white/25 hover:bg-white/15 hover:text-rose-200"
        >
          <LogOut className="mr-3 h-5 w-5 text-rose-300 transition-colors group-hover:text-rose-200" />
          <span className="font-medium">{t("logout")}</span>
        </button>
      </div>
    </nav>
  );
}
