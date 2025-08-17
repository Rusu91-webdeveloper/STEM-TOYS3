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
    <nav className="space-y-2">
      {navItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-primary to-primary/70 text-white font-medium shadow-md"
                : "text-gray-700 hover:bg-white/80 hover:shadow-sm hover:translate-x-1"
            }`}
          >
            <item.icon
              className={`w-5 h-5 mr-3 ${isActive ? "" : "text-primary/70"}`}
            />
            <span className="font-medium">{item.label}</span>
            {isActive && (
              <div className="ml-auto bg-white/20 rounded-full w-2 h-2"></div>
            )}
          </Link>
        );
      })}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 rounded-lg transition-all duration-200 hover:bg-white/80 hover:shadow-sm hover:translate-x-1 group"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-500/70 group-hover:text-red-500" />
          <span className="font-medium group-hover:text-red-500">
            {t("logout")}
          </span>
        </button>
      </div>
    </nav>
  );
}
