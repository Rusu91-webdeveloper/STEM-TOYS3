"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Clock,
  Mail,
  Percent,
  Gift,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/features/cart/context/CartContext";
import { CART, TIME } from "@/lib/constants";

interface AbandonmentPreventionProps {
  enabled?: boolean;
  exitIntentDelay?: number;
  idleTimeThreshold?: number;
  minimumCartValue?: number;
  className?: string;
}

interface AbandonmentOffer {
  id: string;
  type: "discount" | "shipping" | "gift" | "urgency";
  title: string;
  description: string;
  value?: number;
  code?: string;
  expiresIn?: number;
  icon: React.ComponentType<{ className?: string }>;
}

const ABANDONMENT_OFFERS: AbandonmentOffer[] = [
  {
    id: "discount10",
    type: "discount",
    title: "10% Off Your Order",
    description: "Complete your purchase now and save 10%",
    value: 10,
    code: "SAVE10NOW",
    expiresIn: CART.DISCOUNT_OFFER_EXPIRY,
    icon: Percent,
  },
  {
    id: "freeshipping",
    type: "shipping",
    title: "Free Shipping",
    description: "Get free shipping on your entire order",
    code: "FREESHIP",
    expiresIn: CART.SHIPPING_OFFER_EXPIRY,
    icon: Gift,
  },
  {
    id: "urgency",
    type: "urgency",
    title: "Limited Stock Alert",
    description: "Some items in your cart are running low",
    icon: AlertTriangle,
  },
];

export function CartAbandonmentPrevention({
  enabled = true,
  exitIntentDelay = 3000,
  idleTimeThreshold = 5 * 60 * 1000, // 5 minutes
  minimumCartValue = 25,
  className,
}: AbandonmentPreventionProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { items, getTotal } = useCart();
  const totalPrice = getTotal();
  const router = useRouter();

  const [isExitIntentModalOpen, setIsExitIntentModalOpen] = useState(false);
  const [isIdleModalOpen, setIsIdleModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<AbandonmentOffer | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);
  const [hasShownIdleWarning, setHasShownIdleWarning] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const exitIntentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  useEffect(() => {
    if (!enabled || items.length === 0 || totalPrice < minimumCartValue) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [enabled, items.length, totalPrice, minimumCartValue]);

  // Exit intent detection
  useEffect(() => {
    if (
      !enabled ||
      items.length === 0 ||
      totalPrice < minimumCartValue ||
      hasShownExitIntent
    )
      return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Detect if mouse is leaving the top of the viewport
      if (e.clientY <= 0) {
        if (exitIntentTimeoutRef.current) {
          clearTimeout(exitIntentTimeoutRef.current);
        }

        exitIntentTimeoutRef.current = setTimeout(() => {
          setHasShownExitIntent(true);
          triggerAbandonmentPrevention("exit_intent");
        }, exitIntentDelay);
      }
    };

    const handleMouseEnter = () => {
      if (exitIntentTimeoutRef.current) {
        clearTimeout(exitIntentTimeoutRef.current);
        exitIntentTimeoutRef.current = null;
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (exitIntentTimeoutRef.current) {
        clearTimeout(exitIntentTimeoutRef.current);
      }
    };
  }, [
    enabled,
    items.length,
    totalPrice,
    minimumCartValue,
    hasShownExitIntent,
    exitIntentDelay,
  ]);

  // Idle time detection
  useEffect(() => {
    if (
      !enabled ||
      items.length === 0 ||
      totalPrice < minimumCartValue ||
      hasShownIdleWarning
    )
      return;

    const checkIdleTime = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity >= idleTimeThreshold) {
        setHasShownIdleWarning(true);
        triggerAbandonmentPrevention("idle_time");
      } else {
        // Check again in 30 seconds
        idleTimeoutRef.current = setTimeout(checkIdleTime, 30000);
      }
    };

    idleTimeoutRef.current = setTimeout(checkIdleTime, idleTimeThreshold);

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [
    enabled,
    items.length,
    totalPrice,
    minimumCartValue,
    hasShownIdleWarning,
    idleTimeThreshold,
  ]);

  // Countdown timer for offers
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [timeLeft]);

  const triggerAbandonmentPrevention = useCallback(
    (trigger: "exit_intent" | "idle_time") => {
      // Select appropriate offer based on cart value and trigger
      let offer = ABANDONMENT_OFFERS[0]; // Default to discount

      if (totalPrice > 75) {
        offer = ABANDONMENT_OFFERS[1]; // Free shipping for higher value carts
      } else if (trigger === "idle_time") {
        offer = ABANDONMENT_OFFERS[2]; // Urgency for idle users
      }

      setSelectedOffer(offer);

      if (offer.expiresIn) {
        setTimeLeft(offer.expiresIn);
      }

      if (trigger === "exit_intent") {
        setIsExitIntentModalOpen(true);
      } else {
        setIsIdleModalOpen(true);
      }

      // Track abandonment event
      trackAbandonmentEvent(trigger, offer.id);
    },
    [totalPrice]
  );

  const handleAcceptOffer = useCallback(async () => {
    if (!selectedOffer) return;

    setIsProcessing(true);

    try {
      // Apply the offer to the cart
      if (selectedOffer.code) {
        const response = await fetch("/api/cart/apply-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: selectedOffer.code,
            source: "abandonment_prevention",
          }),
        });

        if (response.ok) {
          toast({
            title: t("offerApplied", "Offer Applied!"),
            description: selectedOffer.description,
          });
        }
      }

      // Close modals and redirect to checkout
      setIsExitIntentModalOpen(false);
      setIsIdleModalOpen(false);
      router.push("/checkout");

      // Track conversion
      trackAbandonmentConversion(selectedOffer.id);
    } catch (error) {
      console.error("Failed to apply offer:", error);
      toast({
        title: t("error", "Error"),
        description: t(
          "failedToApplyOffer",
          "Failed to apply offer. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedOffer, router, t]);

  const handleEmailCapture = useCallback(async () => {
    if (!email.trim()) {
      toast({
        title: t("emailRequired", "Email Required"),
        description: t("pleaseEnterEmail", "Please enter your email address."),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Save cart and email for recovery
      const response = await fetch("/api/cart/save-for-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cartItems: items,
          totalPrice,
          offerCode: selectedOffer?.code,
          source: "abandonment_prevention",
        }),
      });

      if (response.ok) {
        toast({
          title: t("cartSaved", "Cart Saved!"),
          description: t(
            "cartRecoveryEmail",
            "We'll send you a reminder to complete your purchase."
          ),
        });

        setIsEmailCaptureOpen(false);
        setIsExitIntentModalOpen(false);
        setIsIdleModalOpen(false);

        // Track email capture
        trackEmailCapture(selectedOffer?.id);
      }
    } catch (error) {
      console.error("Failed to save cart for recovery:", error);
      toast({
        title: t("error", "Error"),
        description: t(
          "failedToSaveCart",
          "Failed to save cart. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [email, items, totalPrice, selectedOffer, t]);

  const handleDismiss = useCallback(
    (reason: "continue_shopping" | "not_interested" | "close") => {
      setIsExitIntentModalOpen(false);
      setIsIdleModalOpen(false);

      if (reason === "continue_shopping") {
        router.push("/products");
      }

      // Track dismissal
      trackAbandonmentDismissal(selectedOffer?.id, reason);
    },
    [router, selectedOffer]
  );

  const trackAbandonmentEvent = useCallback(
    async (trigger: string, offerId: string) => {
      try {
        await fetch("/api/analytics/abandonment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "triggered",
            trigger,
            offerId,
            cartValue: totalPrice,
            itemCount: items.length,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        console.error("Failed to track abandonment event:", error);
      }
    },
    [totalPrice, items.length]
  );

  const trackAbandonmentConversion = useCallback(
    async (offerId: string) => {
      try {
        await fetch("/api/analytics/abandonment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "converted",
            offerId,
            cartValue: totalPrice,
            itemCount: items.length,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        console.error("Failed to track abandonment conversion:", error);
      }
    },
    [totalPrice, items.length]
  );

  const trackEmailCapture = useCallback(
    async (offerId?: string) => {
      try {
        await fetch("/api/analytics/abandonment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "email_captured",
            offerId,
            cartValue: totalPrice,
            itemCount: items.length,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        console.error("Failed to track email capture:", error);
      }
    },
    [totalPrice, items.length]
  );

  const trackAbandonmentDismissal = useCallback(
    async (offerId?: string, reason?: string) => {
      try {
        await fetch("/api/analytics/abandonment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "dismissed",
            offerId,
            reason,
            cartValue: totalPrice,
            itemCount: items.length,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        console.error("Failed to track abandonment dismissal:", error);
      }
    },
    [totalPrice, items.length]
  );

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Common modal content
  const ModalContent = ({
    title,
    children,
    showEmailCapture = false,
  }: {
    title: string;
    children: React.ReactNode;
    showEmailCapture?: boolean;
  }) => (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
      </div>

      {children}

      {selectedOffer && (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <selectedOffer.icon className="h-5 w-5" />
              {selectedOffer.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedOffer.description}
            </p>

            {selectedOffer.code && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {selectedOffer.code}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t("useThisCode", "Use this code at checkout")}
                </span>
              </div>
            )}

            {timeLeft && timeLeft > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t("offerExpires", "Offer expires in:")}
                  </span>
                  <span className="font-mono font-bold text-red-600">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <Progress
                  value={(timeLeft / (selectedOffer.expiresIn || 1)) * 100}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleAcceptOffer}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing
            ? t("processing", "Processing...")
            : selectedOffer?.type === "urgency"
              ? t("completeOrderNow", "Complete My Order Now")
              : t("claimOfferAndCheckout", "Claim Offer & Checkout")}
        </Button>

        {showEmailCapture && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t("enterEmail", "Enter your email")}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleEmailCapture}
                disabled={isProcessing}
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t("saveCartForLater", "Save your cart and get reminded later")}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleDismiss("continue_shopping")}
            className="flex-1"
          >
            {t("continueShopping", "Continue Shopping")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleDismiss("not_interested")}
            className="flex-1"
          >
            {t("noThanks", "No Thanks")}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!enabled || items.length === 0 || totalPrice < minimumCartValue) {
    return null;
  }

  return (
    <div className={className}>
      {/* Exit Intent Modal */}
      <Dialog
        open={isExitIntentModalOpen}
        onOpenChange={setIsExitIntentModalOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t("waitBeforeYouGo", "Wait! Before you go...")}
            </DialogTitle>
          </DialogHeader>
          <ModalContent
            title={t("waitBeforeYouGo", "Wait! Before you go...")}
            showEmailCapture
          >
            <p className="text-center text-muted-foreground">
              {t(
                "dontMissOut",
                "Don't miss out on these amazing STEM products in your cart!"
              )}
            </p>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span>{t("cartValue", "Cart Value:")}</span>
                <span className="font-bold">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t("itemCount", "Items:")}</span>
                <span>{items.length}</span>
              </div>
            </div>
          </ModalContent>
        </DialogContent>
      </Dialog>

      {/* Idle Time Modal */}
      <Dialog open={isIdleModalOpen} onOpenChange={setIsIdleModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("stillThere", "Still there?")}</DialogTitle>
          </DialogHeader>
          <ModalContent
            title={t("stillThere", "Still there?")}
            showEmailCapture
          >
            <p className="text-center text-muted-foreground">
              {t(
                "cartWaiting",
                "Your cart is waiting for you! Complete your purchase to secure these educational products."
              )}
            </p>
          </ModalContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}
