import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AnalyticsWrapper from "@/components/analytics/AnalyticsWrapper";
import CookieConsent from "@/components/analytics/CookieConsent";
import {
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/analytics/consent";
import { syncConsentRuntime } from "@/lib/analytics/consent-runtime";

jest.mock("@/lib/analytics/consent-runtime", () => ({
  syncConsentRuntime: jest.fn(),
}));
jest.mock("next/dynamic", () => (loader: () => Promise<unknown>) => {
  const name = [
    "GoogleAnalytics",
    "FacebookPixel",
    "InstagramPixel",
    "TikTokPixel",
  ].find(value => loader.toString().includes(value));
  return function Pixel() {
    return <span data-testid={name}>{name}</span>;
  };
});
jest.mock("@vercel/analytics/next", () => ({
  Analytics: () => <span data-testid="VercelAnalytics" />,
}));
jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <span data-testid="SpeedInsights" />,
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
function mount() {
  return render(
    <>
      <CookieConsent />
      <AnalyticsWrapper />
    </>
  );
}
it("loads no optional services until a choice and remembers refusal", async () => {
  const view = mount();
  expect(
    screen.getByRole("region", { name: "Preferințe cookie-uri" })
  ).toBeVisible();
  expect(screen.queryByTestId("GoogleAnalytics")).not.toBeInTheDocument();
  expect(screen.queryByTestId("FacebookPixel")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Refuz opționale" })
  );
  expect(readCookieConsent()).toMatchObject({
    analytics: false,
    marketing: false,
  });
  view.unmount();
  mount();
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Setări cookie-uri" })
  ).toBeVisible();
});
it("grants analytics without granting advertising, in the same document", async () => {
  mount();
  await userEvent.click(screen.getByRole("button", { name: "Personalizez" }));
  expect(screen.getByLabelText(/Analiză și performanță/)).not.toBeChecked();
  expect(screen.getByLabelText(/Publicitate/)).not.toBeChecked();
  await userEvent.click(screen.getByLabelText(/Analiză și performanță/));
  await userEvent.click(
    screen.getByRole("button", { name: "Salvez preferințele" })
  );
  expect(screen.getByTestId("GoogleAnalytics")).toBeInTheDocument();
  expect(screen.getByTestId("VercelAnalytics")).toBeInTheDocument();
  expect(screen.getByTestId("SpeedInsights")).toBeInTheDocument();
  expect(screen.queryByTestId("FacebookPixel")).not.toBeInTheDocument();
});
it("grants advertising independently of analytics", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  mount();
  expect(screen.getByTestId("FacebookPixel")).toBeInTheDocument();
  expect(screen.getByTestId("InstagramPixel")).toBeInTheDocument();
  expect(screen.getByTestId("TikTokPixel")).toBeInTheDocument();
  expect(screen.queryByTestId("GoogleAnalytics")).not.toBeInTheDocument();
  expect(screen.queryByTestId("VercelAnalytics")).not.toBeInTheDocument();
});
it("reopens saved preferences and applies withdrawal before returning", async () => {
  mount();
  await userEvent.click(screen.getByRole("button", { name: "Accept toate" }));
  expect(screen.getByTestId("FacebookPixel")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Setări cookie-uri" })
  );
  expect(screen.getByLabelText(/Publicitate/)).toBeChecked();
  await userEvent.click(
    screen.getByRole("button", { name: "Refuz opționale" })
  );
  expect(screen.queryByTestId("FacebookPixel")).not.toBeInTheDocument();
  expect(screen.queryByTestId("GoogleAnalytics")).not.toBeInTheDocument();
  expect(syncConsentRuntime).toHaveBeenLastCalledWith(
    expect.objectContaining({ analytics: true, marketing: true }),
    expect.objectContaining({ analytics: false, marketing: false })
  );
});
it("responds to refusal in another tab", () => {
  saveCookieConsent({ analytics: true, marketing: true });
  mount();
  act(() => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        revision: "other-tab",
        updatedAt: Date.now(),
        analytics: false,
        marketing: false,
      })
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: CONSENT_STORAGE_KEY })
    );
  });
  expect(screen.queryByTestId("FacebookPixel")).not.toBeInTheDocument();
  expect(screen.queryByTestId("GoogleAnalytics")).not.toBeInTheDocument();
});
it("expires permission even while the page remains open", () => {
  jest.useFakeTimers();
  saveCookieConsent({ analytics: true, marketing: true });
  mount();
  act(() => {
    jest.advanceTimersByTime(CONSENT_MAX_AGE_MS);
  });
  expect(screen.queryByTestId("GoogleAnalytics")).not.toBeInTheDocument();
  expect(screen.getByRole("region")).toBeInTheDocument();
  jest.useRealTimers();
});
it("keeps tracking blocked when a choice cannot be saved", async () => {
  mount();
  const blocked = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  await userEvent.click(screen.getByRole("button", { name: "Accept toate" }));
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.queryByTestId("GoogleAnalytics")).not.toBeInTheDocument();
  blocked.mockRestore();
});
