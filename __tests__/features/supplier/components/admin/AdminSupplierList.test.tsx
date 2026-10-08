/** @jest-environment jsdom */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

import { AdminSupplierList } from "@/features/supplier/components/admin/AdminSupplierList";

import { mockSuppliers, mockSuppliersResponse } from "./supplier-list-fixture";

const originalFetch = global.fetch;
const originalScroll = Element.prototype.scrollIntoView;
const ok = (data = mockSuppliersResponse) => ({
  ok: true,
  json: () => Promise.resolve(data),
});
const api = () => global.fetch as jest.Mock;
const ready = () => screen.findByText("TechCorp Inc");
const updateButton = (action: "Aprobă" | "Respinge") =>
  screen.getByRole("button", { name: `${action} furnizorul TechCorp Inc` });
const listUrl = (params: string) => expect.stringContaining(params);

describe("AdminSupplierList", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });
  afterAll(() => {
    Element.prototype.scrollIntoView = originalScroll;
  });
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(ok());
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("should render loading state initially", () => {
    api().mockImplementation(() => new Promise(() => {}));
    render(<AdminSupplierList />);
    expect(screen.getByText("Se încarcă furnizorii…")).toBeVisible();
    expect(screen.queryByText("Total furnizori")).toBeNull();
  });

  it("should render suppliers list when data loads successfully", async () => {
    render(<AdminSupplierList />);
    await ready();
    expect(screen.getByRole("heading", { name: /^Furnizori$/ })).toBeVisible();
    expect(
      screen.getByText("Gestionează furnizorii, cererile și aprobările.")
    ).toBeVisible();
    expect(screen.getByText("Total furnizori").parentElement).toHaveTextContent(
      "3"
    );
    expect(screen.getByText("EduTools Ltd")).toBeVisible();
    expect(screen.getByText("Rejected Supplies")).toBeVisible();
  });

  it.each(["network", "http"])(
    "should display an actionable error for a %s failure",
    async kind => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      if (kind === "network")
        api().mockRejectedValue(new Error("Network error"));
      else
        api().mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        });
      render(<AdminSupplierList />);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Furnizorii nu au putut fi încărcați"
      );
      expect(screen.queryByText("Total furnizori")).toBeNull();
    }
  );

  it("should filter suppliers by search term on the server", async () => {
    render(<AdminSupplierList />);
    await ready();
    api().mockResolvedValue(
      ok({ ...mockSuppliersResponse, suppliers: [mockSuppliers[0]] })
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Caută furnizori" }), {
      target: { value: "TechCorp" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Aplică căutarea furnizorilor" })
    );
    await ready();
    expect(api()).toHaveBeenLastCalledWith(
      listUrl("search=TechCorp"),
      expect.objectContaining({ cache: "no-store" })
    );
    expect(screen.queryByText("EduTools Ltd")).toBeNull();
    expect(screen.queryByText("Rejected Supplies")).toBeNull();
  });

  it("should filter suppliers by status on the server", async () => {
    render(<AdminSupplierList />);
    await ready();
    api().mockResolvedValue(
      ok({ ...mockSuppliersResponse, suppliers: [mockSuppliers[1]] })
    );
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Filtrează furnizorii după stare" }),
      { key: "ArrowDown" }
    );
    fireEvent.click(await screen.findByRole("option", { name: "Aprobat" }));
    await screen.findByText("EduTools Ltd");
    expect(api()).toHaveBeenLastCalledWith(
      listUrl("status=APPROVED"),
      expect.any(Object)
    );
    expect(screen.queryByText("TechCorp Inc")).toBeNull();
  });

  it("should sort suppliers by company name on the server", async () => {
    render(<AdminSupplierList />);
    await ready();
    api().mockResolvedValue(
      ok({
        ...mockSuppliersResponse,
        suppliers: [mockSuppliers[1], mockSuppliers[2], mockSuppliers[0]],
      })
    );
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Ordonează furnizorii după" }),
      { key: "ArrowDown" }
    );
    fireEvent.click(
      await screen.findByRole("option", { name: "Numele firmei" })
    );
    await ready();
    expect(api()).toHaveBeenLastCalledWith(
      listUrl("sortBy=companyName"),
      expect.any(Object)
    );
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("EduTools Ltd");
    expect(screen.getAllByRole("row")[2]).toHaveTextContent(
      "Rejected Supplies"
    );
  });

  it("should toggle sort order", async () => {
    render(<AdminSupplierList />);
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "↓ Descrescător" }));
    await ready();
    expect(screen.getByRole("button", { name: "↑ Crescător" })).toBeVisible();
    expect(api()).toHaveBeenLastCalledWith(
      listUrl("sortOrder=asc"),
      expect.any(Object)
    );
  });

  it("should show approve/reject buttons for pending suppliers", async () => {
    render(<AdminSupplierList />);
    await ready();
    expect(updateButton("Aprobă")).toBeEnabled();
    expect(updateButton("Respinge")).toBeEnabled();
  });

  it("should not show action buttons for non-pending suppliers", async () => {
    render(<AdminSupplierList />);
    await ready();
    const row = screen.getByRole("row", { name: /EduTools Ltd/ });
    expect(
      within(row).queryByRole("button", { name: /Aprobă|Respinge/ })
    ).toBeNull();
    expect(
      within(row).getByRole("link", { name: "Vezi furnizorul EduTools Ltd" })
    ).toHaveAttribute("href", "/admin/suppliers/supplier-2");
  });

  it.each([
    ["Aprobă", "APPROVED"],
    ["Respinge", "REJECTED"],
  ] as const)("should %s supplier successfully", async (action, status) => {
    render(<AdminSupplierList />);
    await ready();
    api()
      .mockResolvedValueOnce(ok())
      .mockResolvedValue(
        ok({
          ...mockSuppliersResponse,
          suppliers: mockSuppliers.map(s =>
            s.id === "supplier-1" ? { ...s, status } : s
          ),
        })
      );
    fireEvent.click(updateButton(action));
    await ready();
    expect(api()).toHaveBeenCalledWith(
      "/api/admin/suppliers/supplier-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ status }),
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Aprobă furnizorul TechCorp Inc" })
      ).toBeNull()
    );
  });

  it.each(["http", "network"])(
    "should retain supplier records after a %s status-update failure",
    async kind => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      render(<AdminSupplierList />);
      await ready();
      if (kind === "http")
        api().mockResolvedValueOnce({ ok: false, status: 500 });
      else api().mockRejectedValueOnce(new Error("Network error"));
      fireEvent.click(updateButton("Aprobă"));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Starea furnizorului nu s-a actualizat"
      );
      expect(screen.getByText("TechCorp Inc")).toBeVisible();
      expect(updateButton("Aprobă")).toBeEnabled();
    }
  );

  it("should refresh suppliers list when refresh button is clicked", async () => {
    render(<AdminSupplierList />);
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Actualizează" }));
    await ready();
    expect(api()).toHaveBeenCalledTimes(2);
  });

  it("should display empty state when the server finds no suppliers", async () => {
    render(<AdminSupplierList />);
    await ready();
    api().mockResolvedValue(
      ok({
        ...mockSuppliersResponse,
        suppliers: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      })
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Caută furnizori" }), {
      target: { value: "nonexistent" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Aplică căutarea furnizorilor" })
    );
    expect(
      await screen.findByText("Nu există furnizori pentru filtrele alese.")
    ).toBeVisible();
  });

  it("should display status badges correctly", async () => {
    render(<AdminSupplierList />);
    await ready();
    const table = within(screen.getByRole("table"));
    for (const status of ["În așteptarea verificării", "Aprobat", "Respins"])
      expect(table.getByText(status)).toBeVisible();
  });

  it("should display supplier details correctly", async () => {
    render(<AdminSupplierList />);
    await ready();
    for (const email of [
      "john@techcorp.com",
      "jane@edutools.com",
      "bob@rejected.com",
    ])
      expect(screen.getByText(email)).toBeVisible();
    expect(screen.getByText("Electronics")).toBeVisible();
    expect(screen.getByText("STEM Kits")).toBeVisible();
    expect(
      screen.getByText(new Date("2024-01-01").toLocaleDateString("ro-RO"))
    ).toBeVisible();
  });
});
