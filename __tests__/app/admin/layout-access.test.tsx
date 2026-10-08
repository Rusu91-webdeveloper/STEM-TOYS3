import { redirect } from "next/navigation";

import AdminLayout from "@/app/admin/layout";
import { auth } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("Redirected");
  }),
}));
jest.mock("@/app/admin/components/admin-shell", () => ({
  __esModule: true,
  default: () => null,
}));

describe("server admin page access", () => {
  beforeEach(() => jest.clearAllMocks());
  it.each([
    null,
    { user: { role: "VISITOR" } },
    { user: { role: "CUSTOMER" } },
    { user: { role: "SUPPLIER" } },
  ])(
    "redirects before rendering administrative pages for %j",
    async session => {
      (auth as jest.Mock).mockResolvedValue(session);
      await expect(
        AdminLayout({ children: <span>Private data</span> })
      ).rejects.toThrow("Redirected");
      expect(redirect).toHaveBeenCalledWith("/auth/login?callbackUrl=/admin");
    }
  );
  it("passes only the admin's display name and role to the client shell", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "secret-id",
        email: "private@example.test",
        name: "Administrator",
        role: "ADMIN",
      },
    });
    const page = await AdminLayout({ children: <span>Authorized page</span> });
    expect(page.props.user).toEqual({ name: "Administrator", role: "ADMIN" });
    expect(redirect).not.toHaveBeenCalled();
  });
});
