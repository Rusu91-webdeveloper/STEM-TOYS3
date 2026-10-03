import { Script as JavaScript } from "node:vm";

import { render } from "@testing-library/react";

import FacebookPixel from "@/components/analytics/FacebookPixel";
import { saveCookieConsent } from "@/lib/analytics/consent";

jest.mock(
  "next/script",
  () =>
    function MockScript(props: {
      id: string;
      dangerouslySetInnerHTML: { __html: string };
    }) {
      return (
        <script
          id={props.id}
          type="application/json"
          dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
        />
      );
    }
);
const originalId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
beforeEach(() => {
  localStorage.clear();
  delete (window as Partial<Window>).fbq;
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "111222333444555";
});
afterEach(() => {
  if (originalId === undefined)
    delete process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  else process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = originalId;
});
it("does not load the configured pixel without advertising consent", () => {
  saveCookieConsent({ analytics: true, marketing: false });
  const { container } = render(<FacebookPixel />);
  expect(container.querySelector("script")).toBeNull();
});
it("emits valid JavaScript only after consent", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  const { container } = render(<FacebookPixel />);
  const scripts = container.querySelectorAll("script");
  expect(scripts).toHaveLength(2);
  scripts.forEach(script =>
    expect(() => new JavaScript(script.textContent!)).not.toThrow()
  );
  expect(scripts[0].textContent).toContain("fbq('consent', 'grant')");
});
it("does not send through retained helpers after withdrawal", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  render(<FacebookPixel />);
  window.fbq = jest.fn();
  saveCookieConsent({ analytics: false, marketing: false });
  window.trackRomanianPurchase("order", 10, ["kit"]);
  window.trackViralShare("article");
  expect(window.fbq).not.toHaveBeenCalled();
});
it("never initializes a placeholder or invalid ID", () => {
  saveCookieConsent({ analytics: true, marketing: true });
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "123456789012345";
  const { container, rerender } = render(<FacebookPixel />);
  expect(container.querySelector("script")).toBeNull();
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "invalid'identifier";
  rerender(<FacebookPixel />);
  expect(container.querySelector("script")).toBeNull();
});
