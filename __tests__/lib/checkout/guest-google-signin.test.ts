/**
 * @jest-environment node
 */

import { activateGuestCheckoutForProviderSignIn } from "@/lib/checkout/guest-account-claim";

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      update: jest.fn(),
    },
  },
}));

const { db } = require("@/lib/db");

describe("guest checkout then Google sign-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.user.update.mockResolvedValue({ id: "guest_1" });
  });

  it("activates a guest-checkout user and replaces the password", async () => {
    const allowed = await activateGuestCheckoutForProviderSignIn({
      id: "guest_1",
      role: "CUSTOMER",
      isActive: false,
      password: "$2a$12$random-guest-hash",
      tags: ["guest-checkout", "newsletter"],
    });

    expect(allowed).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "guest_1" },
      data: {
        isActive: true,
        emailVerified: expect.any(Date),
        password: expect.any(String),
        verificationToken: null,
        tags: ["newsletter"],
      },
    });
    const savedPassword = db.user.update.mock.calls[0][0].data.password;
    expect(savedPassword).not.toBe("$2a$12$random-guest-hash");
    expect(savedPassword.startsWith("$2")).toBe(true);
  });

  it("keeps an admin-deactivated passwordless customer signed out", async () => {
    const allowed = await activateGuestCheckoutForProviderSignIn({
      id: "deactivated_1",
      role: "CUSTOMER",
      isActive: false,
      password: "",
      tags: [],
    });

    expect(allowed).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("keeps inactive staff and unverified registered accounts locked", async () => {
    const staff = await activateGuestCheckoutForProviderSignIn({
      id: "admin_1",
      role: "ADMIN",
      isActive: false,
      password: "hash",
      tags: ["guest-checkout"],
    });
    const registered = await activateGuestCheckoutForProviderSignIn({
      id: "user_1",
      role: "CUSTOMER",
      isActive: false,
      password: "chosen-hash",
      tags: [],
    });

    expect(staff).toBe(false);
    expect(registered).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
