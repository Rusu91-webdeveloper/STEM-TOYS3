"use client";

import { Loader2, CreditCard } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";

import { fetchShippingSettings, fetchTaxSettings } from "../lib/checkoutApi";
import { PaymentDetails, ShippingAddress, ShippingMethod } from "../types";

import { ShippingAddressForm } from "./ShippingAddressForm";
import { StripePaymentForm } from "./StripePaymentForm";
import { StripeProvider } from "./StripeProvider";

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

  // Calculate the total amount including tax and shipping
  useEffect(() => {
    async function calculateTotal() {
      setIsCalculatingTotal(true);
      try {
        const subtotal = getCartTotal();
        let shippingCost = shippingMethod?.price || 0;

        // Get tax settings
        const taxSettings = await fetchTaxSettings();
        const taxRate = taxSettings.active
          ? parseFloat(taxSettings.rate) / 100
          : 0;

        // Get shipping settings for free shipping threshold
        const shippingSettings = await fetchShippingSettings();
        if (shippingSettings.freeThreshold?.active) {
          const freeShippingThreshold = parseFloat(
            shippingSettings.freeThreshold.price
          );
          if (subtotal >= freeShippingThreshold) {
            shippingCost = 0;
          }
        }

        const tax = subtotal * taxRate;
        const totalBeforeDiscount = subtotal + tax + shippingCost;
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

    calculateTotal();
  }, [getCartTotal, shippingMethod, discountAmount]);

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

  // Get card logo or icon based on card type
  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return (
          <div className="bg-blue-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            VISA
          </div>
        );
      case "mastercard":
        return (
          <div className="bg-red-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            MC
          </div>
        );
      case "amex":
        return (
          <div className="bg-blue-700 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            AMEX
          </div>
        );
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          {t("paymentMethod", "Metodă de plată")}
        </h2>

        {isLoadingCards ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : savedCards.length > 0 ? (
          <div className="mb-6">
            <Label className="text-base font-medium mb-3 block">
              {t("selectPaymentMethod", "Selectează metoda de plată")}
            </Label>
            <RadioGroup
              value={selectedPaymentMethod}
              onValueChange={handlePaymentMethodChange}
              className="space-y-3"
            >
              {savedCards.map(card => (
                <div
                  key={card.id}
                  className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50"
                >
                  <RadioGroupItem
                    value={card.id}
                    id={`card-${card.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Label
                        htmlFor={`card-${card.id}`}
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {getCardIcon(card.cardType)}
                        •••• {card.lastFourDigits}
                        <span className="text-sm text-gray-500 ml-2">
                          {t("expires", "Expires")} {card.expiryMonth}/
                          {card.expiryYear}
                        </span>
                        {card.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                            {t("default", "Default")}
                          </span>
                        )}
                      </Label>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {card.cardholderName}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
                <RadioGroupItem value="new" id="payment-new" className="mt-1" />
                <Label
                  htmlFor="payment-new"
                  className="font-medium cursor-pointer"
                >
                  {t("useNewCard", "Folosește un card nou")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : null}

        {/* Billing Address Checkbox */}
        <div className="flex items-center space-x-2 mt-6 mb-4">
          <Checkbox
            id="billing-same"
            checked={useSameAddress}
            onCheckedChange={handleCheckboxChange}
          />
          <Label
            htmlFor="billing-same"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("sameAsShipping", "Aceeași ca adresa de livrare")}
          </Label>
        </div>

        {/* Discount Information Display */}
        {appliedCoupon && discountAmount > 0 && (
          <div className="my-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-medium">
                  🎉 Discount Applied:
                </span>
                <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded text-green-800">
                  {appliedCoupon.code}
                </span>
              </div>
              <span className="text-green-600 font-bold">
                -{discountAmount.toFixed(2)} LEI
              </span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              You&apos;re saving {discountAmount.toFixed(2)} LEI on this order!
            </p>
          </div>
        )}

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

        {/* Billing Address Form */}
        {showBillingForm && (
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                {t("billingAddress", "Adresa de facturare")}
              </h3>
            </div>
            <ShippingAddressForm
              initialData={currentBillingAddress}
              onSubmit={address => {
                setCurrentBillingAddress(address);
              }}
            />
          </div>
        )}

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
