"use client";

import Link from "next/link";
import React from "react";

interface SupplierBannerProps {
  t: (key: string, defaultValue?: string) => string;
}

// [INFO] SupplierBanner: Professional, attractive banner designed to convert visitors into suppliers
// - Modern gradient background with professional color scheme
// - Icon-based benefits display for visual appeal
// - Responsive design with mobile-first approach
// - Hover effects and smooth animations
// - Clear call-to-action with conversion tracking
// - Accessible with proper ARIA labels and keyboard navigation

const SupplierBannerComponent = ({ t }: SupplierBannerProps) => {
  const benefits = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 sm:w-6 sm:h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      title: t("supplier_benefit_1", "Lucrare Rapidă"),
      description: t("supplier_benefit_1_desc", "Plăți în 30 de zile"),
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 sm:w-6 sm:h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      title: t("supplier_benefit_2", "Crescere Rapidă"),
      description: t("supplier_benefit_2_desc", "Acces la piața românească"),
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 sm:w-6 sm:h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      ),
      title: t("supplier_benefit_3", "Suport Complet"),
      description: t(
        "supplier_benefit_3_desc",
        "Asistență tehnică și marketing"
      ),
    },
  ];

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Main Banner Content */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-lg sm:shadow-xl lg:shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center">
              {/* Left Side - Text Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white/90 backdrop-blur-sm mb-2 sm:mb-3 md:mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"
                    />
                  </svg>
                  {t("supplier_opportunity", "Oportunitate de Afaceri")}
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight">
                  {t("supplier_banner_title", "Devino Furnizor TechTots")}
                </h2>

                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {t(
                    "supplier_banner_subtitle",
                    "Alătură-te rețelei noastre de furnizori și ajută la educarea generațiilor viitoare cu jucării STEM de calitate."
                  )}
                </p>

                {/* CTA Button */}
                <Link
                  href="/supplier"
                  aria-label={t("become_supplier")}
                  tabIndex={0}
                  data-conversion="cta"
                  data-conversion-type="click"
                  data-conversion-category="supplier_banner"
                  data-conversion-action="become_supplier"
                  data-conversion-element="supplier_banner_button"
                  className="inline-flex items-center justify-center px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-white text-blue-600 hover:bg-gray-50 font-semibold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 group"
                >
                  {t("become_supplier")}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 md:ml-3 transform transition-transform group-hover:translate-x-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </div>

              {/* Right Side - Benefits Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105 group cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`${benefit.title}: ${benefit.description}`}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.location.href = "/supplier";
                      }
                    }}
                    onClick={() => (window.location.href = "/supplier")}
                  >
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-white/20 rounded-lg sm:rounded-xl lg:rounded-2xl mb-2 sm:mb-3 group-hover:bg-white/30 transition-colors duration-300">
                      <div className="text-white group-hover:scale-110 transition-transform duration-300">
                        {benefit.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-1 sm:mb-2 leading-tight truncate">
                      {benefit.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[10px] sm:text-xs md:text-sm text-white/80 leading-tight line-clamp-2">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const SupplierBanner = React.memo(SupplierBannerComponent);
