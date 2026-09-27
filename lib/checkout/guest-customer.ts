import { randomBytes } from "crypto";

import { hash } from "bcryptjs";

import { db } from "@/lib/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class GuestCheckoutError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "GuestCheckoutError";
    this.code = code;
    this.status = status;
  }
}

export interface CheckoutCustomer {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isGuest: boolean;
}

interface SessionCheckoutUser {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

/**
 * Logged-in shoppers keep their account. Guests need an email because Order
 * and Address still require a user id. A new inactive customer is created
 * only when that email is not already registered.
 */
export async function resolveCheckoutCustomer(input: {
  sessionUser?: SessionCheckoutUser | null;
  guestEmail?: string | null;
  guestName?: string | null;
}): Promise<CheckoutCustomer> {
  const sessionUser = input.sessionUser;
  const sessionEmail = normalizeEmail(sessionUser?.email);
  if (sessionUser?.id && sessionEmail) {
    return {
      id: sessionUser.id,
      email: sessionEmail,
      name: sessionUser.name ?? null,
      role: sessionUser.role ?? "CUSTOMER",
      isGuest: false,
    };
  }

  const guestEmail = normalizeEmail(input.guestEmail);
  if (!guestEmail || !EMAIL_PATTERN.test(guestEmail)) {
    throw new GuestCheckoutError(
      "GUEST_EMAIL_REQUIRED",
      "A valid email is required to place an order without an account."
    );
  }

  const existing = await db.user.findUnique({
    where: { email: guestEmail },
    select: { id: true, email: true, name: true, role: true },
  });

  if (existing) {
    if (existing.role === "ADMIN" || existing.role === "SUPPLIER") {
      throw new GuestCheckoutError(
        "GUEST_EMAIL_REQUIRES_LOGIN",
        "This email belongs to a staff account. Sign in to place the order.",
        409
      );
    }

    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
      isGuest: true,
    };
  }

  const password = await hash(randomBytes(32).toString("hex"), 12);
  const trimmedGuestName = input.guestName?.trim() ?? "";
  const guestName = trimmedGuestName.length > 0 ? trimmedGuestName : null;

  try {
    const created = await db.user.create({
      data: {
        email: guestEmail,
        name: guestName,
        password,
        role: "CUSTOMER",
        isActive: false,
        tags: ["guest-checkout"],
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      isGuest: true,
    };
  } catch (error) {
    const raced = await db.user.findUnique({
      where: { email: guestEmail },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!raced || raced.role === "ADMIN" || raced.role === "SUPPLIER") {
      throw error;
    }

    return {
      id: raced.id,
      email: raced.email,
      name: raced.name,
      role: raced.role,
      isGuest: true,
    };
  }
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}
