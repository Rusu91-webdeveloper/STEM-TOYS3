"use client";

import { Edit } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

import { CheckoutData, CheckoutStep } from "../types";

import { OrderActions } from "./OrderActions";
import { OrderSummarySection } from "./OrderSummarySection";
import { usePricingBreakdown } from "./PricingBreakdown";

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
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  // Get pricing breakdown from the extracted hook
  const pricingData = usePricingBreakdown({
    checkoutData,
    discountAmount,
    appliedCoupon,
  });

  // Format a credit card number for display
  const formatCreditCard = (cardNumber: string) => {
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">
            {t("orderReview", "Order Review")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t(
              "pleaseReviewOrder",
              "Te rugăm să verifici comanda înainte de a o plasa."
            )}
          </p>
        </div>

        {/* Shipping Address */}
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              {t("shippingAddress", "Shipping Address")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary text-xs sm:text-sm"
              onClick={() => onEditStep("shipping-address")}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {t("edit", "Editează")}
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
              {t(
                "noShippingAddress",
                "Nu a fost furnizată o adresă de livrare"
              )}
            </p>
          )}
        </div>

        {/* Shipping Method */}
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              {t("shippingMethod", "Shipping Method")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary text-xs sm:text-sm"
              onClick={() => onEditStep("shipping-method")}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {t("edit", "Editează")}
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
              {t("noShippingMethod", "Nu a fost selectată o metodă de livrare")}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              {t("paymentMethod", "Payment Method")}
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
              {t("noPaymentDetails", "Nu au fost furnizate detalii de plată")}
            </p>
          )}
        </div>

        {/* Billing Address */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <h3 className="font-medium text-sm sm:text-base">
              {t("billingAddress", "Billing Address")}
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
            <p className="text-xs sm:text-sm">
              {t("sameAsShipping", "Aceeași cu adresa de livrare")}
            </p>
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
              {t(
                "noBillingAddress",
                "Nu a fost furnizată o adresă de facturare"
              )}
            </p>
          )}
        </div>
      </div>

      <OrderSummarySection
        subtotal={pricingData.subtotal}
        tax={pricingData.tax}
        shippingCost={pricingData.shippingCost}
        total={pricingData.total}
        discountAmount={pricingData.discountAmount}
        appliedCoupon={pricingData.appliedCoupon}
      />

      <OrderActions
        onBack={onBack}
        onPlaceOrder={onPlaceOrder}
        isProcessingOrder={isProcessingOrder}
        orderError={orderError}
      />
    </div>
  );
}
