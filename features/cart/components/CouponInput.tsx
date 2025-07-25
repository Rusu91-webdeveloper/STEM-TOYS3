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
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-green-800">
                    {appliedCoupon.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-green-700 border-green-300">
                    {getDiscountText(appliedCoupon)}
                  </Badge>
                  {appliedCoupon.isInfluencer &&
                    appliedCoupon.influencerName && (
                      <Badge
                        variant="secondary"
                        className="text-xs">
                        {appliedCoupon.influencerName}
                      </Badge>
                    )}
                </div>
                <p className="text-sm text-green-700">
                  Code: <span className="font-mono">{appliedCoupon.code}</span>
                  {appliedCoupon.description &&
                    ` • ${appliedCoupon.description}`}
                </p>
                <p className="text-sm font-semibold text-green-800">
                  You saved {appliedCoupon.discountAmount.toFixed(2)} LEI
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              disabled={disabled}
              className="text-green-700 hover:text-green-900 hover:bg-green-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
                disabled={disabled || isValidating}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={disabled || isValidating || !couponCode.trim()}
                size="sm">
                {isValidating ? "Checking..." : "Apply"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Have a discount code? Enter it above to save on your order.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
