"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useTranslation } from "@/lib/i18n";
import { signOut } from "next-auth/react";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

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
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-md border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.slice(0, 4).map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}>
              {isActive && (
                <span className="absolute top-0 block h-1 w-10 bg-gradient-to-r from-primary to-primary/70 rounded-full" />
              )}
              <item.icon
                className={`w-5 h-5 ${isActive ? "fill-primary/10" : ""} transition-transform hover:scale-110`}
              />
              <span className="text-xs mt-1 text-center font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center relative text-muted-foreground hover:text-red-500">
          <LogOut className="w-5 h-5 transition-transform hover:scale-110" />
          <span className="text-xs mt-1 text-center font-medium">
            {t("logout")}
          </span>
        </button>
      </div>
    </div>
  );
}
