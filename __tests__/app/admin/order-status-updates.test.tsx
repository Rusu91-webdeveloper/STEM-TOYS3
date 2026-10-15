import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import OrderDetailsPage from "@/app/admin/orders/[id]/page";
import OrdersPage from "@/app/admin/orders/page";

const mockToast = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "OriginalCaseID" }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("next/server", () => ({}));
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={event => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, asChild }: any) =>
    asChild ? children : <button onClick={onClick}>{children}</button>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuLabel: () => null,
  DropdownMenuSeparator: () => null,
}));

const order = {
  id: "OriginalCaseID",
  orderNumber: "ORD-TEST",
  customer: "Client",
  email: "client@example.test",
  date: "2026-10-15",
  status: "READY_FOR_SHIPPING",
  currency: "RON",
  total: 154.89,
  subtotal: 154.89,
  tax: 0,
  shippingCost: 0,
  paymentMethod: "cash_on_delivery",
  paymentStatus: "PENDING",
  items: [],
  supplierOrders: [],
  shippingAddress: { fullName: "Client", city: "București", country: "RO" },
};
const json = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});
const originalFetch = global.fetch;
let tokenStatus: number;
let patchStatus: number;
let tokenCount: number;
let emailNotification: { status: string } | undefined;
const patches = () =>
  (global.fetch as jest.Mock).mock.calls.filter(
    ([, options]) => options?.method === "PATCH"
  );

async function openCancellation(surface: "list" | "details") {
  render(surface === "list" ? <OrdersPage /> : <OrderDetailsPage />);
  let form: HTMLElement;
  if (surface === "list") {
    await screen.findAllByRole("link", { name: "ORD-TEST" });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Actualizează starea" })[0]
    );
    form = screen.getByRole("dialog");
  } else {
    await screen.findByRole("heading", { name: "Comanda #ORD-TEST" });
    form = document.body;
  }
  fireEvent.change(within(form).getAllByRole("combobox")[0], {
    target: { value: "CANCELLED" },
  });
  const reason = screen.getByPlaceholderText(/Scrie motivul anulării/);
  fireEvent.change(reason, { target: { value: "  La cererea clientului  " } });
  return within(form).getByRole("button", {
    name: surface === "list" ? "Actualizează starea" : "Actualizează",
  });
}

describe.each(["list", "details"] as const)("order status from %s", surface => {
  beforeEach(() => {
    mockToast.mockClear();
    tokenStatus = 200;
    patchStatus = 200;
    tokenCount = 0;
    emailNotification = { status: "accepted" };
    global.fetch = jest
      .fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        if (url === "/api/csrf-token") {
          return Promise.resolve(
            json({ csrfToken: `fresh-token-${++tokenCount}` }, tokenStatus)
          );
        }
        if (options?.method === "PATCH") {
          const headers = options.headers as Record<string, string>;
          return Promise.resolve(
            json(
              { order: { ...order, status: "Cancelled" }, emailNotification },
              headers?.["X-CSRF-Token"] ? patchStatus : 403
            )
          );
        }
        if (url.includes("?")) {
          return Promise.resolve(
            json({
              orders: [
                {
                  ...order,
                  id: order.orderNumber,
                  dbId: order.id,
                  items: 0,
                  suppliers: [],
                },
              ],
              pagination: { page: 1, limit: 10, total: 1, pages: 1 },
            })
          );
        }
        return Promise.resolve(json({ order }));
      });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("fetches a fresh token before submitting cancellation with the original ID and reason", async () => {
    const button = await openCancellation(surface);
    const previousTokens = tokenCount;
    fireEvent.click(button);
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Salvat" })
      )
    );
    expect(tokenCount).toBe(previousTokens + 1);
    expect(patches()).toEqual([
      [
        `/api/admin/orders/${order.id}`,
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": `fresh-token-${tokenCount}`,
          },
          body: JSON.stringify({
            status: "CANCELLED",
            cancellationReason: "La cererea clientului",
          }),
        }),
      ],
    ]);
    if (surface === "list") {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(
        (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
          url.includes("?")
        ).length
      ).toBe(2);
    }
  });

  it("keeps the draft and sends no mutation if the security token cannot be fetched", async () => {
    const button = await openCancellation(surface);
    tokenStatus = 503;
    fireEvent.click(button);
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    );
    expect(patches()).toHaveLength(0);
    expect(screen.getByPlaceholderText(/Scrie motivul anulării/)).toHaveValue(
      "  La cererea clientului  "
    );
    expect(button).toBeEnabled();
  });

  it("shows the saved cancellation with an email warning and refreshes the saved state", async () => {
    emailNotification = { status: "failed" };
    const button = await openCancellation(surface);
    fireEvent.click(button);
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith({
        title: "Comanda a fost salvată",
        description: expect.stringContaining(
          "emailul de anulare nu a putut fi trimis"
        ),
        variant: "destructive",
      })
    );
    expect(patches()).toHaveLength(1);
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Salvat" })
    );
    if (surface === "list") {
      expect(screen.queryByRole("dialog")).toBeNull();
      await waitFor(() =>
        expect(
          (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
            url.includes("?")
          ).length
        ).toBe(2)
      );
    } else {
      await waitFor(() => expect(button).toBeDisabled());
    }
  });

  it("retains the failed draft and fetches another token for an explicit retry", async () => {
    const button = await openCancellation(surface);
    patchStatus = 403;
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    );
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Salvat" })
    );
    expect(patches()).toHaveLength(1);
    const firstToken = patches()[0][1].headers["X-CSRF-Token"];
    patchStatus = 200;
    fireEvent.click(button);
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Salvat" })
      )
    );
    expect(patches()).toHaveLength(2);
    expect(patches()[1][1].headers["X-CSRF-Token"]).not.toBe(firstToken);
  });
});
