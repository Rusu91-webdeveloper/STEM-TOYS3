"use client";

import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkoutCardClass } from "@/features/checkout/lib/checkoutTheme";
import { createFormValidator } from "@/lib/formValidation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { ShippingAddress } from "../types";

interface Address {
  id: string;
  name: string;
  companyName?: string;
  cui?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface ShippingAddressFormProps {
  initialData?: ShippingAddress;
  onSubmit: (address: ShippingAddress) => void;
  allowInternational?: boolean;
}

const optionalStructuredField = (maxLength = 64) =>
  z.preprocess(
    value =>
      typeof value === "string" && value.trim().length === 0 ? undefined : value,
    z.string().max(maxLength).optional()
  );

const checkoutAddressSchemaBase = {
  companyName: optionalStructuredField(128),
  cui: optionalStructuredField(64),
  fullName: z.string().trim().min(2, "Full name is required"),
  street: z.string().trim().min(2, "Street is required"),
  streetNumber: z.string().trim().min(1, "Street number is required"),
  block: optionalStructuredField(32),
  entrance: optionalStructuredField(32),
  floor: optionalStructuredField(32),
  apartment: optionalStructuredField(32),
  addressDetails: optionalStructuredField(200),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim(),
  country: z.string().trim().min(2, "Country is required"),
  phone: z.string().trim(),
};

const checkoutRomanianAddressSchema = z.object({
  ...checkoutAddressSchemaBase,
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Please enter a valid Romanian postal code (6 digits)"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(07\d{8}|\+407\d{8}|0\d{9})$/,
      "Please enter a valid Romanian phone number"
    ),
});

const checkoutInternationalAddressSchema = z.object({
  ...checkoutAddressSchemaBase,
  postalCode: z.string().trim().min(2, "Postal code is required"),
  phone: z.string().trim().min(6, "Phone number is required"),
});

const romanianAddressValidator = createFormValidator(checkoutRomanianAddressSchema);
const internationalAddressValidator = createFormValidator(
  checkoutInternationalAddressSchema
);

// Romanian counties
const romanianCounties = [
  { code: "AB", name: "Alba" },
  { code: "AR", name: "Arad" },
  { code: "AG", name: "Argeș" },
  { code: "BC", name: "Bacău" },
  { code: "BH", name: "Bihor" },
  { code: "BN", name: "Bistrița-Năsăud" },
  { code: "BT", name: "Botoșani" },
  { code: "BV", name: "Brașov" },
  { code: "BR", name: "Brăila" },
  { code: "B", name: "București" },
  { code: "BZ", name: "Buzău" },
  { code: "CS", name: "Caraș-Severin" },
  { code: "CL", name: "Călărași" },
  { code: "CJ", name: "Cluj" },
  { code: "CT", name: "Constanța" },
  { code: "CV", name: "Covasna" },
  { code: "DB", name: "Dâmbovița" },
  { code: "DJ", name: "Dolj" },
  { code: "GL", name: "Galați" },
  { code: "GR", name: "Giurgiu" },
  { code: "GJ", name: "Gorj" },
  { code: "HR", name: "Harghita" },
  { code: "HD", name: "Hunedoara" },
  { code: "IL", name: "Ialomița" },
  { code: "IS", name: "Iași" },
  { code: "IF", name: "Ilfov" },
  { code: "MM", name: "Maramureș" },
  { code: "MH", name: "Mehedinți" },
  { code: "MS", name: "Mureș" },
  { code: "NT", name: "Neamț" },
  { code: "OT", name: "Olt" },
  { code: "PH", name: "Prahova" },
  { code: "SM", name: "Satu Mare" },
  { code: "SJ", name: "Sălaj" },
  { code: "SB", name: "Sibiu" },
  { code: "SV", name: "Suceava" },
  { code: "TR", name: "Teleorman" },
  { code: "TM", name: "Timiș" },
  { code: "TL", name: "Tulcea" },
  { code: "VS", name: "Vaslui" },
  { code: "VL", name: "Vâlcea" },
  { code: "VN", name: "Vrancea" },
];

// Only Romania is available for shipping
const countries = [{ code: "RO", name: "România" }];

const parseStreetFromLegacyAddress = (
  line1: string,
  line2?: string,
  city?: string
): Pick<
  ShippingAddress,
  "street" | "streetNumber" | "block" | "entrance" | "floor" | "apartment" | "addressDetails"
> => {
  const cleanedCity = (city || "").trim().toLowerCase();
  const firstPart = line1
    .split(",")
    .map(part => part.trim())
    .filter(Boolean)
    .find(part => part.toLowerCase() !== cleanedCity) || line1.trim();

  const streetNoMatch = firstPart.match(
    /^(.*?)(?:\s+(?:nr\.?|no\.?)?\s*(\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?))$/i
  );
  const street = (streetNoMatch?.[1] || firstPart).trim();
  const streetNumber =
    (streetNoMatch?.[2] || "").replace(/\s+/g, "") ||
    ((line2 || "").trim().match(/^\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?$/)?.[0] ??
      "");

  const detailsSource = [line1, line2 || ""].join(", ");
  const block = detailsSource.match(/\b(?:bl(?:oc)?\.?)\s*([a-zA-Z0-9\-\/]+)/i)?.[1];
  const entrance = detailsSource.match(
    /\b(?:sc(?:ara)?\.?|entr(?:are)?\.?)\s*([a-zA-Z0-9\-\/]+)/i
  )?.[1];
  const floor = detailsSource.match(/\b(?:et(?:aj)?\.?|floor)\s*([a-zA-Z0-9\-\/]+)/i)?.[1];
  const apartment = detailsSource.match(
    /\b(?:ap(?:t|artament)?\.?)\s*([a-zA-Z0-9\-\/]+)/i
  )?.[1];

  let addressDetails = (line2 || "").trim();
  if (addressDetails) {
    addressDetails = addressDetails
      .replace(/\b(?:bl(?:oc)?\.?)\s*[a-zA-Z0-9\-\/]+/gi, "")
      .replace(/\b(?:sc(?:ara)?\.?|entr(?:are)?\.?)\s*[a-zA-Z0-9\-\/]+/gi, "")
      .replace(/\b(?:et(?:aj)?\.?|floor)\s*[a-zA-Z0-9\-\/]+/gi, "")
      .replace(/\b(?:ap(?:t|artament)?\.?)\s*[a-zA-Z0-9\-\/]+/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
  }

  return {
    street,
    streetNumber: streetNumber || undefined,
    block: block || undefined,
    entrance: entrance || undefined,
    floor: floor || undefined,
    apartment: apartment || undefined,
    addressDetails: addressDetails || undefined,
  };
};

const composeLegacyAddressLines = (address: ShippingAddress): ShippingAddress => {
  const street = (address.street || "").trim();
  const streetNumber = (address.streetNumber || "").trim();
  const block = (address.block || "").trim();
  const entrance = (address.entrance || "").trim();
  const floor = (address.floor || "").trim();
  const apartment = (address.apartment || "").trim();
  const addressDetails = (address.addressDetails || "").trim();

  const addressLine1 = [street, streetNumber].filter(Boolean).join(" ").trim();
  const line2Parts = [
    block ? `Bl. ${block}` : null,
    entrance ? `Sc. ${entrance}` : null,
    floor ? `Et. ${floor}` : null,
    apartment ? `Ap. ${apartment}` : null,
    addressDetails || null,
  ].filter(Boolean) as string[];

  return {
    ...address,
    addressLine1,
    addressLine2: line2Parts.length > 0 ? line2Parts.join(", ") : undefined,
  };
};

const mapSavedAddressToCheckout = (
  address: Address,
  fallbackCountry: string
): ShippingAddress => {
  const parsed = parseStreetFromLegacyAddress(
    address.addressLine1,
    address.addressLine2,
    address.city
  );
  return {
    companyName: address.companyName || "",
    cui: address.cui || "",
    fullName: address.fullName,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || "",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country || fallbackCountry,
    phone: address.phone,
    street: parsed.street,
    streetNumber: parsed.streetNumber,
    block: parsed.block,
    entrance: parsed.entrance,
    floor: parsed.floor,
    apartment: parsed.apartment,
    addressDetails: parsed.addressDetails,
  };
};

export function ShippingAddressForm({
  initialData,
  onSubmit,
  allowInternational = false,
}: ShippingAddressFormProps) {
  const { t, locale } = useTranslation();
  const defaultCountry = allowInternational ? "" : "RO";
  const addressValidator = allowInternational
    ? internationalAddressValidator
    : romanianAddressValidator;
  const [formData, setFormData] = useState<ShippingAddress>(() => {
    if (initialData) {
      const parsed = parseStreetFromLegacyAddress(
        initialData.addressLine1,
        initialData.addressLine2,
        initialData.city
      );
      return {
        ...initialData,
        street: initialData.street || parsed.street,
        streetNumber: initialData.streetNumber || parsed.streetNumber,
        block: initialData.block || parsed.block,
        entrance: initialData.entrance || parsed.entrance,
        floor: initialData.floor || parsed.floor,
        apartment: initialData.apartment || parsed.apartment,
        addressDetails: initialData.addressDetails || parsed.addressDetails,
        country: initialData.country || defaultCountry,
      };
    }

    return {
      companyName: "",
      cui: "",
      fullName: "",
      street: "",
      streetNumber: "",
      block: "",
      entrance: "",
      floor: "",
      apartment: "",
      addressDetails: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: defaultCountry,
      phone: "",
    };
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ShippingAddress, string>>
  >({});

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Fetch user's saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch("/api/account/addresses");
        if (response.ok) {
          const addresses = await response.json();
          setSavedAddresses(addresses);

          // If there's a default address and no initialData, preselect it
          const defaultAddress = addresses.find(
            (addr: Address) => addr.isDefault
          );
          if (defaultAddress && !initialData) {
            setSelectedAddressId(defaultAddress.id);
            setFormData(mapSavedAddressToCheckout(defaultAddress, defaultCountry));
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [defaultCountry, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate field on change
    const fieldError = addressValidator.validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate field on change
    const fieldError = addressValidator.validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const composedAddress = composeLegacyAddressLines(formData);

    // Validate the entire form
    const validation = addressValidator.validateForm(composedAddress);

    if (validation.success) {
      onSubmit(composedAddress);
    } else {
      // Update errors state with validation errors
      setErrors(validation.errors || {});
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);

    if (addressId === "new") {
      // Reset form for new address
      setFormData({
        companyName: "",
        cui: "",
        fullName: "",
        street: "",
        streetNumber: "",
        block: "",
        entrance: "",
        floor: "",
        apartment: "",
        addressDetails: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: defaultCountry,
        phone: "",
      });
    } else {
      // Find the selected address and populate the form
      const selectedAddress = savedAddresses.find(
        addr => addr.id === addressId
      );
      if (selectedAddress) {
        setFormData(mapSavedAddressToCheckout(selectedAddress, defaultCountry));
      }
    }
  };

  const requiresManualAddressDetails =
    !formData.street || !formData.streetNumber;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`${checkoutCardClass} p-6 text-slate-900 shadow-sm`}
        >
        <h2 className="text-xl font-semibold mb-4 text-white">{t("shippingAddress")}</h2>

        {!allowInternational && (
          <div className="mb-4 rounded-md border border-sky-400/40 bg-sky-500/15 p-3 text-sm font-medium text-sky-200">
            {t("deliveryOnlyRomania")}
          </div>
        )}

        {isLoadingAddresses ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
          </div>
        ) : savedAddresses.length > 0 ? (
          <div className="mb-6">
            <Label className="mb-3 block text-base font-semibold text-slate-900">
              Select a saved address
            </Label>
            <RadioGroup
              value={selectedAddressId}
              onValueChange={handleAddressSelect}
              className="space-y-3"
            >
              {savedAddresses.map(address => {
                const isSelected = selectedAddressId === address.id;

                return (
                  <div
                    key={address.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition-colors duration-200",
                      isSelected
                        ? "border-sky-400 bg-sky-500/20 shadow-lg shadow-sky-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <RadioGroupItem
                      value={address.id}
                      id={`address-${address.id}`}
                      className="mt-1 border-white/40 text-sky-300"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`address-${address.id}`}
                        className="cursor-pointer font-semibold text-slate-900"
                      >
                        {address.name}{" "}
                        {address.isDefault && (
                          <span className="ml-2 rounded border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-xs text-sky-100">
                            Default
                          </span>
                        )}
                      </Label>
                      <div className="mt-1 space-y-0.5 text-sm text-slate-600">
                        <div>{address.fullName}</div>
                        {address.companyName && (
                          <div>{address.companyName}</div>
                        )}
                        {address.cui && <div>CUI: {address.cui}</div>}
                        <div>{address.addressLine1}</div>
                        {address.addressLine2 && (
                          <div>{address.addressLine2}</div>
                        )}
                        <div>
                          {address.city}, {address.state} {address.postalCode}
                        </div>
                        <div>{address.phone}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors duration-200 hover:border-white/20 hover:bg-white/10">
                <RadioGroupItem value="new" id="address-new" className="mt-1" />
                <Label
                  htmlFor="address-new"
                  className="cursor-pointer font-semibold text-slate-900"
                >
                  Use a new address
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : null}

        {(selectedAddressId === "new" || requiresManualAddressDetails) && (
          <div className="space-y-4">
            {selectedAddressId !== "new" && (
              <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                {t(
                  "completeAddressForCourier",
                  "Completează strada și numărul pentru livrare corectă prin curier."
                )}
              </div>
            )}
            <div>
              <Label htmlFor="fullName" className="font-medium text-slate-200">
                {t("fullName")}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={cn(
                  "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60 focus:ring-sky-400/20",
                  errors.fullName && "border-red-500"
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName" className="font-medium text-slate-200">
                  {t("companyNameOptional", "Company name (optional)")}
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  className={cn(
                    "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                    errors.companyName && "border-red-500"
                  )}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cui" className="font-medium text-slate-200">
                  {t("cuiOptional", "CUI/VAT (optional)")}
                </Label>
                <Input
                  id="cui"
                  name="cui"
                  value={formData.cui || ""}
                  onChange={handleChange}
                  className={cn(
                    "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                    errors.cui && "border-red-500"
                  )}
                />
                {errors.cui && (
                  <p className="mt-1 text-sm text-red-400">{errors.cui}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street" className="font-medium text-slate-200">
                  {t("streetLabel", "Stradă")}
                </Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street || ""}
                  onChange={handleChange}
                  className={cn(
                    "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                    errors.street && "border-red-500"
                  )}
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-400">{errors.street}</p>
                )}
              </div>

              <div>
                <Label htmlFor="streetNumber" className="font-medium text-slate-200">
                  {t("streetNumberLabel", "Număr")}
                </Label>
                <Input
                  id="streetNumber"
                  name="streetNumber"
                  value={formData.streetNumber || ""}
                  onChange={handleChange}
                  className={cn(
                    "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                    errors.streetNumber && "border-red-500"
                  )}
                />
                {errors.streetNumber && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.streetNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="block" className="font-medium text-slate-200">
                  {t("blockLabel", "Bloc")}
                </Label>
                <Input
                  id="block"
                  name="block"
                  value={formData.block || ""}
                  onChange={handleChange}
                  className="border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60"
                />
              </div>

              <div>
                <Label htmlFor="entrance" className="font-medium text-slate-200">
                  {t("entranceLabel", "Scară")}
                </Label>
                <Input
                  id="entrance"
                  name="entrance"
                  value={formData.entrance || ""}
                  onChange={handleChange}
                  className="border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60"
                />
              </div>

              <div>
                <Label htmlFor="floor" className="font-medium text-slate-200">
                  {t("floorLabel", "Etaj")}
                </Label>
                <Input
                  id="floor"
                  name="floor"
                  value={formData.floor || ""}
                  onChange={handleChange}
                  className="border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60"
                />
              </div>

              <div>
                <Label htmlFor="apartment" className="font-medium text-slate-200">
                  {t("apartmentLabel", "Apartament")}
                </Label>
                <Input
                  id="apartment"
                  name="apartment"
                  value={formData.apartment || ""}
                  onChange={handleChange}
                  className="border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="addressDetails" className="font-medium text-slate-200">
                {t("addressDetailsLabel", "Detalii adresă (opțional)")}
              </Label>
              <Input
                id="addressDetails"
                name="addressDetails"
                value={formData.addressDetails || ""}
                onChange={handleChange}
                placeholder={t(
                  "addressDetailsPlaceholder",
                  "Ex: Interfon 23, lângă farmacia X"
                )}
                className="border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="font-medium text-slate-200">
                  {t("city")}
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={cn(
                    "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                    errors.city && "border-red-500"
                  )}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-400">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state" className="font-medium text-slate-200">
                  {t("state")}
                </Label>
                {allowInternational ? (
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={cn(
                      "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                      errors.state && "border-red-500"
                    )}
                  />
                ) : (
                  <Select
                    value={formData.state}
                    onValueChange={value => handleSelectChange("state", value)}
                  >
                    <SelectTrigger
                      className={cn(
                        "border-white/20 bg-slate-700 text-white",
                        errors.state && "border-red-500"
                      )}
                    >
                      <SelectValue
                        placeholder={
                          locale === "ro"
                            ? "Selectează un județ"
                            : "Select a county"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {romanianCounties.map(county => (
                        <SelectItem key={county.code} value={county.code}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.state && (
                  <p className="mt-1 text-sm text-red-400">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode" className="font-medium text-slate-200">
                  {t("postalCode")}
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={cn(
                    "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                    errors.postalCode && "border-red-500"
                  )}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.postalCode}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="country" className="font-medium text-slate-200">
                  {t("country")}
                </Label>
                {allowInternational ? (
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={cn(
                      "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                      errors.country && "border-red-500"
                    )}
                  />
                ) : (
                  <Select
                    value={formData.country}
                    onValueChange={value => handleSelectChange("country", value)}
                    disabled={true}
                  >
                    <SelectTrigger
                      className={cn(
                        "border-white/20 bg-slate-700 text-white data-[placeholder]:text-slate-400",
                        errors.country && "border-red-500"
                      )}
                    >
                      <SelectValue
                        placeholder={
                          locale === "ro"
                            ? "Selectează o țară"
                            : "Select a country"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.country && (
                  <p className="mt-1 text-sm text-red-400">{errors.country}</p>
                )}
              </div>
            </div>

            <div>
                <Label htmlFor="phone" className="font-medium text-slate-200">
                  {t("phone")}
                </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={cn(
                  "border-white/20 bg-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400/60",
                  errors.phone && "border-red-500"
                )}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="px-8 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition hover:from-sky-400 hover:via-indigo-400 hover:to-purple-400"
        >
          {t("continueToShipping")}
        </Button>
      </div>
    </form>
  );
}
