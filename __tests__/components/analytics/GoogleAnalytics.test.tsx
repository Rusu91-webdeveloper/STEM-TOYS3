import { render, waitFor } from "@testing-library/react";
import React from "react";

import { saveCookieConsent } from "@/lib/analytics/consent";

import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { trackProductView } from "@/lib/analytics/ga4";

it("flushes initial product views after Next inserts the inline bootstrap", async () => {
  localStorage.clear();
  saveCookieConsent({ analytics: true, marketing: false });
  const previousTag = window.gtag;
  delete (window as Partial<Window>).gtag;
  trackProductView({
    item_id: "reviewed-kit",
    item_name: "Kit",
    category: "STEM",
    price: 99,
    currency: "RON",
  });

  const tag = jest.fn();
  const appendChild = document.body.appendChild;
  // Record calls after the inline bootstrap is inserted, using Next's real
  // script loader, whose onReady runs before insertion.
  const append = jest
    .spyOn(document.body, "appendChild")
    .mockImplementation(node => {
      const result = appendChild.call(document.body, node);
      if (node instanceof HTMLScriptElement && node.id === "google-analytics") {
        window.gtag = tag;
      }
      return result;
    });

  try {
    render(<GoogleAnalytics measurementId="G-TEST" />);
    await waitFor(() =>
      expect(tag).toHaveBeenCalledWith(
        "event",
        "view_item",
        expect.objectContaining({
          value: 99,
          items: [expect.objectContaining({ item_id: "reviewed-kit" })],
        })
      )
    );
    expect(tag).toHaveBeenCalledTimes(1);
  } finally {
    append.mockRestore();
    window.gtag = previousTag;
  }
});
