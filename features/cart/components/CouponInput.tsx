"use client";

import { Tag, X, Check } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface CouponInputProps {
  cartTotal: number;
  appliedCoupon?: {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    discountAmount: number;
    isInfluencer: boolean;
    influencerName?: string;
  } | null;
  onCouponApplied: (coupon: any, discountAmount: number) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
}

export default function CouponInput({
  cartTotal,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    if (cartTotal <= 0) {
      toast({
        title: "Error",
        description: "Add items to your cart before applying a coupon",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate coupon");
      }

      if (data.isValid) {
        onCouponApplied(data.coupon, data.discountAmount);
        setCouponCode("");

        toast({
          title: "Coupon Applied!",
          description: `${data.coupon.name} - You saved ${data.discountAmount.toFixed(2)} LEI`,
        });
      } else {
        throw new Error(data.error || "Invalid coupon code");
      }
    } catch (error) {
      toast({
        title: "Invalid Coupon",
        description:
          error instanceof Error
            ? error.message
            : "This coupon code is not valid",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order",
    });
  };

  const getDiscountText = (coupon: NonNullable<typeof appliedCoupon>) => {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}% OFF`;
    }
    return `${coupon.value} LEI OFF`;
  };

  if (appliedCoupon) {
    return (
      <Card className="relative border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm transition-all duration-300 hover:shadow-md">
        <CardContent className="p-3 sm:p-4">
          {/* Mobile: Vertical stack, Desktop: Horizontal flex */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Left Section: Icon + Primary Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon with subtle animation */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                <Check className="h-5 w-5 text-white" />
              </div>

              {/* Content: Stacks on mobile, inline on desktop */}
              <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                {/* Name + Discount Badge (primary focus) */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm sm:text-base text-green-900 leading-tight">
                    {appliedCoupon.name}
                  </span>
                  <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 text-xs shadow-sm">
                    {getDiscountText(appliedCoupon)}
                  </Badge>
                </div>

                {/* Secondary info: Code + Savings (compact) */}
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm text-green-700 font-mono tracking-wide">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-green-800">
                    You saved {appliedCoupon.discountAmount.toFixed(2)} LEI
                  </p>
                </div>

                {/* Influencer badge: Only show on desktop or when critical */}
                {appliedCoupon.isInfluencer && appliedCoupon.influencerName && (
                  <Badge
                    variant="secondary"
                    className="text-xs mt-1.5 hidden sm:inline-flex"
                  >
                    {appliedCoupon.influencerName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Remove Button: Absolute top-right on mobile, inline on desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              disabled={disabled}
              className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 
                         h-8 w-8 min-w-[32px] p-0 rounded-full
                         text-green-700 hover:text-red-600 hover:bg-red-50 
                         transition-all duration-200 active:scale-95
                         focus:ring-2 focus:ring-red-300 focus:outline-none"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2">
          {/* Input Row: Flexible, mobile-optimized */}
          <div className="flex items-center gap-2">
            {/* Icon: Hidden on xs screens */}
            <div
              className="hidden sm:flex items-center justify-center w-9 h-9 
                            bg-gradient-to-br from-gray-100 to-gray-50 
                            rounded-lg flex-shrink-0 border border-gray-200"
            >
              <Tag className="h-4 w-4 text-gray-600" />
            </div>

            {/* Input: Flex-grow */}
            <Input
              placeholder="Enter code"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={e => e.key === "Enter" && handleApplyCoupon()}
              disabled={disabled || isValidating}
              className="flex-1 h-10 sm:h-11 font-mono text-sm sm:text-base 
                         focus:ring-2 focus:ring-primary transition-all"
              aria-label="Coupon code input"
            />

            {/* Apply Button: Prominent, finger-friendly */}
            <Button
              onClick={handleApplyCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              size="default"
              className="h-10 sm:h-11 px-4 sm:px-6 font-semibold 
                         transition-all duration-200 active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span className="hidden sm:inline">Checking</span>
                </span>
              ) : (
                "Apply"
              )}
            </Button>
          </div>

          {/* Helper text: Shorter on mobile */}
          <p className="text-xs text-gray-500 px-1">
            <span className="hidden sm:inline">
              Have a discount code? Enter it above to save on your order.
            </span>
            <span className="sm:hidden">Enter discount code to save</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
