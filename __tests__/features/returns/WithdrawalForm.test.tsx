import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { WithdrawalForm } from "@/features/returns/components/WithdrawalForm";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { preparePrivateWithdrawalPage } from "@/lib/analytics/withdrawal-privacy";

jest.mock("@/lib/analytics/withdrawal-privacy", () => ({
  preparePrivateWithdrawalPage: jest.fn(),
}));
jest.mock("@/hooks/useCsrfToken", () => ({ useCsrfToken: jest.fn() }));
const csrf = {
  token: "local-token",
  loading: false,
  error: null,
  refreshToken: jest.fn().mockResolvedValue(undefined),
  addToHeaders: (headers: Record<string, string>) => ({
    ...headers,
    "X-CSRF-Token": "local-token",
  }),
};
const fetchMock = fetch as jest.Mock;
function prepare() {
  fireEvent.change(screen.getByLabelText("Numele tău"), {
    target: { value: "Test Client" },
  });
  fireEvent.change(
    screen.getByLabelText("Email pentru confirmarea de primire"),
    { target: { value: "test@example.invalid" } }
  );
  fireEvent.change(
    screen.getByLabelText("Contractul / comanda și produsele vizate"),
    { target: { value: "TEST-LOCAL, toate produsele" } }
  );
  fireEvent.click(screen.getByRole("button", { name: "Verifică declarația" }));
}
beforeEach(() => {
  jest.clearAllMocks();
  (preparePrivateWithdrawalPage as jest.Mock).mockReturnValue(true);
  (useCsrfToken as jest.Mock).mockReturnValue(csrf);
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: jest.fn(() => "00000000-0000-4000-8000-000000000001"),
  });
});
test("review and editing transmit nothing; only explicit confirmation sends a CSRF-protected declaration", async () => {
  render(<WithdrawalForm />);
  prepare();
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Editează declarația" }));
  expect(fetchMock).not.toHaveBeenCalled();
  prepare();
  fetchMock.mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        receipt: {
          reference: "withdrawal_test",
          receivedAt: "2026-10-04T16:00:00Z",
        },
        text: "TEST-LOCAL — 2026-10-04T16:00:00Z",
        emailSent: true,
      }),
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmați retragerea" })
  );
  await screen.findByText("Declarația de retragere a fost înregistrată");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/returns/withdrawal");
  expect(options.credentials).toBe("include");
  expect(options.headers["X-CSRF-Token"]).toBe("local-token");
  expect(JSON.parse(options.body)).toMatchObject({
    confirmed: true,
    contract: "TEST-LOCAL, toate produsele",
  });
  expect(
    screen.getByRole("button", { name: "Descarcă confirmarea de primire" })
  ).toBeVisible();
});
test("lost response retries the same reference; email failure is not presented as delivery", async () => {
  render(<WithdrawalForm />);
  prepare();
  fetchMock.mockRejectedValueOnce(new Error("Conexiune întreruptă"));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmați retragerea" })
  );
  await screen.findByText("Conexiune întreruptă");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirmați retragerea" })
    ).toBeEnabled()
  );
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        receipt: { reference: "withdrawal_test" },
        text: "Dovadă",
        emailSent: false,
      }),
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmați retragerea" })
  );
  await screen.findByText(
    /Declarația este salvată, dar nu am putut confirma trimiterea emailului/
  );
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).submissionId).toBe(
    JSON.parse(fetchMock.mock.calls[1][1].body).submissionId
  );
  expect(csrf.refreshToken).toHaveBeenCalledTimes(1);
});
test("confirmation remains disabled without the security token", () => {
  (useCsrfToken as jest.Mock).mockReturnValue({
    ...csrf,
    token: null,
    loading: true,
  });
  render(<WithdrawalForm />);
  prepare();
  expect(
    screen.getByRole("button", { name: "Confirmați retragerea" })
  ).toBeDisabled();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("previously loaded trackers must be removed before any declaration fields are available", () => {
  (preparePrivateWithdrawalPage as jest.Mock).mockReturnValue(false);
  render(<WithdrawalForm />);
  expect(screen.queryByLabelText("Numele tău")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Confirmați retragerea" })
  ).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});
