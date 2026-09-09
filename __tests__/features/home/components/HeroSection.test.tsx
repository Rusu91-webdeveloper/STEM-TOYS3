import { render, screen, within } from "@testing-library/react";
import { HeroSection } from "@/features/home/components/HeroSection";

jest.mock("@/lib/analytics/homepage-conversion-events", () => ({
  HOMEPAGE_CONVERSION_EVENTS: {},
  trackHomepageConversionEvent: jest.fn(),
}));

const t = (key: string, fallback?: string) => fallback ?? key;

it("keeps the product-led message and shopping paths with a brand scene", () => {
  render(<HeroSection t={t} />);
  const hero = screen.getByRole("region", { name: /STEM fără ecran/ });
  expect(within(hero).getByRole("heading", { level: 1 })).toHaveTextContent(
    "Cadouri care merită despachetate"
  );
  expect(
    within(hero).getByRole("link", { name: /Explorează colecția/ })
  ).toHaveAttribute("href", "/products");
  expect(
    within(hero).getByRole("link", { name: /Cadouri 6–8 ani/ })
  ).toHaveAttribute("href", "/cadouri-stem-6-8-ani");
  expect(hero).toHaveTextContent("Plată ramburs (COD)");
  expect(hero).toHaveTextContent("Livrare 1–4 zile lucrătoare");
  expect(hero).not.toHaveTextContent(
    /Hover Racer|Inspirație\. Creație\. Viitor\.|50[.,]000/
  );
  expect(within(hero).getByRole("img")).toHaveAttribute(
    "src",
    expect.stringContaining("brand-unboxing")
  );
});
