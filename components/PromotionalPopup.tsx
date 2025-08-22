"use client";

import {
  X,
  Copy,
  Clock,
  ShoppingBag,
  Sparkles,
  Gift,
  Star,
  Zap,
} from "lucide-react";
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
  const [isAnimating, setIsAnimating] = useState(false);
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
            setIsAnimating(true);
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
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      // Mark as seen for this session
      sessionStorage.setItem("promotional-popup-seen", "true");
    }, 300);
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
      {/* Enhanced Backdrop with Blur */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Main Popup Container */}
      <div
        className={`relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 transform ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Premium Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-red-700">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-300/20 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>
        </div>

        {/* Enhanced Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 group border border-white/30 shadow-lg hover:scale-110"
          aria-label={t("closePopup")}
        >
          <X className="h-5 w-5 text-white group-hover:rotate-90 transition-all duration-300" />
        </button>

        {/* Content Container */}
        <div className="relative z-20 p-6 sm:p-8">
          {/* Header with Premium Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white/30 shadow-lg mb-4">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="font-bold text-sm text-white uppercase tracking-wide">
                {language === "ro" ? "OFERTĂ EXCLUSIVĂ" : "EXCLUSIVE OFFER"}
              </span>
              <Sparkles className="h-4 w-4 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              {coupon.name}
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto">
              {language === "ro"
                ? "Descoperă produsele noastre STEM cu această ofertă specială"
                : "Discover our STEM products with this special offer"}
            </p>
          </div>

          {/* Main Discount Display */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              {/* Discount Badge */}
              <div className="bg-gradient-to-r from-white to-gray-100 rounded-2xl p-1 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl px-8 py-6 text-white relative overflow-hidden">
                  {/* Animated Background Elements */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-400/20 to-red-600/20"></div>
                  <div className="absolute top-2 right-2">
                    <Gift className="h-6 w-6 text-white/30" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1">
                      {
                        coupon.discountText[
                          language as keyof typeof coupon.discountText
                        ]
                      }
                    </div>
                    <div className="text-sm sm:text-base opacity-90 font-medium">
                      {language === "ro" ? "REDUCERE" : "DISCOUNT"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stars */}
              <div className="absolute -top-2 -left-2">
                <Star className="h-4 w-4 text-yellow-300 animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Zap className="h-4 w-4 text-yellow-300 animate-pulse delay-500" />
              </div>
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
            <div className="text-center mb-4">
              <div className="text-white/90 text-sm font-medium mb-3 flex items-center justify-center gap-2">
                <Copy className="h-4 w-4" />
                {language === "ro" ? "FOLOSEȘTE CODUL" : "USE CODE"}
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 max-w-xs">
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-xl p-4 text-center hover:bg-white/25 transition-all duration-300 shadow-lg group">
                    <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white group-hover:scale-105 transition-transform duration-300">
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
                  } backdrop-blur-sm text-white border-white/40 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-105 shadow-lg min-w-[60px]`}
                  variant="outline"
                >
                  <Copy
                    className={`h-5 w-5 ${copiedCode ? "text-white" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3 mb-6">
            {coupon.expiryText && (
              <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {
                    coupon.expiryText[
                      language as keyof typeof coupon.expiryText
                    ]
                  }
                </span>
              </div>
            )}
            {coupon.minOrderText && (
              <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {
                    coupon.minOrderText[
                      language as keyof typeof coupon.minOrderText
                    ]
                  }
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleClose}
            size="lg"
            className="w-full bg-gradient-to-r from-white to-gray-100 text-gray-900 hover:from-gray-100 hover:to-white font-bold px-8 py-4 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20 text-lg"
          >
            <div className="flex items-center justify-center gap-3">
              <ShoppingBag className="h-5 w-5" />
              <span className="font-bold">
                {language === "ro"
                  ? "Cumpără Acum & Economisește"
                  : "Shop Now & Save"}
              </span>
            </div>
          </Button>

          {/* Footer */}
          <div className="text-center mt-6">
            <div className="text-white/60 text-xs space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3" />
                <span>
                  {language === "ro"
                    ? "Ofertă cu Timp Limitat"
                    : "Limited Time Offer"}
                </span>
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-3 w-3" />
                <span>
                  {language === "ro"
                    ? "Valabil în limita stocului"
                    : "Valid while supplies last"}
                </span>
                <Gift className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
