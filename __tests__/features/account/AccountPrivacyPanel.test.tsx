import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signOut } from "next-auth/react";

import { AccountPrivacyPanel } from "@/features/account/components/AccountPrivacyPanel";
import { clearCartStorage } from "@/features/cart/lib/cartStorage";
jest.mock("next-auth/react", () => ({ signOut: jest.fn() }));
jest.mock("@/features/cart/lib/cartStorage", () => ({
  clearCartStorage: jest.fn(),
}));
jest.mock("@/lib/i18n", () => ({ useTranslation: () => ({ language: "ro" }) }));
const fetchMock = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
});
const confirm = () => fireEvent.click(screen.getByRole("checkbox"));
const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Șterge contul meu" }));
it("requires confirmation and uses the authenticated export URL", () => {
  render(<AccountPrivacyPanel />);
  expect(
    screen.getByRole("button", { name: "Șterge contul meu" })
  ).toBeDisabled();
  expect(screen.getByRole("link", { name: /Descarcă/ })).toHaveAttribute(
    "href",
    "/api/gdpr/export"
  );
  expect(fetchMock).not.toHaveBeenCalled();
});
it("does not sign out or clear the cart for pending review", async () => {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ csrfToken: "fixture" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "pending_review",
          message: "Cerere înregistrată",
        }),
    });
  render(<AccountPrivacyPanel />);
  confirm();
  submit();
  await screen.findByText("Cerere înregistrată");
  expect(signOut).not.toHaveBeenCalled();
  expect(clearCartStorage).not.toHaveBeenCalled();
  expect(fetchMock.mock.calls[1][1]).toMatchObject({
    method: "DELETE",
    headers: { "X-CSRF-Token": "fixture" },
    body: JSON.stringify({ confirmDeletion: true }),
  });
});
it("signs out and clears local cart data only after completed erasure", async () => {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ csrfToken: "fixture" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: "completed", message: "Eliminat" }),
    });
  render(<AccountPrivacyPanel />);
  confirm();
  submit();
  await waitFor(() =>
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  );
  expect(clearCartStorage).toHaveBeenCalledTimes(1);
});
it("stops on missing CSRF and reports failure", async () => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({}),
  });
  render(<AccountPrivacyPanel />);
  confirm();
  submit();
  await screen.findByRole("alert");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(signOut).not.toHaveBeenCalled();
});
