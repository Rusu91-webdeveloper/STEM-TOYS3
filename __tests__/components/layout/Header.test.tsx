/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
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

// Mock the language and currency switchers
jest.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language</div>,
}));

jest.mock("@/components/ui/currency-switcher", () => ({
  CurrencySwitcher: ({ allowedCodes }: { allowedCodes?: string[] }) => (
    <div data-testid="currency-switcher">Currency</div>
  ),
}));

describe("Header Component - Mobile Menu", () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/");
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
      expect(screen.getByText("Menu")).toBeInTheDocument();
    });
  });

  it("closes mobile menu when close button is clicked", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText("Menu")).toBeInTheDocument();
    });

    // Close menu
    const closeButton = screen.getByRole("button", {
      name: /close navigation menu/i,
    });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    });
  });

  it("closes mobile menu when backdrop is clicked", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText("Menu")).toBeInTheDocument();
    });

    // Click backdrop (the overlay div)
    const backdrop = document.querySelector(".fixed.inset-0.bg-black");
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    });
  });

  it("renders navigation links in mobile menu", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      // Check for mobile menu container first
      const mobileMenu = document.querySelector(
        ".fixed.top-16.right-0.bottom-0"
      );
      expect(mobileMenu).toBeInTheDocument();

      // Check for navigation links within the mobile menu
      const mobileMenuLinks = mobileMenu?.querySelectorAll("a[href]");
      // home, categories, blog, about (products now moved to collapsible)
      expect(mobileMenuLinks).toHaveLength(4);
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
    const ageToggle = screen.getByRole("button", { name: /vârstă/i });
    fireEvent.click(ageToggle);

    const ageItem = await screen.findByRole("button", {
      name: /4–6 ani|4-6 ani/i,
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
      const menuContainer = document.querySelector(
        ".fixed.top-16.right-0.bottom-0"
      );
      expect(menuContainer).toHaveClass("w-80", "max-w-[85vw]");
    });
  });

  it("renders utilities section in mobile menu", async () => {
    render(<Header />);

    // Open menu
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    await waitFor(() => {
      // Check for mobile menu container first
      const mobileMenu = document.querySelector(
        ".fixed.top-16.right-0.bottom-0"
      );
      expect(mobileMenu).toBeInTheDocument();

      // Check for utilities within the mobile menu
      const languageSwitcher = mobileMenu?.querySelector(
        '[data-testid="language-switcher"]'
      );
      const currencySwitcher = mobileMenu?.querySelector(
        '[data-testid="currency-switcher"]'
      );

      expect(languageSwitcher).toBeInTheDocument();
      expect(currencySwitcher).toBeInTheDocument();
    });
  });
});
