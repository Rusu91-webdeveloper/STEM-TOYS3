"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";

import {
  PaymentDetails,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
} from "../types";

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
  initialPaymentMethod?: PaymentMethod;
  billingAddressSameAsShipping?: boolean;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod?: ShippingMethod;
  appliedCoupon?: any;
  discountAmount?: number;
  onSubmit: (data: {
    paymentMethod: PaymentMethod;
    paymentDetails?: PaymentDetails;
    billingAddressSameAsShipping: boolean;
    billingAddress?: ShippingAddress;
  }) => void;
  onBack: () => void;
}

export function PaymentForm({
  initialData,
  initialPaymentMethod,
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
  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

  const [useSameAddress, setUseSameAddress] = useState(
    billingAddressSameAsShipping
  );
  const [currentBillingAddress, setCurrentBillingAddress] = useState<
    ShippingAddress | undefined
  >(billingAddress || shippingAddress);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(initialPaymentMethod || "netopia_card");
  const [useNewCard, setUseNewCard] = useState(
    (initialPaymentMethod || "") === "stripe_new"
  );
  const [totalAmount, setTotalAmount] = useState(0);
  const [isCalculatingTotal, setIsCalculatingTotal] = useState(true);
  const [userLocation, setUserLocation] = useState<string>("");
  const [userLocale, setUserLocale] = useState<string>("");
  const { settings } = useCheckoutSettings();

  const isNetopia = useMemo(
    () => selectedPaymentMethod.startsWith("netopia_"),
    [selectedPaymentMethod]
  );

  useEffect(() => {
    function calculateTotal() {
      setIsCalculatingTotal(true);
      try {
        const subtotal = getCartTotal();
        let shippingCost = shippingMethod?.price || 0;

        const taxRate = settings?.taxSettings?.active
          ? parseFloat(settings.taxSettings.rate) / 100
          : 0;
        const includeInPrice = settings?.taxSettings?.includeInPrice !== false;

        const cartTotalIncludingVAT = subtotal;

        if (
          settings?.shippingSettings?.freeThreshold?.active &&
          shippingMethod?.id === "standard"
        ) {
          const threshold = parseFloat(
            settings.shippingSettings.freeThreshold.price
          );
          if (cartTotalIncludingVAT >= threshold) {
            shippingCost = 0;
          }
        }

        const subtotalExcludingVAT = includeInPrice
          ? cartTotalIncludingVAT / (1 + taxRate)
          : cartTotalIncludingVAT;
        const totalBeforeDiscount =
          cartTotalIncludingVAT + shippingCost - discountAmount;

        setTotalAmount(Math.max(0, totalBeforeDiscount));
      } catch (error) {
        console.error("Error calculating total:", error);
        setTotalAmount(getCartTotal());
      } finally {
        setIsCalculatingTotal(false);
      }
    }

    if (settings) {
      calculateTotal();
    }
  }, [discountAmount, getCartTotal, settings, shippingMethod]);

  useEffect(() => {
    const fetchPaymentCards = async () => {
      try {
        if (!stripeEnabled) {
          return;
        }

        const response = await fetch("/api/account/payment-cards");
        if (response.ok) {
          const cards = (await response.json()) as PaymentCard[];
          setSavedCards(cards);

          if (!initialPaymentMethod) {
            const defaultCard = cards.find(card => card.isDefault);
            if (defaultCard) {
              setSelectedPaymentMethod(defaultCard.id);
              setUseNewCard(false);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching payment cards:", error);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchPaymentCards();
  }, [initialPaymentMethod, stripeEnabled]);

  useEffect(() => {
    try {
      setUserLocale(navigator.language);

      if (billingAddress?.country) {
        setUserLocation(billingAddress.country);
      } else if (navigator.language?.startsWith("ro")) {
        setUserLocation("RO");
      }
    } catch (error) {
      console.error("Error detecting user location:", error);
    }
  }, [billingAddress]);

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
      email: "",
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
    if (!isNetopia && !useNewCard && selectedPaymentMethod !== "stripe_new") {
      const selectedCard = savedCards.find(
        card => card.id === selectedPaymentMethod
      );
      if (selectedCard) {
        const savedCardPaymentDetails: PaymentDetails = {
          cardholderName: selectedCard.cardholderName,
          cardNumber: `•••• •••• •••• ${selectedCard.lastFourDigits}`,
          savedCardId: selectedCard.id,
          expiryDate: `${selectedCard.expiryMonth}/${selectedCard.expiryYear}`,
          cardType: selectedCard.cardType,
        };

        onSubmit({
          paymentMethod: selectedPaymentMethod,
          paymentDetails: savedCardPaymentDetails,
          billingAddressSameAsShipping: useSameAddress,
          billingAddress: useSameAddress ? undefined : currentBillingAddress,
        });
        return;
      }
    }

    onSubmit({
      paymentMethod: selectedPaymentMethod,
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
    setUseNewCard(value === "stripe_new");
    setPaymentError(null);
  };

  const handleContinue = () => {
    if (isNetopia) {
      if (showBillingForm && !currentBillingAddress) {
        setPaymentError(
          t(
            "billingAddressRequired",
            "Te rugăm să completezi adresa de facturare."
          )
        );
        return;
      }

      onSubmit({
        paymentMethod: selectedPaymentMethod,
        billingAddressSameAsShipping: useSameAddress,
        billingAddress: useSameAddress ? undefined : currentBillingAddress,
      });
      return;
    }

    if (!useNewCard && selectedPaymentMethod !== "stripe_new") {
      const selectedCard = savedCards.find(
        card => card.id === selectedPaymentMethod
      );
      if (selectedCard) {
        const savedCardPaymentDetails: PaymentDetails = {
          cardholderName: selectedCard.cardholderName,
          cardNumber: `•••• •••• •••• ${selectedCard.lastFourDigits}`,
          savedCardId: selectedCard.id,
          expiryDate: `${selectedCard.expiryMonth}/${selectedCard.expiryYear}`,
          cardType: selectedCard.cardType,
        };

        onSubmit({
          paymentMethod: selectedPaymentMethod,
          paymentDetails: savedCardPaymentDetails,
          billingAddressSameAsShipping: useSameAddress,
          billingAddress: useSameAddress ? undefined : currentBillingAddress,
        });
        return;
      }
    }

    if (showBillingForm && !currentBillingAddress) {
      setPaymentError(
        t("billingAddressRequired", "Te rugăm să completezi adresa de facturare.")
      );
      return;
    }

    const submitButton = document.querySelector(
      ".stripe-submit-button"
    ) as HTMLButtonElement | null;
    if (submitButton) {
      submitButton.click();
    }
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
          userLocation={userLocation}
          userLocale={userLocale}
          billingCountry={billingAddress?.country}
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

        {stripeEnabled && selectedPaymentMethod === "stripe_new" && (
          <div className="my-6">
            <StripeProvider>
              <StripePaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                billingDetails={getBillingDetails()}
                amount={
                  isCalculatingTotal ? getCartTotal() * 100 : totalAmount * 100
                }
                isCalculatingTotal={isCalculatingTotal}
              />
            </StripeProvider>
          </div>
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

        {paymentError && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
            {paymentError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="text-sm sm:text-base"
          >
            {t("backToShippingMethod", "Înapoi la metoda de livrare")}
          </Button>
          <Button
            onClick={handleContinue}
            className="text-sm sm:text-base"
            disabled={!selectedPaymentMethod}
          >
            {t("continueToReview", "Continuă la verificare")}
          </Button>
        </div>
      </div>
    </div>
  );
}
