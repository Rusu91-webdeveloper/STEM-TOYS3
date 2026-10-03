/** @jest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { redirect } from "next/navigation";

import EditPaymentMethodPage from "@/app/account/payment-methods/[id]/edit/page";
import AddPaymentMethodPage from "@/app/account/payment-methods/new/page";
import { PaymentCardForm } from "@/features/account/components/PaymentCardForm";
import { PaymentMethods } from "@/features/account/components/PaymentMethods";
import { SavedPaymentMethods } from "@/features/account/components/SavedPaymentMethods";

let mockLanguage = "ro";
jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({ language: mockLanguage }),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirect");
  }),
}));

const mockFetch = jest.fn();
const card = {
  id: "card-1",
  cardType: "visa",
  lastFourDigits: "4242",
  cardholderName: "Test Customer",
  expiryMonth: "12",
  expiryYear: "30",
};

beforeEach(() => {
  mockLanguage = "ro";
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
  global.fetch = mockFetch;
  jest.mocked(redirect).mockClear();
});

it.each([AddPaymentMethodPage, EditPaymentMethodPage])(
  "redirects retired card-entry URLs to the account list",
  Page => {
    expect(() => Page()).toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/account/payment-methods");
    expect(mockFetch).not.toHaveBeenCalled();
  }
);

it("keeps the old form entry point free of card fields and submission", () => {
  const { container } = render(<PaymentCardForm />);
  expect(
    screen.getByText(
      /Introdu datele cardului numai în formularul procesatorului/
    )
  ).toBeInTheDocument();
  expect(container.querySelector("input, form, textarea")).toBeNull();
  expect(mockFetch).not.toHaveBeenCalled();
});

it.each([PaymentMethods, SavedPaymentMethods])(
  "renders the safe empty account state without add/edit controls",
  async Component => {
    const { container } = render(<Component />);
    expect(
      await screen.findByText("Nu ai carduri salvate în cont.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("input, form, textarea")).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/account/payment-cards", {
      cache: "no-store",
    });
  }
);

it("renders the provider notice in English for English users", async () => {
  mockLanguage = "en";
  render(<PaymentMethods />);
  expect(
    await screen.findByText("You have no saved cards in your account.")
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Enter card details only in the payment provider/)
  ).toBeInTheDocument();
});

it("shows loading and reports failed loading without pretending the list is empty", async () => {
  mockFetch.mockRejectedValue(new Error("network unavailable"));
  render(<PaymentMethods />);
  expect(screen.getByRole("status")).toHaveTextContent("Se încarcă");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Cardurile nu au putut fi încărcate"
  );
  expect(
    screen.queryByText("Nu ai carduri salvate în cont.")
  ).not.toBeInTheDocument();
});

it("shows only card metadata and removes a record only after confirmation", async () => {
  mockFetch
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([card]) })
    .mockResolvedValueOnce({ ok: true });
  const { container } = render(<PaymentMethods />);
  expect(await screen.findByText(/visa •••• 4242/)).toBeInTheDocument();
  expect(
    screen.getByText(/Cardurile salvate anterior nu sunt utilizate/)
  ).toBeInTheDocument();
  expect(container.querySelector("input, form, textarea")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Elimină cardul" }));
  const dialog = screen.getByRole("alertdialog");
  expect(mockFetch).toHaveBeenCalledTimes(1);
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Elimină cardul" })
  );
  await waitFor(() =>
    expect(screen.queryByText(/visa •••• 4242/)).not.toBeInTheDocument()
  );
  expect(mockFetch).toHaveBeenLastCalledWith(
    "/api/account/payment-cards/card-1",
    { method: "DELETE" }
  );
  expect(
    mockFetch.mock.calls.every(
      ([, options]) => !["POST", "PUT"].includes(options?.method)
    )
  ).toBe(true);
});

it("keeps a card visible when removal fails", async () => {
  mockFetch
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([card]) })
    .mockResolvedValueOnce({ ok: false });
  render(<PaymentMethods />);
  await screen.findByText(/visa •••• 4242/);
  fireEvent.click(screen.getByRole("button", { name: "Elimină cardul" }));
  fireEvent.click(
    within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Elimină cardul",
    })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Cardul nu a putut fi eliminat"
  );
  expect(screen.getByText(/visa •••• 4242/)).toBeInTheDocument();
});
