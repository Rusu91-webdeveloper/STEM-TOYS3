/**
 * API functions for interacting with the checkout backend
 */

import { CheckoutError, ERROR_CODES } from "./errorHandling";

type CheckoutOrderApiError = {
  success?: boolean;
  message?: string;
  error?: string;
  details?: {
    productName?: string;
    requested?: number;
    available?: number;
  };
};

/**
 * Create a payment intent
 */
export async function createPaymentIntent(
  amount: number,
  metadata?: Record<string, string>,
  paymentIntentId?: string
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  try {
    // Fetch CSRF token before making the request
    const csrfToken = await fetchCsrfToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add CSRF token to headers if available
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        paymentIntentId,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create payment intent: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return null;
  }
}

/**
 * Fetch CSRF token from the API
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
}

/**
 * Create an order
 */
export async function createOrder(orderData: any) {
  try {
    // Fetch CSRF token before making the request
    const csrfToken = await fetchCsrfToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add CSRF token to headers if available
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await fetch("/api/checkout/order", {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData: CheckoutOrderApiError = await response
        .json()
        .catch(() => ({}));

      if (errorData.error === "INSUFFICIENT_STOCK") {
        const productName = errorData.details?.productName || "a product";
        const requested = errorData.details?.requested;
        const available = errorData.details?.available;

        const stockMessage =
          typeof requested === "number" && typeof available === "number"
            ? `Stoc actualizat: "${productName}" are disponibil ${available} buc. (ai cerut ${requested}). Te rugăm să actualizezi coșul și să încerci din nou.`
            : `Stoc actualizat: "${productName}" nu mai este disponibil în cantitatea cerută. Te rugăm să actualizezi coșul și să încerci din nou.`;

        throw new CheckoutError(
          ERROR_CODES.INVENTORY_ERROR,
          stockMessage,
          false,
          "cart"
        );
      }

      if (errorData.error === "MIXED_SUPPLIER_PREPAID_REQUIRED") {
        throw new CheckoutError(
          "MIXED_SUPPLIER_PREPAID_REQUIRED",
          errorData.message ||
            "Comenzile cu produse din furnizori diferiți pot fi plătite doar online.",
          false,
          "payment"
        );
      }

      throw new CheckoutError(
        "CHECKOUT_ORDER_FAILED",
        errorData.message || `Error: ${response.status} - ${response.statusText}`,
        true,
        "retry"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Fetch shipping settings from the database
 */
export async function fetchShippingSettings() {
  try {
    const response = await fetch("/api/checkout/shipping-settings");
    if (!response.ok) {
      throw new Error(
        `Error fetching shipping settings: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch shipping settings:", error);
    // Return default settings if fetch fails
    return {
      deliveryPrice: { price: "15.00", active: true },
      freeThreshold: { price: "199.00", active: true },
    };
  }
}

export async function fetchShippingQuotes() {
  try {
    const response = await fetch("/api/checkout/shipping-quote");
    if (!response.ok) {
      throw new Error(`Error fetching shipping quotes: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch shipping quotes:", error);
    return null;
  }
}

export interface FanboxPickupPoint {
  id: string;
  name: string;
  county: string;
  locality: string;
  address: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export async function fetchFanboxPickupPoints(input: {
  state?: string;
  city?: string;
  postalCode?: string;
  search?: string;
}): Promise<{
  configured: boolean;
  points: FanboxPickupPoint[];
  total: number;
  filteredTotal?: number;
  fallbackUsed?: boolean;
  reason?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (input.state) params.set("state", input.state);
    if (input.city) params.set("city", input.city);
    if (input.postalCode) params.set("postalCode", input.postalCode);
    if (input.search) params.set("search", input.search);

    const response = await fetch(
      `/api/checkout/fancourier/fanbox?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching FANbox points: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      configured: data.configured !== false,
      points: Array.isArray(data.points) ? data.points : [],
      total: Number(data.total || 0),
      filteredTotal:
        typeof data.filteredTotal === "number" ? data.filteredTotal : undefined,
      fallbackUsed: data.fallbackUsed === true,
      reason: data.reason,
    };
  } catch (error) {
    console.error("Failed to fetch FANbox pickup points:", error);
    return {
      configured: false,
      points: [],
      total: 0,
      reason: "FETCH_FAILED",
    };
  }
}

export async function fetchTaxSettings() {
  try {
    const response = await fetch("/api/checkout/tax-settings");
    if (!response.ok) {
      throw new Error(`Error fetching tax settings: ${response.statusText}`);
    }
    return await response.json().then(data => data.taxSettings);
  } catch (error) {
    console.error("Failed to fetch tax settings:", error);
    // Safe fallback for non-VAT mode: keep final prices without tax breakdown.
    return {
      rate: "0",
      active: false,
      includeInPrice: true,
    };
  }
}

/**
 * Fetch COD settings from the database
 */
export async function fetchCODSettings() {
  try {
    const response = await fetch("/api/checkout/cod-settings");
    if (!response.ok) {
      throw new Error(`Error fetching COD settings: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch COD settings:", error);
    // Return default settings if fetch fails
    return {
      percentage: "3",
      fixedFee: "5.00",
      active: true,
    };
  }
}
