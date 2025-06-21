"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { TranslationKey } from "@/lib/i18n/translations";
import { useState } from "react";

const footerLinks = {
  shop: [
    { name: "products", href: "/products" },
    { name: "categories", href: "/categories" },
    { name: "blog", href: "/blog" },
  ],
  account: [
    { name: "myAccount", href: "/account" },
    { name: "orders", href: "/account/orders" },
    { name: "wishlist", href: "/account/wishlist" },
    { name: "addresses", href: "/account/addresses" },
  ],
  customerService: [
    { name: "contactUsLink", href: "/contact" },
    { name: "returnPolicyLink", href: "/returns" },
    { name: "warrantyLink", href: "/warranty" },
  ],
  company: [
    { name: "about", href: "/about" },
    { name: "blog", href: "/blog" },
    { name: "contactUsLink", href: "/contact" },
  ],
  legal: [
    { name: "termsOfService", href: "/terms" },
    { name: "privacyPolicy", href: "/privacy" },
  ],
};

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscriptionStatus("success");
        setEmail("");
      } else {
        setSubscriptionStatus("error");
      }
    } catch (error) {
      setSubscriptionStatus("error");
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setSubscriptionStatus("idle"), 3000);
    }
  };

  return (
    <footer
      className="bg-gradient-to-r from-gray-800 to-gray-900 text-white relative z-10 shadow-lg"
      role="contentinfo">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
              {t("joinEducatorsParents")}
            </h3>
            <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6">
              {t("newsletterSubtitle")}
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              aria-label="Newsletter signup">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailAddressPlaceholder")}
                className="flex-1 px-4 py-2 sm:py-3 rounded-lg text-gray-900 text-sm sm:text-base"
                aria-label="Email address for newsletter"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="bg-white text-blue-600 font-semibold px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
                aria-label="Subscribe to newsletter">
                {isSubscribing ? t("subscribing") : t("getFreeResources")}
              </button>
            </form>
            {subscriptionStatus === "success" && (
              <p
                className="text-green-200 text-sm mt-2"
                role="status"
                aria-live="polite">
                {t("subscriptionSuccessMessage")}
              </p>
            )}
            {subscriptionStatus === "error" && (
              <p
                className="text-red-200 text-sm mt-2"
                role="alert"
                aria-live="polite">
                {t("subscriptionErrorMessage")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 sm:py-10 md:py-12 px-3 sm:px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center mb-4"
              aria-label="TechTots home page">
              <Image
                src="/TechTots_LOGO.png"
                alt="TechTots Logo"
                width={130}
                height={40}
                className="h-8 sm:h-9 md:h-10 w-auto"
              />
            </Link>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mb-4">
              Împuternicim următoarea generație prin învățarea STEM practică.
              Descoperă colecția noastră curată de jucării educaționale și
              resurse concepute de educatori, pentru educatori.
            </p>

            {/* Enhanced Trust Signals */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-green-400">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Transport GRATUIT la comenzi peste 50€
              </div>
              <div className="flex items-center text-xs text-green-400">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Returnări în 30 de zile pentru produse fizice
              </div>
              <div className="flex items-start text-xs text-amber-300">
                <svg
                  className="w-4 h-4 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Cărțile digitale sunt livrate instant și nu pot fi returnate
                  conform politicii de returnare
                </span>
              </div>
              <div className="flex items-center text-xs text-green-400">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Securitate și criptare la nivel bancar
              </div>
              <div className="flex items-center text-xs text-green-400">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                De încredere pentru 50.000+ educatori din întreaga lume
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3 sm:space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=61577557110903"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Follow us on Facebook">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/techtots_magazin/"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Follow us on Instagram">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://x.com/RusuEmanue41893"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Follow us on Twitter">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-3">
              MAGAZIN
            </h3>
            <nav aria-label="Shop navigation">
              <ul className="space-y-2">
                {footerLinks.shop.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors">
                      {item.name === "products" && "Produse"}
                      {item.name === "categories" && "Categorii STEM"}
                      {item.name === "blog" && "Cărți educaționale"}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-3">
              SERVICII CLIENȚI
            </h3>
            <nav aria-label="Customer Service navigation">
              <ul className="space-y-2">
                {footerLinks.account.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors">
                      {item.name === "myAccount" && "Centru de Ajutor"}
                      {item.name === "orders" && "Contactează-ne"}
                      {item.name === "wishlist" && "Chat Live"}
                      {item.name === "addresses" && "Urmărire Comandă"}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Support & Info */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-3">
              SUPORT COMENZI
            </h3>
            <nav aria-label="Support navigation">
              <ul className="space-y-2">
                {footerLinks.customerService.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors">
                      {item.name === "contactUsLink" && "Informații Livrare"}
                      {item.name === "returnPolicyLink" &&
                        "Politica de Returnare"}
                      {item.name === "warrantyLink" && "Garanție"}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Digital Products Policy */}
            <div className="mt-4 pt-3 border-t border-gray-600">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-2">
                PRODUSE DIGITALE
              </h4>
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-start">
                  <svg
                    className="w-3 h-3 mr-1.5 mt-0.5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Livrare instantanee prin email</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-3 h-3 mr-1.5 mt-0.5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Descărcare disponibilă 30 zile</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-3 h-3 mr-1.5 mt-0.5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Nu pot fi returnate (politica UE)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Company Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 pt-8 border-t border-gray-700">
          {/* Contact Information */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-3">
              CONTACT ȘI SUPORT
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-200">
                  Ore de Program:
                </p>
                <p className="text-xs text-gray-300">
                  Lun-Dum: 9:00 AM - 6:00 PM CET
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-200">
                  Asistență Clienți:
                </p>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>
                    <a
                      href="mailto:webira.rem.srl@gmail.com"
                      className="hover:text-white transition-colors">
                      📧 webira.rem.srl@gmail.com
                    </a>
                  </p>
                  <p>
                    <a
                      href="tel:+40771248029"
                      className="hover:text-white transition-colors">
                      📞 0771 248 029
                    </a>
                  </p>
                  <p>
                    <a
                      href="/contact"
                      className="hover:text-white transition-colors">
                      💬 Chat Live
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-200">
                  Sediul Central:
                </p>
                <address className="text-xs text-gray-300 not-italic">
                  TechTots Educational Solutions
                  <br />
                  Mehedinți 54-56
                  <br />
                  Cluj-Napoca, Cluj 400000
                  <br />
                  România, UE
                </address>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-3">
              COMPANIE
            </h3>
            <nav aria-label="Company information navigation">
              <ul className="space-y-2">
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors">
                      {item.name === "about" && "Despre noi"}
                      {item.name === "blog" && "Povestea Noastră"}
                      {item.name === "contactUsLink" && "Cariere"}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Payment & Security */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-200 mb-3">
              PLATĂ ȘI SECURITATE
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-200 mb-2">
                  Acceptăm:
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="img"
                  aria-label="Accepted payment methods">
                  <div className="bg-white rounded px-2 py-1 text-xs text-gray-800 font-semibold">
                    Visa
                  </div>
                  <div className="bg-white rounded px-2 py-1 text-xs text-gray-800 font-semibold">
                    Mastercard
                  </div>
                  <div className="bg-blue-600 rounded px-2 py-1 text-xs text-white font-semibold">
                    PayPal
                  </div>
                  <div className="bg-purple-600 rounded px-2 py-1 text-xs text-white font-semibold">
                    Stripe
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-200 mb-2">
                  Securitate și Conformitate:
                </p>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>🔒 Criptare SSL 256-Bit</p>
                  <p>✅ Compatibil GDPR</p>
                  <p>✅ Certificat ISO 27001</p>
                  <p>⭐ Compatibil PCI DSS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <nav aria-label="Legal information navigation">
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {footerLinks.legal.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-xs text-gray-300 hover:text-white transition-colors">
                    {item.name === "termsOfService" && "Termeni și Condiții"}
                    {item.name === "privacyPolicy" &&
                      "Politica de Confidențialitate"}
                  </Link>
                ))}
                <Link
                  href="/blog"
                  className="text-xs text-gray-300 hover:text-white transition-colors">
                  Hartă Site
                </Link>
                <Link
                  href="/contact"
                  className="text-xs text-gray-300 hover:text-white transition-colors">
                  Conformitate GDPR
                </Link>
              </div>
            </nav>

            <div className="text-xs text-gray-300">
              <p>
                &copy; {new Date().getFullYear()} TechTots Educational
                Solutions. Toate drepturile rezervate.
              </p>
              <p className="mt-1">
                Inspirăm mințile tinere prin educația STEM din 2025.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
