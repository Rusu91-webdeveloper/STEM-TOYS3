/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

// Mock the session context
jest.mock("@/lib/auth/SessionContext", () => ({
  useOptimizedSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
}));

// Mock the translation hook
jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the cart button component
jest.mock("@/features/cart", () => ({
  CartButton: ({ variant }: { variant?: string }) => (
    <button data-testid="cart-button">Cart</button>
  ),
}));

// Mock the language selector used in the mobile sidebar
jest.mock("@/components/ui/mobile-language-selector", () => ({
  MobileLanguageSelector: () => (
    <div data-testid="mobile-language-selector">Language selector</div>
  ),
}));

describe("Header Component - Mobile Menu", () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (signOut as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders mobile menu button", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it("opens mobile menu when burger button is clicked", async () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(document.querySelector(".mobile-sidebar-panel")).toBeInTheDocument();
    });
  });

  it("closes mobile menu when close button is clicked", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(document.querySelector(".mobile-sidebar-panel")).toBeInTheDocument();
    });

    // Close menu
    const closeButton = screen.getByRole("button", {
      name: /close navigation menu/i,
    });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/menu/i)).not.toBeInTheDocument();
    });
  });

  it("closes mobile menu when backdrop is clicked", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(document.querySelector(".mobile-sidebar-panel")).toBeInTheDocument();
    });

    // Click backdrop (the overlay div)
    const backdrop = document.querySelector(
      '.fixed.inset-0[aria-hidden="true"]'
    );
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText(/menu/i)).not.toBeInTheDocument();
    });
  });

  it("renders navigation links in mobile menu", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      const mobileMenu = document.querySelector(".mobile-sidebar-panel");
      expect(mobileMenu).toBeInTheDocument();
      expect(within(mobileMenu as HTMLElement).getByRole("link", { name: /categories/i })).toHaveAttribute("href", "/categories");
      expect(within(mobileMenu as HTMLElement).getByRole("link", { name: /about/i })).toHaveAttribute("href", "/about");
      expect(within(mobileMenu as HTMLElement).getByRole("link", { name: /contact/i })).toHaveAttribute("href", "/contact");
    });
  });

  it("navigates when selecting age group from Products section", async () => {
    const push = jest.fn();
    (useRouter as unknown as jest.Mock).mockReturnValue({ push });

    render(<Header />);

    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    // open Products
    const productsToggle = screen.getByRole("button", { name: /products/i });
    fireEvent.click(productsToggle);

    // open Age
    const ageToggle = screen.getByRole("button", { name: /age/i });
    fireEvent.click(ageToggle);

    const ageItem = await screen.findByRole("button", {
      name: /age3to5/i,
    });
    fireEvent.click(ageItem);

    await waitFor(() => {
      expect(push).toHaveBeenCalled();
    });
  });

  it("has compact and professional styling positioned below header", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      const menuContainer = document.querySelector(".mobile-sidebar-panel");
      expect(menuContainer).toHaveClass("w-[86vw]", "max-w-[380px]");
    });
  });

  it("renders utilities section in mobile menu", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      const mobileMenu = document.querySelector(".mobile-sidebar-panel");
      expect(mobileMenu).toBeInTheDocument();

      const languageSelector = mobileMenu?.querySelector(
        '[data-testid="mobile-language-selector"]'
      );

      expect(languageSelector).toBeInTheDocument();
    });
  });

  it("keeps account actions in a dedicated mobile footer", async () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      const footer = document.querySelector(".mobile-sidebar-footer");
      expect(footer).toBeInTheDocument();
      expect(within(footer as HTMLElement).getByText(/account/i)).toBeInTheDocument();
    });
  });
});
