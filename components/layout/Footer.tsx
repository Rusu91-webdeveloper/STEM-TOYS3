"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram } from "lucide-react";

import NewsletterSignup from "@/components/NewsletterSignup";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter always visible at top */}
      <NewsletterSignup />

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Sitewide policy note */}
        <div className="mb-6 rounded-md bg-gray-800 text-gray-200 text-sm px-4 py-2 flex items-center justify-center text-center">
          <span>
            {t(
              "freeReturnsOver50",
              "Free returns on orders over €50 / 250 lei"
            )}{" "}
            ·{" "}
            <Link href="/returns" className="underline">
              {t("seeReturnPolicy", "See return policy")}
            </Link>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="relative h-12 w-32">
                <Image
                  src="/TechTots_LOGO.png"
                  alt="TechTots Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/share/1CBSNUzMGA/?mibextid=wwXIfr"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com/techtots_magazin/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="w-6 h-6" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("explore")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("categories")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("support")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("returns")}
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("warrantyLink")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 TechTots {t("allRightsReserved")}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/gdpr"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              GDPR
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
