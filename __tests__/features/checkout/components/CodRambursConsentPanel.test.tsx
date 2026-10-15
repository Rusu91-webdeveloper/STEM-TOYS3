import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CodRambursConsentPanel } from "@/features/checkout/components/cod-panels/CodRambursConsentPanel";
import { COD_CONSENT_TEXT } from "@/lib/checkout/cod-consent";
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

    expect(
      screen.getByText(/Ramburs — plătești la livrare/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Plătești la curier/i)).toBeInTheDocument();
    expect(
      screen.getByText("Garanție pentru transportul tur")
    ).toBeInTheDocument();
  });

  it("keeps the complete agreement available without expanding it by default", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLanguage="ro">
        <CodRambursConsentPanel
          codConsentAccepted={false}
          onCodConsentChange={jest.fn()}
          onAcceptClearError={jest.fn()}
        />
      </I18nProvider>
    );

    const disclosure = screen.getByRole("button", {
      name: /Condiții ramburs/i,
    });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(COD_CONSENT_TEXT)).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    await user.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(COD_CONSENT_TEXT)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Politica de retur/i })
    ).toHaveAttribute("href", "/returns");
    await user.click(disclosure);
    expect(screen.queryByText(COD_CONSENT_TEXT)).not.toBeInTheDocument();
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

    await user.click(
      screen.getByRole("checkbox", { name: /Confirm că am citit/i })
    );
    expect(onClear).toHaveBeenCalled();
  });
});
