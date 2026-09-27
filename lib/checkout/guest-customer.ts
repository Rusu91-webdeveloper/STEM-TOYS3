import { randomBytes } from "crypto";

import { hash } from "bcryptjs";

import { GUEST_CHECKOUT_TAG } from "@/lib/checkout/guest-account-claim";
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
 * Logged-in shoppers keep their account. A matching guest email is reused.
 * Returns null when the email is valid and no user exists yet, so the order
 * route can create that user only after price and stock checks pass.
 */
export async function lookupCheckoutCustomer(input: {
  sessionUser?: SessionCheckoutUser | null;
  guestEmail?: string | null;
  guestName?: string | null;
}): Promise<CheckoutCustomer | null> {
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

  const existing = await findCustomerByEmail(guestEmail);
  if (!existing) return null;

  assertCustomerMayCheckout(existing);
  return toGuestCustomer(existing);
}

export async function createGuestCheckoutCustomer(input: {
  guestEmail: string;
  guestName?: string | null;
}): Promise<CheckoutCustomer> {
  const guestEmail = normalizeEmail(input.guestEmail);
  if (!guestEmail || !EMAIL_PATTERN.test(guestEmail)) {
    throw new GuestCheckoutError(
      "GUEST_EMAIL_REQUIRED",
      "A valid email is required to place an order without an account."
    );
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
        tags: [GUEST_CHECKOUT_TAG],
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return toGuestCustomer(created);
  } catch (error) {
    const raced = await findCustomerByEmail(guestEmail);
    if (!raced) throw error;
    assertCustomerMayCheckout(raced);
    return toGuestCustomer(raced);
  }
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
  const existing = await lookupCheckoutCustomer(input);
  if (existing) return existing;

  return createGuestCheckoutCustomer({
    guestEmail: input.guestEmail ?? "",
    guestName: input.guestName,
  });
}

function toGuestCustomer(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
}): CheckoutCustomer {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isGuest: true,
  };
}

function assertCustomerMayCheckout(user: { role: string }) {
  if (user.role === "ADMIN" || user.role === "SUPPLIER") {
    throw new GuestCheckoutError(
      "GUEST_EMAIL_REQUIRES_LOGIN",
      "This email belongs to a staff account. Sign in to place the order.",
      409
    );
  }
}

function findCustomerByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });
}

export function normalizeCheckoutEmail(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  return normalizeCheckoutEmail(value);
}
