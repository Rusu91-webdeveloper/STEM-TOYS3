import { createCheckoutAddressValidator } from "@/features/checkout/lib/checkout-address-schema";
import { en } from "@/lib/i18n/translations/en";
import { ro } from "@/lib/i18n/translations/ro";

const romanianMessages = {
  fullNameRequired: ro.addressFullNameRequired,
  streetRequired: ro.addressStreetRequired,
  streetNumberRequired: ro.addressStreetNumberRequired,
  cityRequired: ro.addressCityRequired,
  stateRequired: ro.addressStateRequired,
  countryRequired: ro.addressCountryRequired,
  postalCodeRequired: ro.addressPostalCodeRequired,
  phoneRequired: ro.addressPhoneRequired,
  romanianPostalCode: ro.addressRomanianPostalCode,
  romanianPhone: ro.addressRomanianPhone,
};

const englishMessages = {
  fullNameRequired: en.addressFullNameRequired,
  streetRequired: en.addressStreetRequired,
  streetNumberRequired: en.addressStreetNumberRequired,
  cityRequired: en.addressCityRequired,
  stateRequired: en.addressStateRequired,
  countryRequired: en.addressCountryRequired,
  postalCodeRequired: en.addressPostalCodeRequired,
  phoneRequired: en.addressPhoneRequired,
  romanianPostalCode: en.addressRomanianPostalCode,
  romanianPhone: en.addressRomanianPhone,
};

describe("checkout address validation copy", () => {
  it("uses the Romanian county message when the locale is ro", () => {
    const validator = createCheckoutAddressValidator(romanianMessages, false);
    expect(validator.validateField("state", "")).toBe(
      "Județul este obligatoriu"
    );
    expect(validator.validateField("city", "A")).toBe(
      "Orașul este obligatoriu"
    );
  });

  it("keeps the English county message when the locale is en", () => {
    const validator = createCheckoutAddressValidator(englishMessages, false);
    expect(validator.validateField("state", "")).toBe("State is required");
  });

  it("rejects a short phone with the localized message", () => {
    const validator = createCheckoutAddressValidator(romanianMessages, true);
    expect(validator.validateField("phone", "12")).toBe(
      "Numărul de telefon este obligatoriu"
    );
  });
});
