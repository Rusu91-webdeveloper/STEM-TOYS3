"use client";

import { Edit, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";

import { CheckoutData, CheckoutStep } from "../types";

import { CheckoutSummary } from "./CheckoutSummary";

interface OrderReviewProps {
  checkoutData: CheckoutData;
  onEditStep: (step: CheckoutStep) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
  isProcessingOrder?: boolean;
  orderError?: string | null;
  appliedCoupon?: any;
  discountAmount?: number;
}

export function OrderReview({
  checkoutData,
  onEditStep,
  onBack,
  onPlaceOrder,
  isProcessingOrder = false,
  orderError = null,
  appliedCoupon,
  discountAmount = 0,
}: OrderReviewProps) {
  const { getCartTotal } = useCart();
  const { formatPrice } = useCurrency();
  const [taxRate, setTaxRate] = useState(0.21); // Default 21%
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const [isFreeShippingActive, setIsFreeShippingActive] = useState(false);

  // Fetch tax and shipping settings
  useEffect(() => {
    async function loadSettings() {
      try {
        // Load tax settings
        const taxResponse = await fetch("/api/checkout/tax-settings");
        if (taxResponse.ok) {
          const taxData = await taxResponse.json();
          if (taxData.taxSettings?.active) {
            setTaxRate(parseFloat(taxData.taxSettings.rate) / 100);
          }
        }

        // Load shipping settings for free shipping
        const shippingResponse = await fetch("/api/checkout/shipping-settings");
        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json();
          if (shippingData.freeThreshold?.active) {
            setFreeShippingThreshold(
              parseFloat(shippingData.freeThreshold.price)
            );
            setIsFreeShippingActive(true);
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }

    loadSettings();
  }, []);

  // Calculate totals WITH DISCOUNT
  const subtotal = getCartTotal();
  let shippingCost = checkoutData.shippingMethod?.price || 0;

  // Apply free shipping if threshold is met
  if (
    isFreeShippingActive &&
    freeShippingThreshold !== null &&
    subtotal >= freeShippingThreshold
  ) {
    shippingCost = 0;
  }

  const tax = subtotal * taxRate;
  // **UPDATED TOTAL CALCULATION WITH DISCOUNT**
  const totalBeforeDiscount = subtotal + tax + shippingCost;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  // Format a credit card number for display
  const formatCreditCard = (cardNumber: string) => {
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">Order Review</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Te rugăm să verifici comanda înainte de a o plasa.
          </p>
        </div>

        {/* Shipping Address */}
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              Shipping Address
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary text-xs sm:text-sm"
              onClick={() => onEditStep("shipping-address")}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Editează
            </Button>
          </div>

          {checkoutData.shippingAddress ? (
            <div className="text-xs sm:text-sm">
              <p className="break-words">
                {checkoutData.shippingAddress.fullName}
              </p>
              <p className="break-words">
                {checkoutData.shippingAddress.addressLine1}
              </p>
              {checkoutData.shippingAddress.addressLine2 && (
                <p className="break-words">
                  {checkoutData.shippingAddress.addressLine2}
                </p>
              )}
              <p className="break-words">
                {checkoutData.shippingAddress.city},{" "}
                {checkoutData.shippingAddress.state}{" "}
                {checkoutData.shippingAddress.postalCode}
              </p>
              <p className="break-words">
                {checkoutData.shippingAddress.country}
              </p>
              <p className="break-words">
                {checkoutData.shippingAddress.phone}
              </p>
            </div>
          ) : (
            <p className="text-red-500 text-xs sm:text-sm">
              Nu a fost furnizată o adresă de livrare
            </p>
          )}
        </div>

        {/* Shipping Method */}
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              Shipping Method
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary text-xs sm:text-sm"
              onClick={() => onEditStep("shipping-method")}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Editează
            </Button>
          </div>

          {checkoutData.shippingMethod ? (
            <div className="text-xs sm:text-sm">
              <p className="font-medium break-words">
                {checkoutData.shippingMethod.name}
              </p>
              <p className="break-words">
                {checkoutData.shippingMethod.description}
              </p>
              <p className="break-words">
                Estimated delivery:{" "}
                {checkoutData.shippingMethod.estimatedDelivery}
              </p>
              <p className="font-medium">
                {formatPrice(checkoutData.shippingMethod.price)}
              </p>
            </div>
          ) : (
            <p className="text-red-500 text-xs sm:text-sm">
              Nu a fost selectată o metodă de livrare
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">Payment Method</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary text-xs sm:text-sm"
              onClick={() => onEditStep("payment")}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Editează
            </Button>
          </div>

          {checkoutData.paymentDetails ? (
            <div className="text-xs sm:text-sm">
              <p className="break-words">
                Credit Card:{" "}
                {formatCreditCard(checkoutData.paymentDetails.cardNumber)}
              </p>
              <p className="break-words">
                Name on card: {checkoutData.paymentDetails.cardholderName}
              </p>
              <p className="break-words">
                Expires: {checkoutData.paymentDetails.expiryDate}
              </p>
            </div>
          ) : (
            <p className="text-red-500 text-xs sm:text-sm">
              Nu au fost furnizate detalii de plată
            </p>
          )}
        </div>

        {/* Billing Address */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              Billing Address
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary text-xs sm:text-sm"
              onClick={() => onEditStep("payment")}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Editează
            </Button>
          </div>

          {checkoutData.billingAddressSameAsShipping ? (
            <p className="text-xs sm:text-sm">Aceeași cu adresa de livrare</p>
          ) : checkoutData.billingAddress ? (
            <div className="text-xs sm:text-sm">
              <p className="break-words">
                {checkoutData.billingAddress.fullName}
              </p>
              <p className="break-words">
                {checkoutData.billingAddress.addressLine1}
              </p>
              {checkoutData.billingAddress.addressLine2 && (
                <p className="break-words">
                  {checkoutData.billingAddress.addressLine2}
                </p>
              )}
              <p className="break-words">
                {checkoutData.billingAddress.city},{" "}
                {checkoutData.billingAddress.state}{" "}
                {checkoutData.billingAddress.postalCode}
              </p>
              <p className="break-words">
                {checkoutData.billingAddress.country}
              </p>
              <p className="break-words">{checkoutData.billingAddress.phone}</p>
            </div>
          ) : (
            <p className="text-red-500 text-xs sm:text-sm">
              Nu a fost furnizată o adresă de facturare
            </p>
          )}
        </div>
      </div>

      {/* Order Summary - Using the CheckoutSummary component */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          Order Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between text-sm sm:text-base">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {/* **DISCOUNT LINE** */}
          {discountAmount > 0 && appliedCoupon && (
            <div className="flex justify-between text-green-600 text-sm sm:text-base">
              <span className="font-medium truncate">
                Discount ({appliedCoupon.code})
              </span>
              <span className="font-medium flex-shrink-0">
                -{formatPrice(discountAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm sm:text-base">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>

          <div className="flex justify-between text-sm sm:text-base">
            <span>Shipping</span>
            <span>{formatPrice(shippingCost)}</span>
          </div>

          <div className="border-t pt-3 flex justify-between font-semibold text-base sm:text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {/* **SAVINGS HIGHLIGHT** */}
          {discountAmount > 0 && (
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm text-green-600 font-medium">
                🎉 You saved {formatPrice(discountAmount)}!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {orderError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Eroare la plasarea comenzii
            </h3>
            <p className="text-sm text-red-700 mt-1">{orderError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessingOrder}
          className="text-sm sm:text-base"
        >
          Back to Payment
        </Button>
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base"
          onClick={onPlaceOrder}
          disabled={isProcessingOrder}
        >
          {isProcessingOrder ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}
