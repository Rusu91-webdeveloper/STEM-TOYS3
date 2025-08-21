"use client";

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";

import { PaymentDetails, ShippingAddress, ShippingMethod } from "../types";

import { BillingAddressForm } from "./BillingAddressForm";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PaymentSummary } from "./PaymentSummary";
import { StripePaymentForm } from "./StripePaymentForm";
import { StripeProvider } from "./StripeProvider";
import { useCheckoutSettings } from "../hooks/useCheckoutSettings";

interface PaymentCard {
  id: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  billingAddressId?: string;
}

interface PaymentFormProps {
  initialData?: PaymentDetails;
  billingAddressSameAsShipping?: boolean;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod?: ShippingMethod;
  appliedCoupon?: any;
  discountAmount?: number;
  onSubmit: (data: {
    paymentDetails: PaymentDetails;
    billingAddressSameAsShipping: boolean;
    billingAddress?: ShippingAddress;
  }) => void;
  onBack: () => void;
}

export function PaymentForm({
  initialData,
  billingAddressSameAsShipping = true,
  shippingAddress,
  billingAddress,
  shippingMethod,
  appliedCoupon,
  discountAmount = 0,
  onSubmit,
  onBack,
}: PaymentFormProps) {
  const { getCartTotal } = useCart();
  const { t } = useTranslation();
  const [useSameAddress, setUseSameAddress] = useState(
    billingAddressSameAsShipping
  );
  const [currentBillingAddress, setCurrentBillingAddress] = useState(
    billingAddress || shippingAddress
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("new");
  const [useNewCard, setUseNewCard] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isCalculatingTotal, setIsCalculatingTotal] = useState(true);
  const { settings } = useCheckoutSettings();

  // Calculate the total amount including tax and shipping
  useEffect(() => {
    function calculateTotal() {
      setIsCalculatingTotal(true);
      try {
        const subtotal = getCartTotal();
        let shippingCost = shippingMethod?.price || 0;

        // Get tax settings from unified settings
        const taxRate = settings?.taxSettings?.active
          ? parseFloat(settings.taxSettings.rate) / 100
          : 0;
        const includeInPrice = settings?.taxSettings?.includeInPrice !== false;

        // Get shipping settings for free shipping threshold (only for standard shipping)
        const cartTotalIncludingVAT = subtotal; // Cart total already includes VAT

        if (
          settings?.shippingSettings?.freeThreshold?.active &&
          shippingMethod?.id === "standard"
        ) {
          const freeShippingThreshold = parseFloat(
            settings.shippingSettings.freeThreshold.price
          );
          if (cartTotalIncludingVAT >= freeShippingThreshold) {
            shippingCost = 0;
          }
        }

        // For VAT-inclusive pricing, calculate VAT backwards for display
        const subtotalExcludingVAT = includeInPrice
          ? cartTotalIncludingVAT / (1 + taxRate)
          : cartTotalIncludingVAT;
        const tax = includeInPrice
          ? cartTotalIncludingVAT - subtotalExcludingVAT
          : cartTotalIncludingVAT * taxRate;

        const totalBeforeDiscount = cartTotalIncludingVAT + shippingCost;
        const total = Math.max(0, totalBeforeDiscount - discountAmount);
        setTotalAmount(total);
      } catch (error) {
        console.error("Error calculating total:", error);
        // Fall back to subtotal if calculation fails
        setTotalAmount(getCartTotal());
      } finally {
        setIsCalculatingTotal(false);
      }
    }

    if (settings) {
      calculateTotal();
    }
  }, [getCartTotal, shippingMethod, discountAmount, settings]);

  // Fetch saved payment cards
  useEffect(() => {
    const fetchPaymentCards = async () => {
      try {
        const response = await fetch("/api/account/payment-cards");
        if (response.ok) {
          const cards = await response.json();
          setSavedCards(cards);

          // If there's a default card, preselect it
          const defaultCard = cards.find((card: PaymentCard) => card.isDefault);
          if (defaultCard && !initialData) {
            setSelectedPaymentMethod(defaultCard.id);
            setUseNewCard(false);
          }
        }
      } catch (error) {
        console.error("Error fetching payment cards:", error);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchPaymentCards();
  }, [initialData]);

  const showBillingForm = !useSameAddress;

  const handleCheckboxChange = (checked: boolean) => {
    setUseSameAddress(checked);
    if (checked) {
      setCurrentBillingAddress(shippingAddress);
    }
  };

  const getBillingDetails = () => {
    const address = useSameAddress ? shippingAddress : currentBillingAddress;
    return {
      name: address?.fullName || "",
      email: "", // We should have this from the user's account
      address: {
        line1: address?.addressLine1 || "",
        line2: address?.addressLine2 || "",
        city: address?.city || "",
        state: address?.state || "",
        postal_code: address?.postalCode || "",
        country: address?.country || "",
      },
    };
  };

  const handlePaymentSuccess = (paymentDetails: PaymentDetails) => {
    // If using a saved card, populate the payment details
    if (!useNewCard && selectedPaymentMethod !== "new") {
      const selectedCard = savedCards.find(
        card => card.id === selectedPaymentMethod
      );
      if (selectedCard) {
        // Create payment details from the selected card
        const savedCardPaymentDetails: PaymentDetails = {
          cardholderName: selectedCard.cardholderName,
          cardNumber: `•••• •••• •••• ${selectedCard.lastFourDigits}`,
          savedCardId: selectedCard.id,
          expiryDate: `${selectedCard.expiryMonth}/${selectedCard.expiryYear}`,
          cardType: selectedCard.cardType,
          // We don't need actual card details for a saved card
        };

        onSubmit({
          paymentDetails: savedCardPaymentDetails,
          billingAddressSameAsShipping: useSameAddress,
          billingAddress: useSameAddress ? undefined : currentBillingAddress,
        });
        return;
      }
    }

    // Otherwise, use the new card details
    onSubmit({
      paymentDetails,
      billingAddressSameAsShipping: useSameAddress,
      billingAddress: useSameAddress ? undefined : currentBillingAddress,
    });
  };

  const handlePaymentError = (_error: string) => {
    setPaymentError(
      t("paymentError", "A apărut o eroare la procesarea plății.")
    );
  };

  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value);
    setUseNewCard(value === "new");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          {t("paymentMethod", "Metodă de plată")}
        </h2>

        <PaymentMethodSelector
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={handlePaymentMethodChange}
          savedCards={savedCards}
          isLoadingCards={isLoadingCards}
        />

        <PaymentSummary
          appliedCoupon={appliedCoupon}
          discountAmount={discountAmount}
          useNewCard={useNewCard}
          selectedPaymentMethod={selectedPaymentMethod}
          isCalculatingTotal={isCalculatingTotal}
          totalAmount={totalAmount}
          getCartTotal={getCartTotal}
        />

        {/* Show the saved card or Stripe form */}
        {!useNewCard && selectedPaymentMethod !== "new" ? (
          <div className="my-6">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-gray-700">
                {t("proceedToReview", "Poți continua la verificarea comenzii.")}
              </p>
            </div>
          </div>
        ) : (
          <StripeProvider>
            <StripePaymentForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              billingDetails={getBillingDetails()}
              amount={
                isCalculatingTotal ? getCartTotal() * 100 : totalAmount * 100
              } // Convert to cents for Stripe
              isCalculatingTotal={isCalculatingTotal}
            />
          </StripeProvider>
        )}

        <BillingAddressForm
          useSameAddress={useSameAddress}
          onUseSameAddressChange={handleCheckboxChange}
          showBillingForm={showBillingForm}
          currentBillingAddress={currentBillingAddress}
          shippingAddress={shippingAddress}
          onBillingAddressChange={address => {
            setCurrentBillingAddress(address);
          }}
        />

        {/* Payment Error */}
        {paymentError && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
            {paymentError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="text-sm sm:text-base"
          >
            {t("backToShippingMethod", "Înapoi la metoda de livrare")}
          </Button>
          <Button
            onClick={() => {
              // If using a saved card, handle submission here
              if (!useNewCard && selectedPaymentMethod !== "new") {
                const selectedCard = savedCards.find(
                  card => card.id === selectedPaymentMethod
                );
                if (selectedCard) {
                  // Create payment details from the selected card
                  const savedCardPaymentDetails: PaymentDetails = {
                    cardholderName: selectedCard.cardholderName,
                    cardNumber: `•••• •••• •••• ${selectedCard.lastFourDigits}`,
                    savedCardId: selectedCard.id,
                    expiryDate: `${selectedCard.expiryMonth}/${selectedCard.expiryYear}`,
                    cardType: selectedCard.cardType,
                    // We don't need actual card details for a saved card
                  };

                  onSubmit({
                    paymentDetails: savedCardPaymentDetails,
                    billingAddressSameAsShipping: useSameAddress,
                    billingAddress: useSameAddress
                      ? undefined
                      : currentBillingAddress,
                  });
                }
              } else if (showBillingForm && !currentBillingAddress) {
                // Scroll to the billing form if it's needed but empty
                // In a real app, you'd want to validate the form first
              } else {
                // Otherwise, trigger the Stripe form submission
                const submitButton = document.querySelector(
                  ".stripe-submit-button"
                ) as HTMLButtonElement;
                if (submitButton) {
                  submitButton.click();
                }
              }
            }}
            className="text-sm sm:text-base"
          >
            {t("continueToReview", "Continuă la verificare")}
          </Button>
        </div>
      </div>
    </div>
  );
}
