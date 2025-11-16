"use client";

import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import NTPLogo from "ntp-logo-react";
import { useEffect, useState } from "react";

import NewsletterSignup from "@/components/NewsletterSignup";
import { useTranslation } from "@/lib/i18n";

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  returnThreshold: string;
}

export default function Footer({
  initialStoreSettings,
}: {
  initialStoreSettings?: StoreSettings | null;
}) {
  const { t } = useTranslation();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    initialStoreSettings ?? null
  );

  useEffect(() => {
    if (storeSettings) return; // Already have settings from SSR

    async function fetchStoreSettings() {
      try {
        const response = await fetch("/api/store-settings");
        if (response.ok) {
          const settings = await response.json();
          setStoreSettings(settings);
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      }
    }

    fetchStoreSettings();
  }, [storeSettings]);

  const storeName = storeSettings?.storeName ?? "TechTots";
  const storeDescription =
    storeSettings?.storeDescription ?? t("companyDescription");

  const resolvedEmail = storeSettings?.contactEmail ?? "support@techtots.ro";
  const resolvedPhone = storeSettings?.contactPhone ?? "+40 746 000 000";
  // Format the return threshold for display
  const formatReturnThreshold = (threshold: string) => {
    const amount = parseFloat(threshold);
    if (isNaN(amount)) return "€50 / 250 lei";

    // The database value is in lei, convert to euros for display (assuming 1 EUR = 5 RON)
    const leiAmount = amount; // This is already in lei from the database
    const eurAmount = Math.round(leiAmount / 5); // Convert lei to euros

    return `€${eurAmount} / ${leiAmount} lei`;
  };

  const returnThreshold = storeSettings?.returnThreshold
    ? formatReturnThreshold(storeSettings.returnThreshold)
    : "€50 / 250 lei";

  // Helper function to interpolate threshold into translation
  const getReturnPolicyText = () => {
    const baseText = t(
      "freeReturnsOver50",
      "Free returns on orders over {threshold}"
    );
    return baseText.replace("{threshold}", returnThreshold);
  };

  const companyAddressParts = [
    storeSettings?.businessAddress,
    storeSettings?.businessCity,
    storeSettings?.businessState,
    storeSettings?.businessCountry,
  ].filter(Boolean);

  const companyAddress =
    companyAddressParts.length > 0
      ? companyAddressParts.join(", ")
      : t(
          "footerLegalAddress",
          "Jud. Cluj, Municipiul Cluj-Napoca, Strada Mehedinți, Nr. 54-56, Bl. D5, Sc. 2, Ap. 70"
        );

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/share/1CBSNUzMGA/?mibextid=wwXIfr",
      className:
        "hover:border-[#1877F2]/50 hover:bg-[#1877F2]/20 focus-visible:ring-[#1877F2]",
      icon: (className: string) => (
        <svg
          className={className}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/techtots_magazin/",
      className:
        "hover:border-[#E1306C]/40 hover:bg-gradient-to-br hover:from-[#F56040]/30 hover:to-[#833AB4]/40 focus-visible:ring-[#E1306C]",
      icon: (className: string) => (
        <Instagram className={className} aria-hidden="true" />
      ),
    },
    {
      name: "Twitter",
      href: "https://x.com/RusuEmanue41893",
      className:
        "hover:border-white/40 hover:bg-white/10 focus-visible:ring-white/70",
      icon: (className: string) => (
        <svg
          className={className}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@techtots1",
      className:
        "hover:border-white/40 hover:bg-white/10 focus-visible:ring-white/70",
      icon: (className: string) => (
        <svg
          className={className}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/techtots-romania-b28541388",
      className:
        "hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/20 focus-visible:ring-[#0A66C2]",
      icon: (className: string) => (
        <svg
          className={className}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@TechTots_Romania",
      className:
        "hover:border-[#FF0000]/50 hover:bg-[#FF0000]/20 focus-visible:ring-[#FF0000]",
      icon: (className: string) => (
        <svg
          className={className}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  const navSections = [
    {
      title: t("footerShopDiscover", "Shop & Discover"),
      accent: "from-sky-500 via-sky-400 to-blue-500",
      items: [
        { label: t("products"), href: "/products" },
        { label: t("categories"), href: "/categories" },
        { label: t("blog"), href: "/blog" },
        { label: t("about"), href: "/about" },
      ],
    },
    {
      title: t("footerCustomerCare", "Customer Care"),
      accent: "from-emerald-400 via-green-400 to-teal-500",
      items: [
        { label: t("contact"), href: "/contact" },
        { label: t("returns"), href: "/returns" },
        { label: t("delivery", "Delivery"), href: "/delivery" },
        { label: t("warrantyLink"), href: "/warranty" },
        {
          label: "FAQ",
          href: "/faq",
          tracking: {
            "data-conversion": "cta",
            "data-conversion-type": "click",
            "data-conversion-category": "footer",
            "data-conversion-action": "footer_link_click",
            "data-conversion-element": "footer_faq",
          },
        },
      ],
    },
    {
      title: t("footerKnowledge", "Guides & Partnerships"),
      accent: "from-purple-500 via-fuchsia-500 to-pink-500",
      items: [
        { label: t("become_supplier"), href: "/supplier" },
        { label: t("supplierRequirements"), href: "/supplier/requirements" },
        {
          label: t("footerGuide2025", "Ghid 2025"),
          href: "/ghid-jucarii-stem-2025",
          tracking: {
            "data-conversion": "cta",
            "data-conversion-type": "click",
            "data-conversion-category": "footer",
            "data-conversion-action": "footer_link_click",
            "data-conversion-element": "footer_ghid_2025",
          },
        },
        {
          label: t("footerAgeGuide", "Jucării STEM după vârstă"),
          href: "/jucarii-stem-dupa-varsta",
          tracking: {
            "data-conversion": "cta",
            "data-conversion-type": "click",
            "data-conversion-category": "footer",
            "data-conversion-action": "footer_link_click",
            "data-conversion-element": "footer_dupa_varsta",
          },
        },
      ],
    },
  ];

  const contactDetails: Array<{
    label: string;
    value: string;
    href?: string;
    icon: typeof Phone;
  }> = [
    {
      label: t("footerPhoneLabel", "Phone"),
      value: resolvedPhone,
      href: `tel:${resolvedPhone.replace(/[^\d+]/g, "")}`,
      icon: Phone,
    },
    {
      label: t("footerEmailLabel", "Email"),
      value: resolvedEmail,
      href: `mailto:${resolvedEmail}`,
      icon: Mail,
    },
    {
      label: t("footerAddressLabel", "Headquarters"),
      value: companyAddress,
      icon: MapPin,
    },
  ];

  const socialBaseClass =
    "group relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 sm:h-12 sm:w-12";
  const socialIconClass =
    "h-4 w-4 text-gray-300 transition-colors group-hover:text-white sm:h-5 sm:w-5";

  return (
    <footer className="bg-gray-950 text-white">
      {/* Newsletter always visible at top */}
      <NewsletterSignup />

      {/* Main footer content */}
      <div className="container mx-auto px-3 py-5 sm:py-8 md:py-12 lg:py-16">
        <div className="mb-5 flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-[0.85rem] text-gray-200 shadow-sm backdrop-blur-sm sm:mb-8 sm:px-6 sm:py-4 sm:text-sm">
          <span>
            {getReturnPolicyText()} ·{" "}
            <Link href="/returns" className="underline">
              {t("seeReturnPolicy", "See return policy")}
            </Link>
          </span>
        </div>
        <div className="flex flex-col gap-8 sm:gap-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-7 lg:col-span-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-28 sm:h-12 sm:w-32 md:h-14 md:w-40">
                <Image
                  src="/TechTots_LOGO.png"
                  alt={`${storeName} Logo`}
                  fill
                  sizes="(max-width: 640px) 6rem, (max-width: 768px) 7rem, (max-width: 1024px) 9rem, 9rem"
                  className="object-contain"
                  priority={false}
                />
              </div>
            </div>

            <p className="mt-4 text-[0.92rem] leading-relaxed text-gray-300 sm:text-base">
              {storeDescription}
            </p>
              </div>

              <div className="flex flex-wrap gap-2.5 sm:gap-4">
                {socialLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    aria-label={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${socialBaseClass} ${link.className}`}
                  >
                    {link.icon(socialIconClass)}
                    <span className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {link.name}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {contactDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-left transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.05]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-sky-300">
                      <detail.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                        {detail.label}
                      </p>
                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="text-sm font-medium text-white transition-colors hover:text-sky-200"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-white">
                          {detail.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-5 sm:gap-7 sm:grid-cols-2 md:grid-cols-3">
                {navSections.map((section) => (
                  <nav
                    key={section.title}
                    aria-label={section.title}
                    className="rounded-3xl border border-white/5 bg-white/[0.01] p-3.5 shadow-[0px_20px_45px_-20px_rgba(15,23,42,0.45)] transition duration-300 hover:border-white/15 hover:bg-white/[0.04] sm:p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr ${section.accent} text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white sm:h-8 sm:w-8`}
                      >
                        {section.title.charAt(0)}
                      </span>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-200 sm:text-[0.7rem] md:text-sm">
                        {section.title}
                      </h3>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {section.items.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white sm:text-sm"
                            {...(item.tracking ?? {})}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-1.5 w-1.5 rounded-full bg-gradient-to-tr ${section.accent}`}
                              />
                              {item.label}
                            </span>
                            <span className="text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                              &gt;
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-[0px_20px_45px_-20px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start lg:gap-10">
              <div className="flex flex-col gap-3 text-center text-xs text-gray-400 sm:text-sm lg:text-left">
                <p className="text-[0.92rem] font-semibold text-white sm:text-base">
                  © 2025 {storeName} {t("allRightsReserved")}
                </p>
                <p className="text-[0.85rem] leading-relaxed text-gray-400 sm:text-sm">
                  {t(
                    "footerPromise",
                    "Inspiring the next generation of innovators with curated STEM learning experiences."
                  )}
                </p>
                <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                  <Link
                    href="/privacy"
                    className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-white"
                  >
                    {t("privacyPolicy")}
                  </Link>
                  <Link
                    href="/terms"
                    className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-white"
                  >
                    {t("termsOfService")}
                  </Link>
                  <Link
                    href="/gdpr"
                    className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-white"
                  >
                    GDPR
                  </Link>
                </div>
              </div>

              <Link
                href="https://netopia-payments.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-white/[0.04] px-4 py-3.5 text-white shadow-[0px_20px_45px_-20px_rgba(37,99,235,0.55)] transition-all duration-300 hover:shadow-[0px_25px_55px_-20px_rgba(37,99,235,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:max-w-sm lg:mx-auto"
                aria-label="Netopia secure payments"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/90">
                  Plăți securizate Netopia
                </span>
                <div className="flex items-center justify-center">
                  <NTPLogo
                    color="#ffffff"
                    version="horizontal"
                    secret="156180"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[11px] uppercase tracking-[0.22em] text-blue-200/70">
                  {t("footerPaymentSecurity", "SSL 256-bit Encryption")}
                </span>
              </Link>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-xs text-gray-200 shadow-inner sm:text-sm lg:ml-auto">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                  {t("footerLegalInfoLabel", "Date companie")}
                </p>
                <address className="mt-3 space-y-1.5 not-italic">
                  <p className="text-sm font-semibold text-white sm:text-base">
                    WEBIRA REM S.R.L.
                  </p>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {companyAddress}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {t(
                      "footerLegalCui",
                      "Cod unic de înregistrare: 51813997 (20.05.2025)"
                    )}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {t(
                      "footerLegalRegCom",
                      "Registrul Comerțului: J2025035239005 (19.05.2025)"
                    )}
                  </p>
                </address>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
