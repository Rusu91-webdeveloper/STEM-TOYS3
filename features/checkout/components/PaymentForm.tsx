"use client";

import { CircleAlert, Loader2, ShieldCheck } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { checkoutCardClass } from "@/features/checkout/lib/checkoutTheme";
import { COD_CONSENT_VERSION } from "@/lib/checkout/cod-consent";
import { useTranslation } from "@/lib/i18n";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import {
  getCodThreshold,
  getRecipientType,
} from "@/lib/shipping/cod-thresholds";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";

import { useCheckoutSettings } from "../hooks/useCheckoutSettings";
import { fetchCODSettings, fetchCodGuaranteePolicy } from "../lib/checkoutApi";
import {
  PaymentDetails,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
} from "../types";

import { BillingAddressForm } from "./BillingAddressForm";
import { CodRambursConsentPanel } from "./cod-panels/CodRambursConsentPanel";
import { CodRambursGuaranteePanel } from "./cod-panels/CodRambursGuaranteePanel";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PaymentSummary } from "./PaymentSummary";
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
  initialPaymentMethod?: PaymentMethod;
  initialCodConsentAccepted?: boolean;
  initialCodGuaranteePaymentIntentId?: string;
  initialCodGuaranteeAmount?: number;
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
    codConsentAccepted?: boolean;
    codConsentAcceptedAt?: string;
    codConsentVersion?: string;
    codConsentText?: string;
    codGuaranteePaymentIntentId?: string;
    codGuaranteeAmount?: number;
  }) => void;
  onBack: () => void;
}

export function PaymentForm({
  initialData: _initialData,
  initialPaymentMethod,
  initialCodConsentAccepted = false,
  initialCodGuaranteePaymentIntentId,
  initialCodGuaranteeAmount,
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
  const codGuaranteeAttemptIdRef = useRef<string | null>(null);

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
  const [baseShippingForGuarantee, setBaseShippingForGuarantee] = useState(0);
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
  const [codGuaranteeClientSecret, setCodGuaranteeClientSecret] = useState<
    string | null
  >(null);
  const [codGuaranteePaymentIntentId, setCodGuaranteePaymentIntentId] =
    useState<string | undefined>(initialCodGuaranteePaymentIntentId);
  const [isCreatingCodGuaranteeIntent, setIsCreatingCodGuaranteeIntent] =
    useState(false);
  const [codGuaranteeIntentError, setCodGuaranteeIntentError] = useState<
    string | null
  >(null);
  const [codGuaranteeIntentAmount, setCodGuaranteeIntentAmount] = useState<
    number | null
  >(
    initialCodGuaranteeAmount
      ? Math.round(initialCodGuaranteeAmount * 100)
      : null
  );
  const [codGuaranteeAuthorized, setCodGuaranteeAuthorized] = useState(
    Boolean(initialCodGuaranteePaymentIntentId && initialCodGuaranteeAmount)
  );
  const [codConsentAccepted, setCodConsentAccepted] = useState(
    initialCodConsentAccepted
  );
  const [codGuaranteeRequired, setCodGuaranteeRequired] = useState(true);
  const [isResolvingCodGuaranteePolicy, setIsResolvingCodGuaranteePolicy] =
    useState(false);

  const buildCheckoutIntentContext = useCallback(
    (paymentMethod: string) => ({
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        isBook: item.isBook,
        selectedLanguage: item.selectedLanguage,
      })),
      shippingMethodId: shippingMethod?.id,
      couponCode: appliedCoupon?.code || null,
      paymentMethod,
    }),
    [appliedCoupon?.code, cartItems, shippingMethod?.id]
  );

  const isNetopia = useMemo(
    () => selectedPaymentMethod.startsWith("netopia_"),
    [selectedPaymentMethod]
  );
  const isLockerShippingMethod = useMemo(() => {
    if (!shippingMethod) return false;
    if (shippingMethod.requiresLocker) return true;
    if (shippingMethod.methodType === "easybox") return true;
    const methodId = (shippingMethod.id || "").toLowerCase();
    return methodId.includes("fanbox") || methodId.includes("easybox");
  }, [shippingMethod]);
  const recipientType = useMemo(() => {
    const billing = useSameAddress ? shippingAddress : currentBillingAddress;
    return getRecipientType([
      shippingAddress as Record<string, unknown> | undefined,
      billing as Record<string, unknown> | undefined,
    ]);
  }, [shippingAddress, currentBillingAddress, useSameAddress]);
  const codThreshold = useMemo(
    () => getCodThreshold(recipientType),
    [recipientType]
  );
  const codTotals = useMemo(() => {
    if (selectedPaymentMethod !== "cash_on_delivery") return null;
    const baseTotal = Math.max(0, totalAmount);
    try {
      const config = codConfig
        ? {
            percentage: codConfig.percentage,
            fixedFee: isLockerShippingMethod ? 0 : codConfig.fixedFee,
          }
        : isLockerShippingMethod
          ? { fixedFee: 0 }
          : undefined;
      const fee = calculateCODFee(baseTotal, config).fee;
      return {
        baseTotal,
        fee,
        total: Math.round((baseTotal + fee) * 100) / 100,
      };
    } catch (error) {
      console.error("Error calculating COD total:", error);
      return { baseTotal, fee: 0, total: baseTotal };
    }
  }, [selectedPaymentMethod, totalAmount, codConfig, isLockerShippingMethod]);
  const isCodLimitExceeded =
    selectedPaymentMethod === "cash_on_delivery" && totalAmount > codThreshold;
  const codGuaranteeAmount = useMemo(() => {
    if (selectedPaymentMethod !== "cash_on_delivery") {
      return 0;
    }
    const shippingBase = Math.max(
      0,
      calculatedShippingCost,
      baseShippingForGuarantee
    );
    return Math.round(shippingBase * 2 * 100) / 100;
  }, [selectedPaymentMethod, calculatedShippingCost, baseShippingForGuarantee]);
  const codOrderTotalForPolicy = useMemo(() => {
    if (selectedPaymentMethod !== "cash_on_delivery") return 0;
    if (codTotals) return Math.max(0, codTotals.total);
    return Math.max(0, totalAmount);
  }, [selectedPaymentMethod, codTotals, totalAmount]);

  useEffect(() => {
    let isActive = true;

    const resolveCodGuaranteePolicy = async () => {
      if (selectedPaymentMethod !== "cash_on_delivery") {
        setCodGuaranteeRequired(false);
        setIsResolvingCodGuaranteePolicy(false);
        return;
      }

      if (isLockerShippingMethod) {
        setCodGuaranteeRequired(false);
        setIsResolvingCodGuaranteePolicy(false);
        return;
      }

      if (isCalculatingTotal || codOrderTotalForPolicy <= 0) {
        setIsResolvingCodGuaranteePolicy(true);
        return;
      }

      setIsResolvingCodGuaranteePolicy(true);

      try {
        const policy = await fetchCodGuaranteePolicy({
          orderTotal: codOrderTotalForPolicy,
          recipientType,
          shippingMethodId: shippingMethod?.id,
        });

        if (!isActive) return;

        // Fail-safe: if policy cannot be resolved, keep guarantee required.
        setCodGuaranteeRequired(policy?.required ?? true);
      } catch (error) {
        if (!isActive) return;
        console.error("Error resolving COD guarantee policy:", error);
        setCodGuaranteeRequired(true);
      } finally {
        if (isActive) {
          setIsResolvingCodGuaranteePolicy(false);
        }
      }
    };

    resolveCodGuaranteePolicy();

    return () => {
      isActive = false;
    };
  }, [
    selectedPaymentMethod,
    isLockerShippingMethod,
    isCalculatingTotal,
    codOrderTotalForPolicy,
    recipientType,
    shippingMethod?.id,
  ]);

  useEffect(() => {
    function calculateTotal() {
      setIsCalculatingTotal(true);
      try {
        const subtotal = getCartTotal();
        const hasPhysicalItems = cartItems.some(item => item.isBook !== true);

        const deliveryPrice = settings?.shippingSettings?.deliveryPrice?.active
          ? parseFloat(settings.shippingSettings.deliveryPrice.price || "0") ||
            0
          : 0;

        const baseShippingPrice =
          shippingMethod?.price !== undefined && shippingMethod.price >= 0
            ? shippingMethod.price
            : deliveryPrice;
        setBaseShippingForGuarantee(baseShippingPrice);

        let shippingCost = 0;
        if (hasPhysicalItems) {
          const isMixedSupplierCart =
            shippingMethod?.isMixedSupplierCart === true;
          const mixedSupplierSurcharge = Math.max(
            0,
            shippingMethod?.mixedSupplierSurcharge || 0
          );
          // Check free shipping threshold FIRST - key fix for consistent UX!
          if (checkFreeShipping(subtotal, settings?.shippingSettings)) {
            shippingCost = isMixedSupplierCart ? mixedSupplierSurcharge : 0;
          } else {
            shippingCost = baseShippingPrice;
          }
        }

        const cartTotalIncludingVAT = subtotal;

        // Store shipping cost for COD fee calculation
        setCalculatedShippingCost(shippingCost);

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
    // Checkout only supports live PSP-backed payment methods.
    // Stored cards in the account area are not chargeable payment tokens.
    setSavedCards([]);
    setIsLoadingCards(false);
  }, [stripeEnabled]);

  useEffect(() => {
    try {
      setUserLocale(navigator.language);

      const resolvedCountry =
        (useSameAddress
          ? shippingAddress?.country
          : currentBillingAddress?.country) ||
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
      return undefined;
    }

    if (selectedPaymentMethod !== "stripe_new") {
      clearStripeIntent();
      setStripeIntentError(null);
      setIsCreatingStripeIntent(false);
      return undefined;
    }

    if (isCalculatingTotal || totalAmount <= 0) {
      return undefined;
    }

    const amountInMinorUnits = Math.round(totalAmount * 100);

    if (
      stripeClientSecret &&
      stripeIntentAmount === amountInMinorUnits &&
      stripePaymentIntentId
    ) {
      return undefined;
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
          checkoutContext: buildCheckoutIntentContext("stripe_new"),
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
        setStripeIntentAmount(data.amount ?? amountInMinorUnits);
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
    buildCheckoutIntentContext,
  ]);

  useEffect(() => {
    const clearCodGuaranteeIntent = () => {
      setCodGuaranteeClientSecret(null);
      setCodGuaranteePaymentIntentId(undefined);
      setCodGuaranteeIntentAmount(null);
      setCodGuaranteeAuthorized(false);
    };

    if (!stripeEnabled) {
      clearCodGuaranteeIntent();
      setCodGuaranteeIntentError(null);
      setIsCreatingCodGuaranteeIntent(false);
      return undefined;
    }

    if (selectedPaymentMethod !== "cash_on_delivery" || !codGuaranteeRequired) {
      clearCodGuaranteeIntent();
      setCodGuaranteeIntentError(null);
      setIsCreatingCodGuaranteeIntent(false);
      return undefined;
    }

    if (isCalculatingTotal || codGuaranteeAmount <= 0) {
      return undefined;
    }

    const amountInMinorUnits = Math.round(codGuaranteeAmount * 100);

    if (
      codGuaranteeAuthorized &&
      codGuaranteePaymentIntentId &&
      codGuaranteeIntentAmount === amountInMinorUnits
    ) {
      return undefined;
    }

    if (
      codGuaranteeClientSecret &&
      codGuaranteeIntentAmount === amountInMinorUnits &&
      codGuaranteePaymentIntentId
    ) {
      return undefined;
    }

    let isActive = true;

    const createCodGuaranteeIntent = async () => {
      setIsCreatingCodGuaranteeIntent(true);
      setCodGuaranteeIntentError(null);
      try {
        const checkoutAttemptId =
          codGuaranteeAttemptIdRef.current ||
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}${Math.random().toString(36).slice(2)}`);
        codGuaranteeAttemptIdRef.current = checkoutAttemptId;

        const payload: Record<string, unknown> = {
          amount: amountInMinorUnits,
          checkoutAttemptId,
          checkoutContext: buildCheckoutIntentContext("cash_on_delivery"),
          metadata: {
            checkoutStep: "payment",
            paymentFlow: "cod_guarantee",
            shippingCountry: shippingAddress?.country || "",
          },
        };

        if (codGuaranteePaymentIntentId) {
          payload.paymentIntentId = codGuaranteePaymentIntentId;
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
          throw new Error(errorData.error || "Failed to create COD guarantee");
        }

        const data = await response.json();
        if (!isActive) {
          return;
        }

        setCodGuaranteeClientSecret(data.clientSecret);
        setCodGuaranteePaymentIntentId(data.paymentIntentId);
        setCodGuaranteeIntentAmount(data.amount ?? amountInMinorUnits);
        setCodGuaranteeAuthorized(false);
        setCodGuaranteeIntentError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error("Error creating COD guarantee intent:", error);
        clearCodGuaranteeIntent();
        setCodGuaranteeIntentError(
          t(
            "codGuaranteeIntentError",
            "Nu am reușit să autorizăm garanția COD. Reîncearcă."
          )
        );
      } finally {
        if (isActive) {
          setIsCreatingCodGuaranteeIntent(false);
        }
      }
    };

    createCodGuaranteeIntent();

    return () => {
      isActive = false;
    };
  }, [
    stripeEnabled,
    selectedPaymentMethod,
    codGuaranteeRequired,
    isCalculatingTotal,
    codGuaranteeAmount,
    shippingAddress,
    t,
    codGuaranteeAuthorized,
    codGuaranteeClientSecret,
    codGuaranteeIntentAmount,
    codGuaranteePaymentIntentId,
    buildCheckoutIntentContext,
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

  const submitCODOrder = (guaranteePaymentIntentId?: string) => {
    const codConsentAcceptedAt = new Date().toISOString();
    const resolvedCodGuaranteeAmount =
      guaranteePaymentIntentId && codGuaranteeIntentAmount
        ? codGuaranteeIntentAmount / 100
        : codGuaranteeAmount;
    onSubmit({
      paymentMethod: "cash_on_delivery",
      billingAddressSameAsShipping: useSameAddress,
      billingAddress: useSameAddress ? undefined : currentBillingAddress,
      stripePaymentIntentId: undefined,
      codConsentAccepted: true,
      codConsentAcceptedAt,
      codConsentVersion: COD_CONSENT_VERSION,
      codConsentText: COD_CONSENT_TEXT,
      codGuaranteePaymentIntentId: guaranteePaymentIntentId,
      codGuaranteeAmount: guaranteePaymentIntentId
        ? resolvedCodGuaranteeAmount
        : undefined,
    });
  };

  const handlePaymentSuccess = (paymentDetails: PaymentDetails) => {
    const { stripePaymentIntentId: intentIdFromDetails, ...rest } =
      paymentDetails;
    const resolvedPaymentIntentId =
      intentIdFromDetails || stripePaymentIntentId;

    onSubmit({
      paymentMethod: selectedPaymentMethod,
      paymentDetails: rest,
      billingAddressSameAsShipping: useSameAddress,
      billingAddress: useSameAddress ? undefined : currentBillingAddress,
      stripePaymentIntentId: resolvedPaymentIntentId,
      codConsentAccepted: undefined,
      codConsentAcceptedAt: undefined,
      codConsentVersion: undefined,
      codConsentText: undefined,
      codGuaranteePaymentIntentId: undefined,
      codGuaranteeAmount: undefined,
    });
  };

  const handleCODGuaranteeSuccess = (paymentDetails: PaymentDetails) => {
    const guaranteeIntentId =
      paymentDetails.stripePaymentIntentId || codGuaranteePaymentIntentId;
    if (!guaranteeIntentId) {
      setPaymentError(
        t(
          "codGuaranteeIntentMissing",
          "Nu am putut confirma autorizarea garanției COD. Reîncearcă."
        )
      );
      return;
    }

    setCodGuaranteePaymentIntentId(guaranteeIntentId);
    setCodGuaranteeAuthorized(true);
    setCodGuaranteeIntentAmount(Math.round(codGuaranteeAmount * 100));
    setCodGuaranteeIntentError(null);
    setPaymentError(null);
    submitCODOrder(guaranteeIntentId);
  };

  const handlePaymentError = (_error: string) => {
    setPaymentError(
      t("paymentError", "A apărut o eroare la procesarea plății.")
    );
  };

  const handleCODGuaranteeError = (_error: string) => {
    const message = t(
      "codGuaranteeAuthFailed",
      "Autorizarea garanției COD a eșuat. Verifică datele cardului și încearcă din nou."
    );
    setCodGuaranteeAuthorized(false);
    setCodGuaranteeIntentError(message);
    setPaymentError(message);
  };

  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value);
    setUseNewCard(value === "stripe_new");
    setPaymentError(null);
    if (value !== "cash_on_delivery") {
      setCodGuaranteeIntentError(null);
    }
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
          `Plata ramburs este disponibilă doar pentru comenzi de până la ${codThreshold.toFixed(2)} RON. Redu valoarea coșului sau alege altă metodă de plată.`
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
        codConsentAccepted: undefined,
        codConsentAcceptedAt: undefined,
        codConsentVersion: undefined,
        codConsentText: undefined,
        codGuaranteePaymentIntentId: undefined,
        codGuaranteeAmount: undefined,
      });
      return;
    }

    if (selectedPaymentMethod === "cash_on_delivery") {
      if (isLockerShippingMethod) {
        setPaymentError(
          t(
            "codUnavailableLocker",
            "Pentru livrarea la FANbox, plata ramburs nu este disponibilă."
          )
        );
        return;
      }
      if (!stripeEnabled) {
        setPaymentError(
          t(
            "codRequiresStripe",
            "Rambursul este disponibil doar cu autorizare de garanție pe card."
          )
        );
        return;
      }
      if (isResolvingCodGuaranteePolicy) {
        setPaymentError(
          t(
            "codGuaranteePolicyLoading",
            "Verificăm eligibilitatea garanției COD. Încearcă din nou în câteva secunde."
          )
        );
        return;
      }
      if (
        shippingMethod?.isMixedSupplierCart ||
        shippingMethod?.requiresPrepaid
      ) {
        setPaymentError(
          t(
            "mixedSupplierPrepaidOnly",
            "Produsele din această comandă sunt expediate de la furnizori diferiți, iar rambursul nu este disponibil. Finalizează comanda prin plată online cu cardul."
          )
        );
        return;
      }
      if (showBillingForm && !currentBillingAddress) {
        setPaymentError(
          t(
            "billingAddressRequired",
            "Te rugăm să completezi adresa de facturare."
          )
        );
        return;
      }
      if (!codConsentAccepted) {
        setPaymentError(
          t(
            "codConsentRequired",
            "Pentru plata ramburs trebuie să accepți condițiile privind costurile de livrare și retur."
          )
        );
        return;
      }
      if (!codGuaranteeRequired) {
        submitCODOrder(undefined);
        return;
      }

      if (codGuaranteeAmount <= 0) {
        setPaymentError(
          t(
            "codGuaranteeAmountInvalid",
            "Nu am putut calcula garanția COD. Reîncearcă după actualizarea adresei de livrare."
          )
        );
        return;
      }
      if (codGuaranteeAuthorized && codGuaranteePaymentIntentId) {
        submitCODOrder(codGuaranteePaymentIntentId);
        return;
      }
      if (isCreatingCodGuaranteeIntent || !codGuaranteeClientSecret) {
        setPaymentError(
          t(
            "codGuaranteeStillLoading",
            "Așteaptă câteva secunde până pregătim autorizarea garanției COD."
          )
        );
        return;
      }

      const codSubmitButton = document.querySelector(
        ".cod-guarantee-submit-button"
      ) as HTMLButtonElement | null;
      if (codSubmitButton) {
        codSubmitButton.click();
        return;
      }

      setPaymentError(
        t(
          "codGuaranteeButtonMissing",
          "Nu am putut porni autorizarea garanției COD. Reîncarcă pagina și încearcă din nou."
        )
      );
      return;
    }

    if (selectedPaymentMethod !== "stripe_new") {
      setPaymentError(
        t(
          "unsupportedCheckoutPaymentMethod",
          "Metoda selectată nu poate fi procesată la checkout. Alege plata cu un card nou."
        )
      );
      return;
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
        t(
          "billingAddressRequired",
          "Te rugăm să completezi adresa de facturare."
        )
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
      <div className={`${checkoutCardClass} p-3.5 sm:p-6`}>
        <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:mb-5 sm:gap-2.5 sm:pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 sm:px-2.5 sm:text-[11px]">
              {t("paymentStepLabel", "Pasul 3 din 4")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 sm:px-2.5 sm:text-[11px]">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {t("securePaymentLabel", "Plată securizată")}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">
              {t("paymentOptionsTitle", "Opțiuni de plată")}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:mt-1.5 sm:text-sm">
              {t(
                "paymentOptionsSubtitle",
                "Selectează metoda de plată preferată."
              )}
            </p>
          </div>
        </div>

        <PaymentMethodSelector
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={handlePaymentMethodChange}
          savedCards={savedCards}
          isLoadingCards={isLoadingCards}
          orderTotal={totalAmount}
          codThreshold={codThreshold}
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
          shippingMethod={shippingMethod}
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
          isLockerCodFlow={isLockerShippingMethod}
        />

        {selectedPaymentMethod === "cash_on_delivery" && isCodLimitExceeded && (
          <div className="my-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <CircleAlert className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-950">
                  {t(
                    "codLimitExceededTitle",
                    "Ramburs indisponibil pentru această valoare"
                  )}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-rose-800">
                  {t(
                    "codLimitExceededInline",
                    `Plata ramburs este disponibilă doar pentru comenzi de până la ${codThreshold.toFixed(2)} RON. Alege altă metodă de plată sau ajustează coșul.`
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        {selectedPaymentMethod === "cash_on_delivery" && (
          <div className="space-y-4">
            <CodRambursConsentPanel
              codConsentAccepted={codConsentAccepted}
              onCodConsentChange={setCodConsentAccepted}
              onAcceptClearError={() => setPaymentError(null)}
            />
            <CodRambursGuaranteePanel
              stripeEnabled={stripeEnabled}
              isResolvingCodGuaranteePolicy={isResolvingCodGuaranteePolicy}
              codGuaranteeRequired={codGuaranteeRequired}
              codGuaranteeAmount={codGuaranteeAmount}
              codGuaranteeAuthorized={codGuaranteeAuthorized}
              codGuaranteePaymentIntentId={codGuaranteePaymentIntentId}
              codGuaranteeIntentError={codGuaranteeIntentError}
              isCreatingCodGuaranteeIntent={isCreatingCodGuaranteeIntent}
              codGuaranteeClientSecret={codGuaranteeClientSecret}
              codGuaranteeIntentAmount={codGuaranteeIntentAmount}
              isCalculatingTotal={isCalculatingTotal}
              getBillingDetails={getBillingDetails}
              onCODGuaranteeSuccess={handleCODGuaranteeSuccess}
              onCODGuaranteeError={handleCODGuaranteeError}
            />
          </div>
        )}

        {stripeEnabled && selectedPaymentMethod === "stripe_new" && (
          <div className="my-6 space-y-4">
            {stripeIntentError && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-rose-950">
                      {t(
                        "stripeLoadErrorTitle",
                        "Nu am putut pregăti plata cu cardul"
                      )}
                    </p>
                    <p className="mt-1 text-sm text-rose-700">
                      {stripeIntentError}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-rose-200 bg-white text-rose-700 hover:bg-rose-50 sm:w-auto"
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
                </div>
              </div>
            )}

            {isCreatingStripeIntent && !stripeClientSecret && (
              <div className="rounded-3xl border border-violet-200 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {t(
                        "initializingStripeTitle",
                        "Pregătim plata securizată"
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {t(
                        "initializingStripe",
                        "Pregătim plata securizată Stripe..."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stripeClientSecret && (
              <div className="rounded-3xl border border-violet-200 bg-white/95 p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {t("cardDetailsTitle", "Detalii card")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t(
                      "cardDetailsHint",
                      "Completează datele cardului pentru a continua la verificarea finală."
                    )}
                  </p>
                </div>
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
                      stripeIntentAmount ??
                      (isCalculatingTotal
                        ? getCartTotal() * 100
                        : totalAmount * 100)
                    }
                    isCalculatingTotal={isCalculatingTotal}
                  />
                </StripeProvider>
              </div>
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
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-sm">
            {paymentError}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {t("paymentNextStepTitle", "Urmează verificarea finală")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t(
                  "paymentNextStepBody",
                  "Revizuiești comanda, adresele și metoda de plată înainte de plasare."
                )}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full border-slate-300 bg-white text-sm text-slate-900 hover:bg-slate-50 sm:w-auto sm:text-base"
              >
                {t("backToShippingMethod", "Înapoi la metoda de livrare")}
              </Button>
              <Button
                onClick={handleContinue}
                className="w-full bg-primary text-sm text-primary-foreground hover:bg-primary/90 sm:w-auto sm:min-w-[220px] sm:text-base"
                disabled={
                  !selectedPaymentMethod ||
                  isCodLimitExceeded ||
                  (selectedPaymentMethod === "cash_on_delivery" &&
                    isResolvingCodGuaranteePolicy) ||
                  isCheckoutRestricted
                }
              >
                {t("continueToReview", "Continuă la verificare")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
