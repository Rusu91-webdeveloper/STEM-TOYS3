"use client";

import React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

import { ShippingAddress } from "../types";
import { ShippingAddressForm } from "./ShippingAddressForm";

interface BillingAddressFormProps {
  useSameAddress: boolean;
  onUseSameAddressChange: (checked: boolean) => void;
  showBillingForm: boolean;
  currentBillingAddress?: ShippingAddress;
  shippingAddress?: ShippingAddress;
  onBillingAddressChange: (address: ShippingAddress) => void;
}

export const BillingAddressForm = React.memo(function BillingAddressForm({
  useSameAddress,
  onUseSameAddressChange,
  showBillingForm,
  currentBillingAddress,
  shippingAddress,
  onBillingAddressChange,
}: BillingAddressFormProps) {
  const { t } = useTranslation();

  const handleCheckboxChange = (checked: boolean) => {
    onUseSameAddressChange(checked);
  };

  return (
    <>
      {/* Billing Address Checkbox */}
      <div className="flex items-center space-x-2 mt-6 mb-4">
        <Checkbox
          id="billing-same"
          checked={useSameAddress}
          onCheckedChange={handleCheckboxChange}
        />
        <Label
          htmlFor="billing-same"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("sameAsShipping", "Aceeași ca adresa de livrare")}
        </Label>
      </div>

      {/* Billing Address Form */}
      {showBillingForm && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              {t("billingAddress", "Adresa de facturare")}
            </h3>
          </div>
          <ShippingAddressForm
            initialData={currentBillingAddress}
            onSubmit={onBillingAddressChange}
          />
        </div>
      )}
    </>
  );
});
