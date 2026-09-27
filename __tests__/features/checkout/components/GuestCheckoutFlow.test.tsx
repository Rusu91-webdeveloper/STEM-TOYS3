import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { CartProvider } from "@/features/cart/context/CartContext";
import { clearCartCache } from "@/features/cart/lib/cartApi";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";

const kit = {
  id: "prod-1",
  productId: "prod-1",
  name: "Kit STEM",
  price: 49.99,
  quantity: 1,
  slug: "kit-stem",
};

function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(data),
  };
}

function renderGuestCheckout() {
  return render(
    <I18nProvider initialLanguage="ro">
      <CurrencyProvider>
        <CartProvider>
          <CheckoutFlow />
        </CartProvider>
      </CurrencyProvider>
    </I18nProvider>
  );
}

describe("guest checkout", () => {
  const originalStripe = process.env.NEXT_PUBLIC_STRIPE_ENABLED;
  const originalNetopia = process.env.NEXT_PUBLIC_NETOPIA_ENABLED;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = "true";
    process.env.NEXT_PUBLIC_NETOPIA_ENABLED = "true";
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = originalStripe;
    process.env.NEXT_PUBLIC_NETOPIA_ENABLED = originalNetopia;
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearCartCache();
    localStorage.setItem(
      "nextcommerce_cart",
      JSON.stringify({
        items: [kit],
        timestamp: Date.now(),
        lastAccess: Date.now(),
        sessionId: "guest-session",
        explicitEmpty: false,
        preferences: {
          persistenceMode: "smart",
          autoExpiry: 24 * 30,
          clearOnCheckout: true,
          clearOnLogout: false,
        },
      })
    );

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const respond = () => {
      if (url.includes("/api/cart")) {
        return jsonResponse({ data: [kit] });
      }
      if (url.includes("/api/account/addresses")) {
        return jsonResponse({ error: "unauthorized" }, false);
      }
      if (url.includes("/api/checkout/settings")) {
        return jsonResponse({
          taxSettings: { active: false, rate: "0", includeInPrice: true },
          shippingSettings: {
            deliveryPrice: { price: "19.99", active: true },
            freeThreshold: { active: false, price: "9999" },
          },
          checkoutAdminOnly: false,
        });
      }
      if (url.includes("/api/checkout/shipping-quote")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        if (!body.items?.some((item: { productId: string }) => item.productId === "prod-1")) {
          return jsonResponse({ isDigitalOnly: true, methods: [] });
        }
        return jsonResponse({
          isDigitalOnly: false,
          cartRules: { isMixedSupplierCart: false, requiresPrepaid: false },
          methods: [
            {
              id: "fancourier:standard",
              name: "FanCourier Standard",
              description: "Livrare la adresa ta",
              estimatedDelivery: "24-48h",
              price: 19.99,
              singleShipmentPrice: 19.99,
              courierId: "fancourier",
              serviceId: "standard",
              methodType: "home",
              requiresLocker: false,
            },
          ],
        });
      }
      if (url.includes("/api/checkout/shipping-settings")) {
        return jsonResponse({
          deliveryPrice: { price: "19.99", active: true },
          freeThreshold: { active: false, price: "9999" },
        });
      }
      if (url.includes("/api/checkout/tax-settings")) {
        return jsonResponse({
          taxSettings: { active: false, rate: "0", includeInPrice: true },
        });
      }
      if (url.includes("/api/checkout/cod-settings")) {
        return jsonResponse({ percentage: "3", fixedFee: "5.00", active: true });
      }
      if (url.includes("/api/checkout/cod-guarantee-policy")) {
        return jsonResponse({
          required: false,
          mode: "off",
          reasons: [],
          thresholds: {},
          userStats: {},
        });
      }
      if (url.includes("/api/checkout/auto-discount")) {
        return jsonResponse({ eligible: false });
      }
      return jsonResponse({});
      };
      return Promise.resolve(respond());
    }) as unknown as typeof fetch;
  });

  it("takes a guest from the cart to review with COD selected and the same totals", async () => {
    const user = userEvent.setup();
    renderGuestCheckout();

    expect(
      screen.queryByText(/please log in to continue with checkout/i)
    ).not.toBeInTheDocument();

    const email = await screen.findByLabelText(/^email$/i);
    await user.type(email, "ana.pop@example.com");
    await user.type(screen.getByLabelText(/nume complet/i), "Ana Pop");
    await user.type(screen.getByLabelText(/^stradă$/i), "Florilor");
    await user.type(screen.getByLabelText(/^număr$/i), "12");
    await user.type(screen.getByLabelText(/^oraș$/i), "Cluj-Napoca");
    await user.type(screen.getByLabelText(/cod poștal/i), "400001");
    await user.type(screen.getByLabelText(/telefon/i), "0712345678");

    const county = screen
      .getAllByRole("combobox")
      .find(element => element.getAttribute("data-disabled") === null);
    if (!county) {
      throw new Error("county select was not rendered");
    }
    await user.click(county);
    await user.click(await screen.findByRole("option", { name: "Cluj" }));

    await user.click(
      screen.getByRole("button", { name: /continuă la metoda de livrare/i })
    );

    const fanCourier = await screen.findByText("FanCourier Standard");
    await user.click(fanCourier);
    await user.click(screen.getByRole("button", { name: /continuă la plată/i }));

    expect(screen.getAllByText("Opțiuni de plată").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Selectează metoda de plată preferată.").length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Payment options")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Please select a payment method.")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("1.5%")).not.toBeInTheDocument();
    expect(screen.getByText("Card bancar")).toBeInTheDocument();

    const cod = await screen.findByRole("radio", { name: /ramburs/i });
    expect(cod).toBeEnabled();
    await user.click(cod);

    const consent = await screen.findByRole("checkbox", {
      name: /condițiile COD/i,
    });
    await user.click(consent);

    const review = await screen.findByRole("button", {
      name: /continuă la verificare/i,
    });
    await waitFor(() => {
      expect(review).toBeEnabled();
    });
    await user.click(review);

    expect(
      await screen.findByRole("button", { name: /plasează comanda/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Kit STEM")).toBeInTheDocument();

    expect(document.body.textContent).toContain("49.99");
    expect(document.body.textContent).toContain("19.99");

    const requestedUrls = (global.fetch as jest.Mock).mock.calls.map(call =>
      String(call[0])
    );
    expect(requestedUrls.some(url => url.includes("/api/account/"))).toBe(
      false
    );
  });
});
