"use client";

import {
  Instagram,
  Mail,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  ShieldCheck,
  CreditCard,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import NewsletterSignup from "@/components/NewsletterSignup";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  useEffect(() => {
    if (storeSettings) return;
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

  const getReturnPolicyText = () =>
    t("freeReturnsOver50", "14 calendar days for returns. Return shipping is paid by the customer.");

  const socialLinks = [
    {
      name: "Website",
      href: "https://www.techtots.ro",
      icon: Globe,
    },
    {
      name: "Email",
      href: `mailto:${resolvedEmail}`,
      icon: Mail,
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/share/1CBSNUzMGA/?mibextid=wwXIfr",
      icon: Facebook,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/techtots_romania/",
      icon: Instagram,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/techtots-romania-b28541388",
      icon: Linkedin,
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@TechTots_Romania",
      icon: Youtube,
    },
  ];

  const customerServiceLinks = [
    { label: t("contact"), href: "/contact" },
    { label: `${t("shipping", "Livrare")} & ${t("returns", "Retururi")}`, href: "/shipping" },
    { label: "FAQ", href: "/faq" },
    { label: t("warrantyLink", "Garanție"), href: "/warranty" },
  ];

  const companyLinks = [
    { label: t("about", "Despre noi"), href: "/about" },
    { label: t("become_supplier", "Devino furnizor"), href: "/supplier" },
    { label: t("privacyPolicy", "Politica de confidențialitate"), href: "/privacy" },
    { label: t("termsOfService", "Termeni și condiții"), href: "/terms" },
    { label: "GDPR", href: "/gdpr" },
  ];

  const trustPartners: Array<{
    name: string;
    href: string;
    eyebrow: string;
    detail: string;
    icon: LucideIcon;
    brandClassName: string;
    wordmarkClassName: string;
    wordmark: ReactNode;
    /** Local SVG path — avoids broken remote Netopia assets */
    logoSrc?: string;
  }> = [
    {
      name: "Netopia Payments",
      href: "https://netopia-payments.com/",
      eyebrow: t("footerSecurePayments", "Plăți securizate"),
      detail: t("footerNetopiaDetail", "3D Secure pentru piața din România"),
      icon: ShieldCheck,
      brandClassName:
        "border border-slate-200 bg-white shadow-inner ring-1 ring-slate-100",
      wordmarkClassName: "",
      wordmark: null,
      logoSrc: "/images/checkout/netopia-wordmark.svg",
    },
    {
      name: "Stripe",
      href: "https://stripe.com/",
      eyebrow: t("footerCardPayments", "Plăți cu cardul"),
      detail: t("footerStripeDetail", "Visa, Mastercard, Apple Pay și multe altele"),
      icon: CreditCard,
      brandClassName:
        "bg-[linear-gradient(135deg,#eef2ff_0%,#dbeafe_100%)] text-[#635bff]",
      wordmarkClassName: "text-[#635bff]",
      wordmark: <span className="font-black tracking-tight lowercase">stripe</span>,
    },
    {
      name: "FanCourier",
      href: "https://www.fancourier.ro/",
      eyebrow: t("footerFastDelivery", "Livrare rapidă"),
      detail: t("footerFanCourierDetail", "Expediere națională cu tracking"),
      icon: Truck,
      brandClassName:
        "bg-[linear-gradient(135deg,#fff7ed_0%,#ffedd5_100%)] text-[#ea580c]",
      wordmarkClassName: "text-[#ea580c]",
      wordmark: (
        <>
          <span className="font-black tracking-[0.08em]">Fan</span>
          <span className="font-semibold">Courier</span>
        </>
      ),
    },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-800">
      {/* Newsletter section */}
      <NewsletterSignup />

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Column 1 — Brand (compact on small screens) */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 lg:flex-col">
              <Link href="/" className="relative block h-8 w-24 shrink-0 sm:h-9 sm:w-28">
                <Image
                  src="/TechTots_LOGO.png"
                  alt={`${storeName} Logo`}
                  fill
                  sizes="112px"
                  className="object-contain object-left"
                />
              </Link>
              <p className="text-sm leading-snug text-slate-600 sm:leading-relaxed lg:max-w-[260px]">
                {storeDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {socialLinks.map(link => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    aria-label={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile / tablet: collapsible nav — saves vertical space */}
          <div className="lg:hidden">
            <Accordion type="single" collapsible className="w-full rounded-xl border border-slate-200 divide-y divide-slate-200">
              <AccordionItem value="support" className="border-0 px-1">
                <AccordionTrigger className="px-3 py-3 text-sm font-bold text-slate-900 hover:no-underline">
                  {t("footerCustomerCare", "Customer Service")}
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <ul className="space-y-2 border-t border-slate-100 pt-2">
                    {customerServiceLinks.map(item => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-slate-700 transition-colors hover:text-slate-900"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="discover" className="border-0 px-1">
                <AccordionTrigger className="px-3 py-3 text-sm font-bold text-slate-900 hover:no-underline">
                  {t("footerShopDiscover", "Company")}
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <ul className="space-y-2 border-t border-slate-100 pt-2">
                    {companyLinks.map(item => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-slate-700 transition-colors hover:text-slate-900"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Desktop: link columns */}
          <div className="hidden lg:block">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              {t("footerCustomerCare", "Customer Service")}
            </h3>
            <ul className="space-y-2">
              {customerServiceLinks.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-700 transition-colors hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              {t("footerShopDiscover", "Company")}
            </h3>
            <ul className="space-y-2">
              {companyLinks.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-700 transition-colors hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Return policy bar */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs leading-relaxed text-slate-600 sm:mt-8 sm:px-4 sm:py-3">
          {getReturnPolicyText()} ·{" "}
          <Link href="/returns" className="font-medium text-[#2563EB] hover:underline">
            {t("seeReturnPolicy", "See policy")}
          </Link>
          {" · "}
          <span>
            Comenzi COD: la refuz/nepreluare (RTO) suportăm returul și putem reține doar transportul tur ·{" "}
          </span>
          <Link href="/shipping" className="font-medium text-[#2563EB] hover:underline">
            Detalii livrare
          </Link>
        </div>

        {/* SEO regional links */}
        <div className="mt-5 border-t border-slate-100 pt-4 sm:mt-7 sm:pt-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 sm:mb-3">
            Livrare rapidă în
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2">
            {getRegionalStemLinks().map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label.replace("Jucarii STEM ", "")}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col-reverse gap-4 border-t border-slate-100 pt-5 sm:mt-8 sm:flex-row sm:items-start sm:justify-between sm:gap-5 sm:pt-6">
          {/* Copyright + legal links */}
          <div className="flex flex-col gap-2 text-center sm:max-w-md sm:text-left">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} {storeName}. {t("allRightsReserved")}
            </p>
            <div
              className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2.5 text-left"
              role="group"
              aria-label={t("footerLegalInfoLabel", "Company details")}
            >
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                {t("footerLegalInfoLabel", "Company details")}
              </p>
              <p className="text-[11px] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                {t("footerLegalCui", "CUI: 51813997")}
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                {t("footerLegalRegCom", "J20/352/2025")}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-start sm:gap-x-5">
              {[
                { label: t("privacyPolicy", "Politica de confidențialitate"), href: "/privacy" },
                { label: t("termsOfService", "Termeni și condiții"), href: "/terms" },
                { label: t("shipping", "Livrare"), href: "/shipping" },
                { label: t("returns", "Retururi"), href: "/returns" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs text-slate-600 transition-colors hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Payments & delivery partners */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[340px]">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.26em] text-slate-600 sm:text-right">
              {t("footerTrustedPartners", "Parteneri de încredere")}
            </p>
            <div className="grid gap-2">
              {trustPartners.map(partner => {
                const Icon = partner.icon;

                return (
                  <Link
                    key={partner.name}
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_36px_-24px_rgba(37,99,235,0.28)] sm:py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 min-w-[74px] max-w-[132px] items-center justify-center rounded-2xl px-2 shadow-inner ${partner.brandClassName}`}
                      >
                        {partner.logoSrc ? (
                          <Image
                            src={partner.logoSrc}
                            alt="Netopia Payments"
                            width={120}
                            height={22}
                            className="h-6 w-auto max-h-7 max-w-[118px] object-contain object-left"
                          />
                        ) : (
                          <span
                            className={`text-sm leading-none ${partner.wordmarkClassName}`}
                          >
                            {partner.wordmark}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          {partner.eyebrow}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {partner.name}
                        </p>
                        <p className="truncate text-xs text-slate-600">
                          {partner.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
