import { render, screen } from "@testing-library/react";

import ClientLayout from "@/components/layout/ClientLayout";

let mockPathname = "/admin";
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("@/components/layout/Header", () => ({
  __esModule: true,
  default: () => <header>Storefront header</header>,
}));
jest.mock("@/components/auth/AccountLinkingNotice", () => ({
  AccountLinkingNotice: () => null,
}));
jest.mock("@/components/auth/DatabaseConfigNotice", () => ({
  DatabaseConfigNotice: () => null,
}));
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

describe("admin layout boundary", () => {
  it("lets admin own the header and main landmark", () => {
    mockPathname = "/admin/orders";
    render(
      <ClientLayout>
        <main aria-label="Admin">Admin content</main>
      </ClientLayout>
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.queryByText("Storefront header")).toBeNull();
    expect(screen.getByText("Admin content")).toBeVisible();
  });
  it("preserves the header for storefront pages", () => {
    mockPathname = "/products";
    render(<ClientLayout>Products</ClientLayout>);
    expect(screen.getByText("Storefront header")).toBeVisible();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
