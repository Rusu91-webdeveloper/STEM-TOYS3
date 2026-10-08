import { render, screen } from "@testing-library/react";

import SidebarNav from "@/app/admin/components/sidebar-nav";
import {
  activeAdminHref,
  adminNavItems,
  adminNavGroups,
} from "@/lib/admin/navigation";

let mockPathname = "/admin";
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));

describe("business-focused admin navigation", () => {
  it("exposes nine primary sections and keeps specialist groups collapsed", () => {
    mockPathname = "/admin";
    const { container } = render(<SidebarNav />);
    expect(adminNavItems).toHaveLength(9);
    expect(screen.getByRole("link", { name: "Clienți" })).toBeVisible();
    expect(container.querySelectorAll("details[open]")).toHaveLength(0);
    expect(
      screen.queryByRole("link", { name: "Advanced Analytics" })
    ).toBeNull();
  });
  it("marks exactly one route active and expands its specialist group", () => {
    mockPathname = "/admin/analytics/sales";
    const { container } = render(<SidebarNav />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Raport de vânzări" })
    ).toHaveAttribute("aria-current", "page");
    expect(container.querySelectorAll("details[open]")).toHaveLength(1);
  });
  it("matches details by their section and does not overlap suppliers with feeds", () => {
    expect(activeAdminHref("/admin/orders/abc")).toBe("/admin/orders");
    expect(activeAdminHref("/admin/suppliers/feeds")).toBe(
      "/admin/suppliers/feeds"
    );
    const hrefs = [
      ...adminNavItems,
      ...adminNavGroups.flatMap(group => group.items),
    ].map(item => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
