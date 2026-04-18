import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CodRambursConsentPanel } from "@/features/checkout/components/cod-panels/CodRambursConsentPanel";
import { I18nProvider } from "@/lib/i18n";

describe("CodRambursConsentPanel", () => {
  it("renders key COD information blocks", () => {
    render(
      <I18nProvider initialLanguage="ro">
        <CodRambursConsentPanel
          codConsentAccepted={false}
          onCodConsentChange={jest.fn()}
          onAcceptClearError={jest.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Ramburs — plătești la livrare/i)).toBeInTheDocument();
    expect(screen.getByText(/Plătești la curier/i)).toBeInTheDocument();
    expect(screen.getByText("Reținem doar transportul tur")).toBeInTheDocument();
  });

  it("calls onCodConsentChange when checkbox toggled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <I18nProvider initialLanguage="ro">
        <CodRambursConsentPanel
          codConsentAccepted={false}
          onCodConsentChange={onChange}
          onAcceptClearError={jest.fn()}
        />
      </I18nProvider>
    );

    const box = screen.getByRole("checkbox", { name: /Confirm că am citit/i });
    await user.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("invokes onAcceptClearError when accepting", async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();

    render(
      <I18nProvider initialLanguage="ro">
        <CodRambursConsentPanel
          codConsentAccepted={false}
          onCodConsentChange={jest.fn()}
          onAcceptClearError={onClear}
        />
      </I18nProvider>
    );

    await user.click(screen.getByRole("checkbox", { name: /Confirm că am citit/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
