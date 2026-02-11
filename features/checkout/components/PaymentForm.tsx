"use client";

import { Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import {
  getCodThreshold,
  getRecipientType,
} from "@/lib/shipping/cod-thresholds";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";

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
import { fetchCODSettings } from "../lib/checkoutApi";

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
  /** Whether current user has admin role. */
  isAdmin?: boolean;
  onSubmit: (data: {
    paymentMethod: PaymentMethod;
    paymentDetails?: PaymentDetails;
    billingAddressSameAsShipping: boolean;
    billingAddress?: ShippingAddress;
    stripePaymentIntentId?: string;
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
  isAdmin = false,
  onSubmit,
  onBack,
}: PaymentFormProps) {
  const { getCartTotal, items: cartItems } = useCart();
  const { t } = useTranslation();
  const { settings } = useCheckoutSettings();
  const isCheckoutRestricted = settings?.checkoutAdminOnly === true && !isAdmin;
  const stripeEnabled =
    !isCheckoutRestricted && process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
  const stripeAttemptIdRef = useRef<string | null>(null);

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
  const [calculatedShippingCost, setCalculatedShippingCost] = useState(0);
  const [userLocation, setUserLocation] = useState<string>("");
  const [userLocale, setUserLocale] = useState<string>("");
  const [codConfig, setCodConfig] = useState<{
    percentage: number;
    fixedFee: number;
  } | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<
    string | undefined
  >(undefined);
  const [isCreatingStripeIntent, setIsCreatingStripeIntent] = useState(false);
  const [stripeIntentError, setStripeIntentError] = useState<string | null>(
    null
  );
  const [stripeIntentAmount, setStripeIntentAmount] = useState<number | null>(
    null
  );

  const isNetopia = useMemo(
    () => selectedPaymentMethod.startsWith("netopia_"),
    [selectedPaymentMethod]
  );
  const recipientType = useMemo(() => {
    const billing = useSameAddress ? shippingAddress : currentBillingAddress;
    return getRecipientType([shippingAddress, billing]);
  }, [shippingAddress, currentBillingAddress, useSameAddress]);
  const codThreshold = useMemo(
    () => getCodThreshold(recipientType),
    [recipientType]
  );
  const codTotals = useMemo(() => {
    if (selectedPaymentMethod !== "cash_on_delivery") return null;
    const baseTotal = Math.max(0, totalAmount);
    try {
      const fee = calculateCODFee(baseTotal, codConfig || undefined).fee;
      return {
        baseTotal,
        fee,
        total: Math.round((baseTotal + fee) * 100) / 100,
      };
    } catch (error) {
      console.error("Error calculating COD total:", error);
      return { baseTotal, fee: 0, total: baseTotal };
    }
  }, [selectedPaymentMethod, totalAmount, codConfig]);
  const isCodLimitExceeded =
    selectedPaymentMethod === "cash_on_delivery" &&
    codTotals !== null &&
    codTotals.total > codThreshold;

  useEffect(() => {
    function calculateTotal() {
      setIsCalculatingTotal(true);
      try {
        const subtotal = getCartTotal();
        const hasPhysicalItems = cartItems.some(item => item.isBook !== true);

        const deliveryPrice = settings?.shippingSettings?.deliveryPrice?.active
          ? parseFloat(settings.shippingSettings.deliveryPrice.price || "0") || 0
          : 0;

        const baseShippingPrice =
          shippingMethod?.price !== undefined && shippingMethod.price >= 0
            ? shippingMethod.price
            : deliveryPrice;

        let shippingCost = 0;
        if (hasPhysicalItems) {
          // Check free shipping threshold FIRST - key fix for consistent UX!
          if (checkFreeShipping(subtotal, settings?.shippingSettings)) {
            shippingCost = 0; // Free shipping when threshold is exceeded
          } else {
            shippingCost = baseShippingPrice;
          }
        }

        const taxRate = settings?.taxSettings?.active
          ? parseFloat(settings.taxSettings.rate) / 100
          : 0;
        const includeInPrice = settings?.taxSettings?.includeInPrice !== false;

        const cartTotalIncludingVAT = subtotal;

        // Store shipping cost for COD fee calculation
        setCalculatedShippingCost(shippingCost);

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

    calculateTotal();
  }, [cartItems, discountAmount, getCartTotal, settings, shippingMethod]);

  useEffect(() => {
    let isActive = true;

    const loadCodSettings = async () => {
      try {
        const codSettings = await fetchCODSettings();
        if (!isActive) return;
        setCodConfig({
          percentage: parseFloat(codSettings.percentage || "3") / 100,
          fixedFee: parseFloat(codSettings.fixedFee || "5.00"),
        });
      } catch (error) {
        console.error("Error loading COD settings:", error);
        if (!isActive) return;
        setCodConfig({
          percentage: 0.03,
          fixedFee: 5.0,
        });
      }
    };

    loadCodSettings();

    return () => {
      isActive = false;
    };
  }, []);

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

      const resolvedCountry =
        (useSameAddress ? shippingAddress?.country : currentBillingAddress?.country) ||
        billingAddress?.country ||
        shippingAddress?.country;

      if (resolvedCountry) {
        setUserLocation(resolvedCountry);
      } else if (navigator.language?.startsWith("ro")) {
        setUserLocation("RO");
      }
    } catch (error) {
      console.error("Error detecting user location:", error);
    }
  }, [billingAddress, shippingAddress, currentBillingAddress, useSameAddress]);

  useEffect(() => {
    const clearStripeIntent = () => {
      setStripeClientSecret(null);
      setStripePaymentIntentId(undefined);
      setStripeIntentAmount(null);
    };

    if (!stripeEnabled) {
      clearStripeIntent();
      setStripeIntentError(null);
      setIsCreatingStripeIntent(false);
      return;
    }

    if (selectedPaymentMethod !== "stripe_new") {
      clearStripeIntent();
      setStripeIntentError(null);
      setIsCreatingStripeIntent(false);
      return;
    }

    if (isCalculatingTotal || totalAmount <= 0) {
      return;
    }

    const amountInMinorUnits = Math.round(totalAmount * 100);

    if (
      stripeClientSecret &&
      stripeIntentAmount === amountInMinorUnits &&
      stripePaymentIntentId
    ) {
      return;
    }

    let isActive = true;

    const createIntent = async () => {
      setIsCreatingStripeIntent(true);
      setStripeIntentError(null);
      try {
        const checkoutAttemptId =
          stripeAttemptIdRef.current ||
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}${Math.random().toString(36).slice(2)}`);
        stripeAttemptIdRef.current = checkoutAttemptId;

        const payload: Record<string, unknown> = {
          amount: amountInMinorUnits,
          checkoutAttemptId,
          metadata: {
            checkoutStep: "payment",
            shippingCountry: shippingAddress?.country || "",
          },
        };

        if (stripePaymentIntentId) {
          payload.paymentIntentId = stripePaymentIntentId;
        }

        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create payment intent");
        }

        const data = await response.json();
        if (!isActive) {
          return;
        }

        setStripeClientSecret(data.clientSecret);
        setStripePaymentIntentId(data.paymentIntentId);
        setStripeIntentAmount(amountInMinorUnits);
        setStripeIntentError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error("Error creating Stripe payment intent:", error);
        clearStripeIntent();
        setStripeIntentError(
          t(
            "stripeIntentError",
            "Nu am reușit să pregătim plata Stripe. Reîncearcă."
          )
        );
      } finally {
        if (isActive) {
          setIsCreatingStripeIntent(false);
        }
      }
    };

    createIntent();

    return () => {
      isActive = false;
    };
  }, [
    stripeEnabled,
    selectedPaymentMethod,
    isCalculatingTotal,
    totalAmount,
    shippingAddress,
    t,
    stripeClientSecret,
    stripeIntentAmount,
    stripePaymentIntentId,
  ]);

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
    const { stripePaymentIntentId: intentIdFromDetails, ...rest } =
      paymentDetails;
    const resolvedPaymentIntentId =
      intentIdFromDetails || stripePaymentIntentId;

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
          stripePaymentIntentId: resolvedPaymentIntentId,
        });
        return;
      }
    }

    onSubmit({
      paymentMethod: selectedPaymentMethod,
      paymentDetails: rest,
      billingAddressSameAsShipping: useSameAddress,
      billingAddress: useSameAddress ? undefined : currentBillingAddress,
      stripePaymentIntentId: resolvedPaymentIntentId,
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
    if (value !== "stripe_new") {
      setStripeClientSecret(null);
      setStripePaymentIntentId(undefined);
      setStripeIntentAmount(null);
      setStripeIntentError(null);
    }
  };

  const handleContinue = () => {
    if (isCodLimitExceeded) {
      setPaymentError(
        t(
          "codLimitExceeded",
          "Plata ramburs este disponibilă până la {threshold} RON pentru {recipientType}. Redu valoarea coșului sau alege altă metodă de plată.",
          {
            threshold: codThreshold.toFixed(2),
            recipientType:
              recipientType === "B2B"
                ? t("recipientCompany", "companie")
                : t("recipientIndividual", "persoană fizică"),
          }
        )
      );
      return;
    }
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
        stripePaymentIntentId: undefined,
      });
      return;
    }

    if (selectedPaymentMethod === "cash_on_delivery") {
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
        stripePaymentIntentId: undefined,
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
          stripePaymentIntentId: undefined,
        });
        return;
      }
    }

    if (selectedPaymentMethod === "stripe_new") {
      if (isCreatingStripeIntent || !stripeClientSecret) {
        setPaymentError(
          t(
            "stripeStillLoading",
            "Așteaptă câteva secunde până pregătim plata Stripe."
          )
        );
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
          billingCountry={
            (useSameAddress
              ? shippingAddress?.country
              : currentBillingAddress?.country) || billingAddress?.country
          }
          shippingCountry={shippingAddress?.country}
          isAdmin={isAdmin}
          checkoutAdminOnly={settings?.checkoutAdminOnly === true}
        />

        <PaymentSummary
          appliedCoupon={appliedCoupon}
          discountAmount={discountAmount}
          useNewCard={useNewCard}
          selectedPaymentMethod={selectedPaymentMethod}
          isCalculatingTotal={isCalculatingTotal}
          totalAmount={totalAmount}
          getCartTotal={getCartTotal}
          shippingCost={calculatedShippingCost}
          codConfig={codConfig}
        />

        {selectedPaymentMethod === "cash_on_delivery" && isCodLimitExceeded && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t(
              "codLimitExceededInline",
              "Plata ramburs depășește limita de {threshold} RON pentru {recipientType}. Alege altă metodă de plată sau ajustează coșul.",
              {
                threshold: codThreshold.toFixed(2),
                recipientType:
                  recipientType === "B2B"
                    ? t("recipientCompany", "companie")
                    : t("recipientIndividual", "persoană fizică"),
              }
            )}
          </div>
        )}

        {stripeEnabled && selectedPaymentMethod === "stripe_new" && (
          <div className="my-6 space-y-4">
            {stripeIntentError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-center justify-between gap-3">
                <p className="text-sm">{stripeIntentError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStripeClientSecret(null);
                    setStripePaymentIntentId(undefined);
                    setStripeIntentAmount(null);
                    setStripeIntentError(null);
                  }}
                >
                  {t("retry", "Reîncearcă")}
                </Button>
              </div>
            )}

            {isCreatingStripeIntent && !stripeClientSecret && (
              <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground border rounded-md py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("initializingStripe", "Pregătim plata securizată Stripe...")}
              </div>
            )}

            {stripeClientSecret && (
              <StripeProvider
                options={{
                  clientSecret: stripeClientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <StripePaymentForm
                  clientSecret={stripeClientSecret}
                  paymentIntentId={stripePaymentIntentId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  billingDetails={getBillingDetails()}
                  amount={
                    isCalculatingTotal
                      ? getCartTotal() * 100
                      : totalAmount * 100
                  }
                  isCalculatingTotal={isCalculatingTotal}
                />
              </StripeProvider>
            )}
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
            disabled={
              !selectedPaymentMethod ||
              isCodLimitExceeded ||
              isCheckoutRestricted
            }
          >
            {t("continueToReview", "Continuă la verificare")}
          </Button>
        </div>
      </div>
    </div>
  );
}
