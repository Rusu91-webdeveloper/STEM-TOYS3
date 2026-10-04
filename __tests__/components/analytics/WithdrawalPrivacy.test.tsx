import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

import AnalyticsWrapper from "@/components/analytics/AnalyticsWrapper";
import { preparePrivateWithdrawalPage } from "@/lib/analytics/withdrawal-privacy";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("@/lib/analytics/use-cookie-consent", () => ({
  useCookieConsent: () => ({ consent: { analytics: true, marketing: true } }),
}));
jest.mock(
  "next/dynamic",
  () => () =>
    function MockTrackingSdk() {
      return <span data-testid="tracking-sdk" />;
    }
);
jest.mock("@vercel/analytics/next", () => ({
  Analytics: () => <span data-testid="tracking-sdk" />,
}));
jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <span data-testid="tracking-sdk" />,
}));

test.each(["/withdrawal", "/withdrawal/"])(
  "no optional tracking components mount on %s even with full consent",
  path => {
    (usePathname as jest.Mock).mockReturnValue(path);
    render(<AnalyticsWrapper />);
    expect(screen.queryAllByTestId("tracking-sdk")).toHaveLength(0);
  }
);
test("ordinary storefront consent still mounts tracking", () => {
  (usePathname as jest.Mock).mockReturnValue("/products");
  render(<AnalyticsWrapper />);
  expect(screen.queryAllByTestId("tracking-sdk").length).toBeGreaterThan(0);
});
test.each([
  "google-analytics",
  "facebook-pixel",
  "instagram-pixel",
  "tiktok-pixel",
])("an already loaded %s forces a fresh document before form entry", id => {
  const script = document.createElement("script");
  script.id = id;
  document.head.appendChild(script);
  const reload = jest.fn();
  expect(preparePrivateWithdrawalPage(reload)).toBe(false);
  expect(reload).toHaveBeenCalledTimes(1);
  script.remove();
  expect(preparePrivateWithdrawalPage(reload)).toBe(true);
});
test.each([
  "https://connect.facebook.net/en_US/fbevents.js",
  "https://www.googletagmanager.com/gtag/js?id=G-TEST",
  "https://analytics.tiktok.com/i18n/pixel/events.js",
  "/_vercel/insights/script.js",
  "/_vercel/speed-insights/script.js",
])("loaded Vercel tracking %s is isolated too", src => {
  const script = document.createElement("script");
  script.src = src;
  document.head.appendChild(script);
  const reload = jest.fn();
  expect(preparePrivateWithdrawalPage(reload)).toBe(false);
  expect(reload).toHaveBeenCalledTimes(1);
  script.remove();
});
