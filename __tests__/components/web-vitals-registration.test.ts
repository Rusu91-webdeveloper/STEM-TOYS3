import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

import { hasAnalyticsConsent } from "@/lib/analytics/consent";
import { initPerformanceTracking } from "@/lib/analytics/web-vitals";

jest.mock("web-vitals", () => ({
  onLCP: jest.fn(),
  onINP: jest.fn(),
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));
jest.mock("@/lib/analytics/consent", () => ({
  hasAnalyticsConsent: jest.fn(),
}));

it("registers metrics once across remounts and checks current consent before each transmission", () => {
  const gtag = jest.fn();
  const previousGtag = Object.getOwnPropertyDescriptor(window, "gtag");
  window.gtag = gtag;
  (hasAnalyticsConsent as jest.Mock).mockReturnValue(false);
  initPerformanceTracking({ sendToConsole: false });
  initPerformanceTracking({ sendToConsole: false });
  for (const register of [onLCP, onINP, onCLS, onFCP, onTTFB])
    expect(register).toHaveBeenCalledTimes(1);
  const callback = (onLCP as jest.Mock).mock.calls[0][0];
  const metric = {
    name: "LCP",
    value: 2000,
    delta: 2000,
    id: "test",
    navigationType: "navigate",
  };
  callback(metric);
  expect(gtag).not.toHaveBeenCalled();
  (hasAnalyticsConsent as jest.Mock).mockReturnValue(true);
  callback(metric);
  expect(gtag).toHaveBeenCalledWith(
    "event",
    "LCP",
    expect.objectContaining({ metric_rating: "good", metric_delta: 2000 })
  );
  (hasAnalyticsConsent as jest.Mock).mockReturnValue(false);
  callback(metric);
  expect(gtag).toHaveBeenCalledTimes(1);
  if (previousGtag) Object.defineProperty(window, "gtag", previousGtag);
  else Reflect.deleteProperty(window, "gtag");
});
