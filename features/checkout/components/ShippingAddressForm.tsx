"use client";

import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";

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
import { createFormValidator } from "@/lib/formValidation";
import { useTranslation } from "@/lib/i18n";
import { addressSchema } from "@/lib/validations";
import { glassCardClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

import { ShippingAddress } from "../types";

interface Address {
  id: string;
  name: string;
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
}

// Create a form validator using our address schema
const addressValidator = createFormValidator(addressSchema);

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

export function ShippingAddressForm({
  initialData,
  onSubmit,
}: ShippingAddressFormProps) {
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState<ShippingAddress>(
    initialData || {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "RO", // Default to Romania
      phone: "",
    }
  );

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
            const shippingAddress: ShippingAddress = {
              fullName: defaultAddress.fullName,
              addressLine1: defaultAddress.addressLine1,
              addressLine2: defaultAddress.addressLine2 || "",
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country,
              phone: defaultAddress.phone,
            };
            setFormData(shippingAddress);
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [initialData]);

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

    // Validate the entire form
    const validation = addressValidator.validateForm(formData);

    if (validation.success) {
      onSubmit(formData);
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
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "RO",
        phone: "",
      });
    } else {
      // Find the selected address and populate the form
      const selectedAddress = savedAddresses.find(
        addr => addr.id === addressId
      );
      if (selectedAddress) {
        const shippingAddress: ShippingAddress = {
          fullName: selectedAddress.fullName,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
        };
        setFormData(shippingAddress);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`${glassCardClass} border-white/10 bg-slate-900/70 p-6 text-slate-100 shadow-lg shadow-black/20`}
        >
        <h2 className="text-xl font-semibold mb-4 text-slate-100">{t("shippingAddress")}</h2>

        <div className="mb-4 rounded-md border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-100">
          {t("deliveryOnlyRomania")}
        </div>

        {isLoadingAddresses ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
          </div>
        ) : savedAddresses.length > 0 ? (
          <div className="mb-6">
            <Label className="mb-3 block text-base font-semibold text-slate-100">
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
                        className="cursor-pointer font-semibold text-slate-100"
                      >
                        {address.name}{" "}
                        {address.isDefault && (
                          <span className="ml-2 rounded border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-xs text-sky-100">
                            Default
                          </span>
                        )}
                      </Label>
                      <div className="mt-1 space-y-0.5 text-sm text-slate-300">
                        <div>{address.fullName}</div>
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
                  className="cursor-pointer font-semibold text-slate-100"
                >
                  Use a new address
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : null}

        {selectedAddressId === "new" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-slate-200">
                {t("fullName")}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={cn(
                  "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400",
                  errors.fullName && "border-red-500"
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine1" className="text-slate-200">
                {t("addressLine1")}
              </Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className={cn(
                  "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400",
                  errors.addressLine1 && "border-red-500"
                )}
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.addressLine1}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine2" className="text-slate-200">
                {t("addressLine2")}
              </Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2 || ""}
                onChange={handleChange}
                className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-slate-200">
                  {t("city")}
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={cn(
                    "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400",
                    errors.city && "border-red-500"
                  )}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-400">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state" className="text-slate-200">
                  {t("state")}
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={value => handleSelectChange("state", value)}
                >
                  <SelectTrigger
                    className={cn(
                      "border-white/10 bg-white/5 text-slate-100",
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
                {errors.state && (
                  <p className="mt-1 text-sm text-red-400">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode" className="text-slate-200">
                  {t("postalCode")}
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={cn(
                    "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400",
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
                <Label htmlFor="country" className="text-slate-200">
                  {t("country")}
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={value => handleSelectChange("country", value)}
                  disabled={true}
                >
                  <SelectTrigger
                    className={cn(
                      "border-white/10 bg-white/5 text-slate-100 data-[placeholder]:text-slate-400",
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
                {errors.country && (
                  <p className="mt-1 text-sm text-red-400">{errors.country}</p>
                )}
              </div>
            </div>

            <div>
                <Label htmlFor="phone" className="text-slate-200">
                  {t("phone")}
                </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={cn(
                  "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400",
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
