/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

import { getTranslations, I18nProvider, useTranslation } from "@/lib/i18n";

jest.mock("cookies-next", () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
}));
jest.mock("@/lib/i18n/translations", () => ({
  translations: {
    ro: { label: "Livrare", empty: "", error: { title: "Eroare" } },
    en: {
      label: "Delivery",
      empty: "Empty fallback",
      englishOnly: "English fallback",
      error: { title: "Error" },
    },
  },
}));

it("preserves translated text and empty strings", () => {
  const { t } = getTranslations("ro");
  expect(t("label")).toBe("Livrare");
  expect(t("empty", "Default")).toBe("");
});

it("uses English fallback for missing keys and unsupported locales", () => {
  expect(getTranslations("ro").t("englishOnly")).toBe("English fallback");
  expect(getTranslations("unsupported").t("label")).toBe("Delivery");
});

it("never returns nested objects or inherited functions as UI text", () => {
  const { t } = getTranslations("ro");
  expect(t("error", "Default error")).toBe("Default error");
  expect(t("constructor", "Fallback")).toBe("Fallback");
  expect(t("missing")).toBe("missing");
});

function TranslationProbe() {
  const { t } = useTranslation();
  return (
    <div>
      <span>{t("label")}</span>
      <span>{t("englishOnly")}</span>
      <span>{t("error", "Default error")}</span>
    </div>
  );
}

it("renders valid text through the client provider when a key is an object", () => {
  render(
    <I18nProvider initialLanguage="ro">
      <TranslationProbe />
    </I18nProvider>
  );
  expect(screen.getByText("Livrare")).toBeInTheDocument();
  expect(screen.getByText("English fallback")).toBeInTheDocument();
  expect(screen.getByText("Default error")).toBeInTheDocument();
});
