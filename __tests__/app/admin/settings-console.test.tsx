import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SettingsConsole } from "@/app/admin/settings/components/settings-console";
import { settingsDefaults } from "@/lib/admin/settings-view";

const initial = {
  ...settingsDefaults(),
  id: "settings",
  updatedAt: "2026-10-08T09:00:00.000Z",
  source: "database",
  history: [],
  backups: [],
  integrations: { stripe: "missing", email: false, fanCourier: false },
};
const originalFetch = global.fetch;
const response = (body: unknown, ok = true) => ({
  ok,
  json: () => Promise.resolve(body),
});
describe("premium settings editing", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(response(initial));
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("sends the edited value, waits for persistence and displays the saved result", async () => {
    render(<SettingsConsole />);
    const name = await screen.findByLabelText("Numele magazinului");
    fireEvent.change(name, { target: { value: "Magazinul meu" } });
    (global.fetch as jest.Mock).mockResolvedValue(
      response({
        ...initial,
        storeName: "Magazinul meu",
        updatedAt: "2026-10-08T09:01:00.000Z",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvează modificările" })
    );
    await screen.findByText("Modificările au fost salvate.");
    const [, options] = (global.fetch as jest.Mock).mock.calls[1];
    expect(JSON.parse(options.body)).toMatchObject({
      storeName: "Magazinul meu",
      expectedUpdatedAt: initial.updatedAt,
    });
    expect(screen.getByLabelText("Numele magazinului")).toHaveValue(
      "Magazinul meu"
    );
    expect(
      screen.getByRole("button", { name: "Salvează modificările" })
    ).toBeDisabled();
  });
  it("retains edits and gives an explicit conflict error when saving fails", async () => {
    render(<SettingsConsole />);
    fireEvent.change(await screen.findByLabelText("Numele magazinului"), {
      target: { value: "Nesalvat" },
    });
    (global.fetch as jest.Mock).mockResolvedValue(
      response({ error: "Setările au fost modificate în altă sesiune." }, false)
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvează modificările" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("altă sesiune");
    expect(screen.getByLabelText("Numele magazinului")).toHaveValue("Nesalvat");
    expect(screen.queryByText("Modificările au fost salvate.")).toBeNull();
  });
  it("protects unsaved edits when switching settings sections", async () => {
    render(<SettingsConsole />);
    fireEvent.change(await screen.findByLabelText("Numele magazinului"), {
      target: { value: "Nesalvat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Livrare Tarife/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Ai modificări nesalvate"
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuă editarea" }));
    expect(screen.getByLabelText("Numele magazinului")).toHaveValue("Nesalvat");
  });
  it("does not expose decorative payment, MFA or health controls", async () => {
    render(<SettingsConsole />);
    await screen.findByLabelText("Numele magazinului");
    fireEvent.click(
      screen.getByRole("button", { name: /Acces și integrări Servicii/ })
    );
    await screen.findByText(/Autentificarea în doi pași nu este disponibilă/);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText("SUCCESS")).toBeNull();
  });
  it("shows unavailable settings instead of editable defaults after a failed load", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({}, false));
    render(<SettingsConsole />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "nu au putut fi încărcate"
    );
    expect(screen.queryByLabelText("Numele magazinului")).toBeNull();
  });
  it("shows an honest empty audit history", async () => {
    render(<SettingsConsole />);
    await screen.findByLabelText("Numele magazinului");
    fireEvent.click(
      screen.getByRole("button", { name: /Copii și istoric Recuperare/ })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Nu există încă modificări înregistrate/)
      ).toBeVisible()
    );
    expect(screen.queryByText("2 hours ago")).toBeNull();
  });
});
