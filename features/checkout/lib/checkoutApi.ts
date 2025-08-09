/**
 * API functions for interacting with the checkout backend
 */

/**
 * Create a payment intent
 */
export async function createPaymentIntent(
  amount: number,
  metadata?: Record<string, string>
): Promise<{ clientSecret: string } | null> {
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

    const response = await fetch("/api/checkout/payment-intent", {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create payment intent: ${response.statusText}`
      );
    }

    const data = await response.json();
    return { clientSecret: data.clientSecret };
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error: ${response.status} - ${errorData.message || response.statusText}`
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
      standard: { price: "5.99", active: true },
      express: { price: "12.99", active: true },
      freeThreshold: { price: "250.00", active: true },
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
    // Return default settings if fetch fails
    return {
      rate: "21",
      active: true,
      includeInPrice: false,
    };
  }
}
