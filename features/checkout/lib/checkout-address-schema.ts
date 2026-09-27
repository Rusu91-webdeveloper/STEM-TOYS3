import { z } from "zod";

import { createFormValidator } from "@/lib/formValidation";

export interface CheckoutAddressValidationMessages {
  fullNameRequired: string;
  streetRequired: string;
  streetNumberRequired: string;
  cityRequired: string;
  stateRequired: string;
  countryRequired: string;
  postalCodeRequired: string;
  phoneRequired: string;
  romanianPostalCode: string;
  romanianPhone: string;
}

const optionalStructuredField = (maxLength = 64) =>
  z.preprocess(
    value =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().max(maxLength).optional()
  );

function checkoutAddressShape(messages: CheckoutAddressValidationMessages) {
  return {
    companyName: optionalStructuredField(128),
    cui: optionalStructuredField(64),
    fullName: z.string().trim().min(2, messages.fullNameRequired),
    street: z.string().trim().min(2, messages.streetRequired),
    streetNumber: z.string().trim().min(1, messages.streetNumberRequired),
    block: optionalStructuredField(32),
    entrance: optionalStructuredField(32),
    floor: optionalStructuredField(32),
    apartment: optionalStructuredField(32),
    addressDetails: optionalStructuredField(200),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().trim().min(2, messages.cityRequired),
    state: z.string().trim().min(1, messages.stateRequired),
    postalCode: z.string().trim(),
    country: z.string().trim().min(2, messages.countryRequired),
    phone: z.string().trim(),
  };
}

export function createCheckoutAddressValidator(
  messages: CheckoutAddressValidationMessages,
  international: boolean
) {
  const base = checkoutAddressShape(messages);
  const schema = international
    ? z.object({
        ...base,
        postalCode: z.string().trim().min(2, messages.postalCodeRequired),
        phone: z.string().trim().min(6, messages.phoneRequired),
      })
    : z.object({
        ...base,
        postalCode: z
          .string()
          .trim()
          .regex(/^\d{6}$/, messages.romanianPostalCode),
        phone: z
          .string()
          .trim()
          .regex(/^(07\d{8}|\+407\d{8}|0\d{9})$/, messages.romanianPhone),
      });

  return createFormValidator(schema);
}
