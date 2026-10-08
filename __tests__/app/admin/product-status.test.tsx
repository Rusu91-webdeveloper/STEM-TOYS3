import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProductStatusActions } from "@/app/admin/products/components/ProductStatusActions";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));
const originalFetch = global.fetch;
describe("product approval feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("saves the reviewed status and refreshes actual catalog records", async () => {
    render(<ProductStatusActions productId="OriginalProductID" />);
    fireEvent.click(screen.getByRole("button", { name: /^Aprobă$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmă" }));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/products/OriginalProductID/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("retains a failed rejection draft and reports the failure inside the dialog", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<ProductStatusActions productId="OriginalProductID" />);
    fireEvent.click(screen.getByRole("button", { name: /^Respinge$/ }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Motivul respingerii" }),
      { target: { value: "Date incomplete" } }
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: /^Respinge$/ }).at(-1)!
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Starea produsului nu s-a salvat"
    );
    expect(
      screen.getByRole("textbox", { name: "Motivul respingerii" })
    ).toHaveValue("Date incomplete");
    expect(mockRefresh).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
