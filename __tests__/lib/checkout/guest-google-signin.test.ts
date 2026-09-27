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

  it("activates an inactive guest-checkout user and allows sign-in", async () => {
    const allowed = await activateGuestCheckoutForProviderSignIn({
      id: "guest_1",
      role: "CUSTOMER",
      isActive: false,
      password: "$2a$12$random-guest-hash",
      tags: ["guest-checkout"],
    });

    expect(allowed).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "guest_1" },
      data: {
        isActive: true,
        emailVerified: expect.any(Date),
      },
    });
  });

  it("activates an inactive customer who never set a password", async () => {
    const allowed = await activateGuestCheckoutForProviderSignIn({
      id: "empty_pw",
      role: "CUSTOMER",
      isActive: false,
      password: "",
      tags: [],
    });

    expect(allowed).toBe(true);
    expect(db.user.update).toHaveBeenCalled();
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
