"use client";

import {
  Instagram,
  Mail,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Globe,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

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
  const [footerEmail, setFooterEmail] = useState("");
  const [footerStatus, setFooterStatus] = useState<"idle" | "success" | "error">("idle");

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

  const handleFooterNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail) return;
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: footerEmail }),
      });
      setFooterStatus(res.ok ? "success" : "error");
      if (res.ok) setFooterEmail("");
    } catch {
      setFooterStatus("error");
    } finally {
      setTimeout(() => setFooterStatus("idle"), 4000);
    }
  };

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
      href: "https://www.instagram.com/techtots_magazin/",
      icon: Instagram,
    },
    {
      name: "Twitter",
      href: "https://x.com/RusuEmanue41893",
      icon: Twitter,
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">

          {/* Column 1 — Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="relative block h-9 w-28">
              <Image
                src="/TechTots_LOGO.png"
                alt={`${storeName} Logo`}
                fill
                sizes="112px"
                className="object-contain object-left"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 max-w-[200px]">
              {storeDescription}
            </p>
            {/* Social icons */}
            <div className="flex flex-wrap gap-2 mt-1">
              {socialLinks.slice(0, 2).map(link => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    aria-label={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
              {socialLinks.slice(2).map(link => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    aria-label={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2 — Customer Service */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              {t("footerCustomerCare", "Customer Service")}
            </h3>
            <ul className="space-y-2.5">
              {customerServiceLinks.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              {t("footerShopDiscover", "Company")}
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Newsletter mini-form */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              {t("footerKnowledge", "Newsletter")}
            </h3>
            <p className="mb-4 text-sm text-slate-500 leading-relaxed">
              {t(
                "newsletterFooterDesc",
                "Fii la curent cu cele mai noi jucării STEM și resurse educaționale."
              )}
            </p>
            <form
              onSubmit={handleFooterNewsletter}
              className="flex items-center gap-2"
              aria-label="Footer newsletter signup"
            >
              <label htmlFor="footer-email" className="sr-only">
                {t("emailAddressPlaceholder")}
              </label>
              <input
                id="footer-email"
                type="email"
                value={footerEmail}
                onChange={e => setFooterEmail(e.target.value)}
                placeholder={t("emailAddressPlaceholder", "Your Email")}
                className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                required
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition-colors hover:bg-[#1D4ED8]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {footerStatus === "success" && (
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                {t("subscriptionSuccessMessage", "Abonare reușită!")}
              </p>
            )}
            {footerStatus === "error" && (
              <p className="mt-2 text-xs text-rose-600 font-medium">
                {t("subscriptionErrorMessage", "Eroare. Încearcă din nou.")}
              </p>
            )}
          </div>
        </div>

        {/* Return policy bar */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
          {getReturnPolicyText()} ·{" "}
          <Link href="/returns" className="text-[#2563EB] hover:underline">
            {t("seeReturnPolicy", "See policy")}
          </Link>
          {" · "}
          <span>Comenzi COD: refuz/nepreluare colet (RTO) poate genera cost logistic tur + retur · </span>
          <Link href="/shipping" className="text-[#2563EB] hover:underline">
            Detalii livrare
          </Link>
        </div>

        {/* SEO regional links */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Livrare rapidă în
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {getRegionalStemLinks().map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-slate-400 transition-colors hover:text-slate-700"
              >
                {link.label.replace("Jucarii STEM ", "")}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Copyright + legal links */}
          <div className="flex flex-col gap-2.5 text-center sm:text-left">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} {storeName}. {t("allRightsReserved")}
            </p>
            <p className="text-[10px] text-slate-400">
              {t("footerLegalCui", "CUI: 51813997")} · {t("footerLegalRegCom", "J20/352/2025")}
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 sm:justify-start">
              {[
                { label: t("privacyPolicy", "Politica de confidențialitate"), href: "/privacy" },
                { label: t("termsOfService", "Termeni și condiții"), href: "/terms" },
                { label: t("shipping", "Livrare"), href: "/shipping" },
                { label: t("returns", "Retururi"), href: "/returns" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs text-slate-400 transition-colors hover:text-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Payments & delivery partners */}
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:min-w-[340px]">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400 sm:text-right">
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
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_36px_-24px_rgba(37,99,235,0.28)]"
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
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {partner.eyebrow}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {partner.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {partner.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white">
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
