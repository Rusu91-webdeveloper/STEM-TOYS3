import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { mockSuppliersResponse } from "@/__tests__/features/supplier/components/admin/supplier-list-fixture";
import { AdminSupplierList } from "@/features/supplier/components/admin/AdminSupplierList";
const originalFetch = global.fetch;
const ok = () => ({
  ok: true,
  json: () => Promise.resolve(mockSuppliersResponse),
});
const api = () => global.fetch as jest.Mock;
const ready = () => screen.findByText("TechCorp Inc");
const updateButton = (action: "Aprobă" | "Respinge") =>
  screen.getByRole("button", { name: `${action} furnizorul TechCorp Inc` });
describe("Supplier action boundaries", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(ok());
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("selects only pending suppliers from the current page", async () => {
    render(<AdminSupplierList />);
    await ready();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Selectează furnizorii în așteptare de pe pagină",
      })
    );
    expect(
      screen.getByRole("checkbox", { name: "Selectează TechCorp Inc" })
    ).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Acțiuni pentru selecție (1)" })
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Selectează furnizorii în așteptare de pe pagină",
      })
    );
    expect(
      screen.queryByRole("button", { name: /Acțiuni pentru selecție/ })
    ).toBeNull();
  });

  it("disables conflicting actions and filters during a status submission", async () => {
    render(<AdminSupplierList />);
    await ready();
    let finish!: (value: ReturnType<typeof ok>) => void;
    api().mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    fireEvent.click(updateButton("Aprobă"));
    expect(updateButton("Respinge")).toBeDisabled();
    expect(
      screen.getByRole("combobox", { name: "Filtrează furnizorii după stare" })
    ).toBeDisabled();
    fireEvent.click(updateButton("Aprobă"));
    expect(api()).toHaveBeenCalledTimes(2);
    finish(ok());
    await ready();
    await waitFor(() => expect(updateButton("Aprobă")).toBeEnabled());
  });
});
