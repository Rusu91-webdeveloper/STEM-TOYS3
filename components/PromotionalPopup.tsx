"use client";

import { X, Copy, Clock, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";

interface PromotionalCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  image?: string;
  minimumOrderValue?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  isInfluencer: boolean;
  influencerName?: string;
  discountText: {
    en: string;
    ro: string;
  };
  expiryText?: {
    en: string;
    ro: string;
  } | null;
  minOrderText?: {
    en: string;
    ro: string;
  } | null;
}

export default function PromotionalPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [coupon, setCoupon] = useState<PromotionalCoupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const { toast } = useToast();
  const { t, language } = useTranslation();

  useEffect(() => {
    // Check if user has already seen a popup in this session
    const hasSeenPopup = sessionStorage.getItem("promotional-popup-seen");

    if (hasSeenPopup) {
      setIsLoading(false);
      return;
    }

    // Delay popup appearance to not interrupt page loading
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/coupons/popup");
        if (response.ok) {
          const data = await response.json();
          if (data.coupon) {
            setCoupon(data.coupon);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Error fetching promotional coupon:", error);
      } finally {
        setIsLoading(false);
      }
    }, 2500); // 2.5-second delay

    return () => clearTimeout(timer);
  }, []);

  // Add keyboard support for closing popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when popup is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    // Mark as seen for this session
    sessionStorage.setItem("promotional-popup-seen", "true");
  };

  const handleCopyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: t("copied"),
        description: t("couponCodeCopied").replace("{code}", coupon.code),
      });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay, not the popup content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (isLoading || !coupon || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Enhanced Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500"
        onClick={handleOverlayClick}
      />

      {/* Main Popup Container */}
      <div className="relative max-w-lg w-full max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500 transform">
        {/* Hero Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/homepage_hero_banner_01.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/85 via-pink-800/85 to-red-700/85" />
          {/* Additional overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Enhanced Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-30 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 group border border-white/30 shadow-lg"
          aria-label={t("closePopup")}
        >
          <X className="h-6 w-6 text-white group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
        </button>

        {/* Split Design Container */}
        <div className="relative z-20 h-full flex flex-col">
          {/* ROMANIAN SECTION - TOP HALF */}
          <div className="flex-1 p-8 text-white border-b-2 border-white/20 relative">
            {/* Romanian Flag Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
                <span className="text-2xl">🇷🇴</span>
                <span className="font-bold text-lg">OFERTĂ SPECIALĂ</span>
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
            </div>

            {/* Romanian Content */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold leading-tight">
                {coupon.name}
              </h2>

              {/* Discount Display */}
              <div className="inline-block p-1 bg-white/20 backdrop-blur-sm rounded-2xl">
                <div className="bg-white text-gray-900 rounded-xl px-6 py-3 shadow-lg">
                  <div className="text-3xl font-black text-red-600">
                    {coupon.discountText.ro}
                  </div>
                </div>
              </div>

              {/* Romanian Details */}
              <div className="space-y-2 text-sm text-white/90">
                {coupon.expiryText && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{coupon.expiryText.ro}</span>
                  </div>
                )}
                {coupon.minOrderText && (
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{coupon.minOrderText.ro}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ENGLISH SECTION - BOTTOM HALF */}
          <div className="flex-1 p-8 text-white relative">
            {/* English Flag Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
                <span className="text-2xl">🇬🇧</span>
                <span className="font-bold text-lg">SPECIAL OFFER</span>
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
            </div>

            {/* English Content */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold leading-tight">
                {coupon.name}
              </h2>

              {/* Discount Display */}
              <div className="inline-block p-1 bg-white/20 backdrop-blur-sm rounded-2xl">
                <div className="bg-white text-gray-900 rounded-xl px-6 py-3 shadow-lg">
                  <div className="text-3xl font-black text-red-600">
                    {coupon.discountText.en}
                  </div>
                </div>
              </div>

              {/* English Details */}
              <div className="space-y-2 text-sm text-white/90">
                {coupon.expiryText && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{coupon.expiryText.en}</span>
                  </div>
                )}
                {coupon.minOrderText && (
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{coupon.minOrderText.en}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coupon Code Section - Spans Full Width */}
          <div className="p-6 bg-white/10 backdrop-blur-md border-t-2 border-white/20">
            <div className="text-center mb-4">
              <div className="text-white/90 text-sm font-medium mb-3">
                🇷🇴 Folosește codul • 🇬🇧 Use code
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 max-w-xs">
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl p-4 text-center hover:bg-white/25 transition-all duration-300 shadow-lg">
                    <div className="font-mono text-2xl font-bold tracking-widest text-white">
                      {coupon.code}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  className={`${
                    copiedCode
                      ? "bg-green-500/80 hover:bg-green-500/90"
                      : "bg-white/25 hover:bg-white/35"
                  } backdrop-blur-sm text-white border-white/40 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-105 shadow-lg`}
                  variant="outline"
                >
                  <Copy
                    className={`h-5 w-5 ${copiedCode ? "text-white" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Dual Language CTA Button */}
            <Button
              onClick={handleClose}
              size="lg"
              className="w-full bg-gradient-to-r from-white to-gray-100 text-gray-900 hover:from-gray-100 hover:to-white font-bold px-8 py-4 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-base font-bold">
                    🇷🇴 Cumpără Acum & Economisește
                  </div>
                  <div className="text-sm opacity-80">🇬🇧 Shop Now & Save</div>
                </div>
              </div>
            </Button>

            {/* Footer */}
            <div className="text-center mt-4">
              <div className="text-white/70 text-xs space-y-1">
                <div>✨ Ofertă cu Timp Limitat • Limited Time Offer ✨</div>
                <div>
                  🎯 Valabil în limita stocului • Valid while supplies last 🎯
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
