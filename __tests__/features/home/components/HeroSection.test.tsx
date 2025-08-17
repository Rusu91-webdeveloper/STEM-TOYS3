/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/features/home/components/HeroSection";

// Mock Next.js Image component
// eslint-disable-next-line @next/next/no-img-element
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  default: (props: any) => <img alt={props.alt || ""} {...props} />,
}));

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("HeroSection", () => {
  const mockT = (key: string, defaultValue?: string) => defaultValue ?? key;

  beforeEach(() => {
    // Mock the translation function
    mockT.mockClear?.();
  });

  it("renders hero section with proper structure", () => {
    render(<HeroSection t={mockT} />);

    // Check if the main section is rendered
    const section = screen.getByRole("region");
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute("aria-label", "Homepage Hero Section");
  });

  it("renders hero image with correct attributes", () => {
    render(<HeroSection t={mockT} />);

    const heroImage = screen.getByAltText("discoverCollection");
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute("src", "/images/homepage_hero_banner_01.png");
  });

  it("renders main heading and description", () => {
    render(<HeroSection t={mockT} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("inspireMinds");

    const description = screen.getByText("discoverCollection");
    expect(description).toBeInTheDocument();
  });

  it("renders CTA buttons with correct links", () => {
    render(<HeroSection t={mockT} />);

    const shopAllLink = screen.getByRole("link", { name: "shopAllProducts" });
    expect(shopAllLink).toBeInTheDocument();
    expect(shopAllLink).toHaveAttribute("href", "/products");

    const exploreCategoriesLink = screen.getByRole("link", { name: "exploreCategories" });
    expect(exploreCategoriesLink).toBeInTheDocument();
    expect(exploreCategoriesLink).toHaveAttribute("href", "/categories");
  });

  it("has proper accessibility attributes", () => {
    render(<HeroSection t={mockT} />);

    const shopAllLink = screen.getByRole("link", { name: "shopAllProducts" });
    expect(shopAllLink).toHaveAttribute("tabIndex", "0");

    const exploreCategoriesLink = screen.getByRole("link", { name: "exploreCategories" });
    expect(exploreCategoriesLink).toHaveAttribute("tabIndex", "0");
  });

  it("applies correct CSS classes for responsive design", () => {
    render(<HeroSection t={mockT} />);

    const section = screen.getByRole("region");
    expect(section).toHaveClass("min-h-[60vh]", "sm:min-h-[70vh]", "md:min-h-[80vh]");
  });

  it("includes gradient overlay for text readability", () => {
    render(<HeroSection t={mockT} />);

    const gradientOverlay = screen.getByRole("region").querySelector(
      '[aria-hidden="true"]'
    );
    expect(gradientOverlay).toBeInTheDocument();
    expect(gradientOverlay).toHaveClass("bg-gradient-to-r", "from-black/70", "to-black/30");
  });

  it("renders arrow icon in shop all products button", () => {
    render(<HeroSection t={mockT} />);

    const svgIcon = screen.getByRole("region").querySelector('svg[aria-hidden="true"]');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("w-5", "h-5");
  });
});
