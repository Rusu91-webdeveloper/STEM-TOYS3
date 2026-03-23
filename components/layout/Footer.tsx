"use client";

import {
  ChevronDown,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import NTPLogo from "ntp-logo-react";
import { useEffect, useState } from "react";

import NewsletterSignup from "@/components/NewsletterSignup";
import { useTranslation } from "@/lib/i18n";
import { getRegionalStemLinks } from "@/lib/seo/regional-search";

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

  // State for mobile accordion sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

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

  const getReturnPolicyText = () => {
    return t(
      "freeReturnsOver50",
      "14 calendar days for returns. Return shipping is paid by the customer."
    );
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
        <Facebook className={className} aria-hidden="true" />
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
        <Twitter className={className} aria-hidden="true" />
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
        <Linkedin className={className} aria-hidden="true" />
      ),
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@TechTots_Romania",
      className:
        "hover:border-[#FF0000]/50 hover:bg-[#FF0000]/20 focus-visible:ring-[#FF0000]",
      icon: (className: string) => (
        <Youtube className={className} aria-hidden="true" />
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
        { label: t("shipping", "Livrare"), href: "/shipping" },
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
    "group relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 sm:h-11 sm:w-11";
  const socialIconClass =
    "h-[14px] w-[14px] text-gray-300 transition-colors group-hover:text-white sm:h-5 sm:w-5";

  return (
    <footer className="border-t border-white/5 bg-gray-950 text-white">
      {/* Newsletter always visible at top */}
      <NewsletterSignup />

      {/* Main footer content - Reduced padding for cleaner look */}
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Top Info Bar (Returns) */}
        <div className="mb-6 flex items-center justify-center text-center sm:mb-10">
          <div className="inline-flex max-w-3xl flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-gray-300 shadow-sm backdrop-blur-sm sm:px-6 sm:py-3 sm:text-sm">
            <span>
              {getReturnPolicyText()} ·{" "}
              <Link
                href="/returns"
                className="text-sky-300 underline underline-offset-2 transition-colors hover:text-sky-200"
              >
                {t("seeReturnPolicy", "See policy")}
              </Link>
            </span>
            <span className="text-[11px] text-gray-400 sm:text-xs">
              Comenzi COD: refuz/nepreluare colet (RTO) poate genera cost
              logistic tur + retur ·{" "}
              <Link
                href="/shipping"
                className="text-sky-300 underline underline-offset-2 transition-colors hover:text-sky-200"
              >
                Detalii livrare
              </Link>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Brand Column */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="relative block h-10 w-32 sm:h-12 sm:w-40"
              >
                <Image
                  src="/TechTots_LOGO.png"
                  alt={`${storeName} Logo`}
                  fill
                  sizes="(max-width: 640px) 120px, 160px"
                  className="object-contain object-left"
                  priority={false}
                />
              </Link>

              <p className="max-w-xs text-sm leading-relaxed text-gray-400">
                {storeDescription}
              </p>
            </div>

            {/* Socials - Compact */}
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-label={link.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialBaseClass} ${link.className}`}
                >
                  {link.icon(socialIconClass)}
                </Link>
              ))}
            </div>

            {/* Contact Info - Compact List */}
            <div className="flex flex-col gap-3">
              {contactDetails.map(detail => (
                <div key={detail.label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/5 text-sky-400">
                    <detail.icon className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <div className="text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {detail.label}
                    </p>
                    {detail.href ? (
                      <a
                        href={detail.href}
                        className="font-medium text-gray-300 transition-colors hover:text-white"
                      >
                        {detail.value}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-300 leading-snug max-w-[250px]">
                        {detail.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Columns - Accordion on Mobile */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3 lg:gap-8">
            {navSections.map(section => {
              const isOpen = openSections[section.title];
              return (
                <div
                  key={section.title}
                  className="border-b border-white/10 pb-4 lg:border-none lg:pb-0"
                >
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between py-2 text-left lg:block lg:cursor-default lg:py-0"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`hidden h-6 w-6 items-center justify-center rounded bg-gradient-to-tr ${section.accent} text-[10px] font-bold uppercase text-white lg:inline-flex`}
                      >
                        {section.title.charAt(0)}
                      </span>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-100 lg:text-xs lg:text-gray-400">
                        {section.title}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform lg:hidden ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <ul
                    className={`mt-2 space-y-1 overflow-hidden transition-all lg:block lg:h-auto lg:overflow-visible ${
                      isOpen
                        ? "max-h-60 opacity-100"
                        : "max-h-0 opacity-0 lg:opacity-100"
                    }`}
                  >
                    {section.items.map(item => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-2 py-2 text-sm text-gray-400 transition-colors hover:text-white lg:py-1.5 lg:text-xs"
                          {...(item.tracking ?? {})}
                        >
                          <span className="hidden h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-white lg:block" />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* City SEO links — internal linking without cluttering the homepage */}
        <div className="mt-10 border-t border-white/5 pt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">
            Livrare rapidă în
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {getRegionalStemLinks().map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                {link.label.replace("Jucarii STEM ", "")}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Payments & Copyright */}
        <div className="mt-10 border-t border-white/5 pt-8">
          <div className="flex flex-col-reverse justify-between gap-6 lg:flex-row lg:items-center">
            {/* Copyright & Legal */}
            <div className="flex flex-col gap-4 text-center lg:text-left">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} {storeName}.{" "}
                {t("allRightsReserved")}
              </p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
                {[
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "Shipping", href: "/shipping" },
                  { name: "Returns", href: "/returns" },
                  { name: "GDPR", href: "/gdpr" },
                ].map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-xs font-medium text-gray-400 transition-colors hover:text-white"
                  >
                    {item.name === "Privacy Policy"
                      ? t("privacyPolicy")
                      : item.name === "Terms of Service"
                        ? t("termsOfService")
                        : item.name === "Shipping"
                          ? t("shipping", "Livrare")
                          : item.name === "Returns"
                            ? t("returns", "Retururi")
                            : item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust/Payment */}
            <div className="flex flex-col items-center gap-4 lg:items-end">
              <Link
                href="https://netopia-payments.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10"
              >
                <NTPLogo
                  color="#ffffff"
                  version="horizontal"
                  secret="156180"
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Secure Payment
                </span>
              </Link>
              <div className="text-[10px] text-gray-600">
                {t("footerLegalCui", "CUI: 51813997")} •{" "}
                {t("footerLegalRegCom", "J20/352/2025")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
