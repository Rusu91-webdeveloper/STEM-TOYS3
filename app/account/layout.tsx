import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { AccountNav } from "@/features/account/components/AccountNav";
import { MobileNav } from "@/features/account/components/MobileNav";
import {
  glassCardClass,
  glassPanelClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";
import { auth } from "@/lib/auth";
import { verifyUserExists } from "@/lib/db-helpers";
import { getTranslations } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Account | NextCommerce",
  description: "Manage your account and view your orders",
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("ro"); // Default to Romanian

  // Check if the user is authenticated
  if (!session?.user) {
    // No session, redirect to login
    logger.info("Redirecting to login from account page - no session");
    // Include the callback URL to ensure the user is redirected back to the account page after login
    redirect("/auth/login?callbackUrl=/account");
  }

  // Extract user ID
  const userId = session.user.id;

  // Special handling for environment-based admin accounts
  if (userId === "admin_env" && process.env.ADMIN_EMAIL) {
    logger.info(
      "Session validated for environment admin user in account layout",
      { userId }
    );
    // Admin env user is valid, continue to render the account page
  } else {
    // For regular users, verify they exist in the database
    const tokenData = session?.token ?? {};
    const isRecentGoogleAuth =
      tokenData.googleAuthTimestamp &&
      Date.now() - tokenData.googleAuthTimestamp < 120000; // 2 minute grace period

    if (isRecentGoogleAuth) {
      logger.info(
        "Fresh Google auth session detected in account layout, using extended verification",
        { userId }
      );

      // For fresh Google auth, use extended verification with multiple retries and longer delays
      let userExists = false;

      // Multiple rounds of verification with increasing delays
      for (let attempt = 0; attempt < 5; attempt++) {
        userExists = await verifyUserExists(userId, {
          maxRetries: 3,
          delayMs: 500 * (attempt + 1), // Increasing delay with each attempt
        });

        if (userExists) {
          logger.info(`User verified on attempt ${attempt + 1}`, { userId });
          break;
        }

        // Wait before next verification round
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }

      if (!userExists) {
        logger.warn(
          "User not found after extended verification for fresh auth session",
          { userId }
        );
        redirect("/auth/login?error=UserDeleted");
      }
    } else {
      // Standard verification for established sessions
      const userExists = await verifyUserExists(userId);
      if (!userExists) {
        logger.warn("User not found in standard verification", { userId });
        redirect("/auth/login?error=UserDeleted");
      }
    }
  }

  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div
        className={`${homeContentWrapperClass} min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-16`}
      >
        <div className="container grid flex-1 items-start gap-8 pt-12 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
          {/* Enhanced sidebar */}
          <aside className="sticky top-24 hidden max-h-[calc(100vh-6rem)] overflow-y-auto md:block">
            <div className="space-y-6">
              <div
                className={cn(
                  glassPanelClass,
                  "flex items-center justify-between border-white/10 bg-slate-900/70 px-5 py-4 text-slate-100 shadow-xl shadow-black/30"
                )}
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {t("account")}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {session.user?.name ?? t("account")}
                  </p>
                </div>
                <div className="md:hidden">
                  <LanguageSwitcher />
                </div>
              </div>
              <div
                className={cn(
                  glassCardClass,
                  "border-white/10 bg-slate-900/60 p-4 text-slate-100 shadow-xl shadow-black/30"
                )}
              >
                <AccountNav />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="w-full space-y-6 md:mt-6">
            <div
              className={cn(
                glassPanelClass,
                "border-white/10 bg-slate-900/70 p-4 text-slate-100 shadow-2xl shadow-black/40 sm:p-6"
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Spacer + mobile nav */}
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />
      <MobileNav />
    </div>
  );
}
