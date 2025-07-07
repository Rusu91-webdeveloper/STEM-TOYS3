import { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

import Footer from "@/components/layout/Footer";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { AccountNav } from "@/features/account/components/AccountNav";
import { MobileNav } from "@/features/account/components/MobileNav";
import { auth } from "@/lib/auth";
import { verifyUserExists } from "@/lib/db-helpers";
import { getTranslations } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";

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
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1))
        );
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
    <div className="flex min-h-screen flex-col relative">
      {/* Background image with reduced opacity */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/blog_homepage_hero_01.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          style={{ opacity: 0.08 }} // Reduced opacity for better text visibility
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background/80" />
      </div>

      <div className="flex-1 relative z-10">
        <div className="container flex-1 items-start md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
          {/* Enhanced sidebar */}
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
            <div className="py-8 pr-6 lg:py-10">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {t("account")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {session.user?.name ?? t("account")}
                  </p>
                </div>
                <div className="md:hidden">
                  <LanguageSwitcher />
                </div>
              </div>
              <div className="rounded-lg bg-white/50 backdrop-blur-sm shadow-lg border border-gray-100 p-4">
                <AccountNav />
              </div>
            </div>
          </aside>

          {/* Main content with glass effect */}
          <main className="min-h-screen w-full pb-24 md:pb-16 mt-6">
            <div className="rounded-xl bg-white/70 backdrop-blur-sm shadow-lg border border-gray-100 p-3 sm:p-6 mb-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Add padding to ensure mobile nav doesn't cover content */}
      <div className="md:hidden h-16"></div>
      <MobileNav />

      {/* Footer */}
      <div className="relative z-10 mt-6">
        <Footer />
      </div>
    </div>
  );
}
