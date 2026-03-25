"use client";

import { FileText, MapPinHouse } from "lucide-react";
import React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { checkoutCardClass } from "@/features/checkout/lib/checkoutTheme";
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

export const BillingAddressForm = React.memo(
  ({
    useSameAddress,
    onUseSameAddressChange,
    showBillingForm,
    currentBillingAddress,
    shippingAddress: _shippingAddress,
    onBillingAddressChange,
  }: BillingAddressFormProps) => {
    const { t } = useTranslation();

    const handleCheckboxChange = (checked: boolean) => {
      onUseSameAddressChange(checked);
    };

    return (
      <>
        <div className={`${checkoutCardClass} mt-6 p-4`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {t("billingAddressTitle", "Adresa de facturare")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {t(
                  "billingAddressHint",
                  "Poți folosi aceeași adresă ca pentru livrare sau poți adăuga una separată pentru facturare."
                )}
              </p>
            </div>
          </div>

          <label
            htmlFor="billing-same"
            className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <Checkbox
              id="billing-same"
              checked={useSameAddress}
              onCheckedChange={handleCheckboxChange}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <Label
                htmlFor="billing-same"
                className="text-sm font-medium leading-6 text-slate-900"
              >
                {t("sameAsShipping", "Aceeași ca adresa de livrare")}
              </Label>
              <p className="text-xs leading-5 text-slate-400">
                {t(
                  "billingAddressToggleHelp",
                  "Debifează doar dacă ai nevoie de date diferite pentru factură."
                )}
              </p>
            </div>
          </label>
        </div>

        {showBillingForm && (
          <div className={`${checkoutCardClass} mt-4 p-4 sm:p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <MapPinHouse className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {t("billingAddress", "Adresa de facturare")}
                </h3>
                <p className="text-sm text-slate-400">
                  {t(
                    "billingAddressFormHint",
                    "Completează datele care trebuie să apară pe documentele fiscale."
                  )}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <h4 className="sr-only">
                {t("billingAddress", "Adresa de facturare")}
              </h4>
              <ShippingAddressForm
                initialData={currentBillingAddress}
                onSubmit={onBillingAddressChange}
                allowInternational={true}
              />
            </div>
          </div>
        )}
      </>
    );
  }
);

BillingAddressForm.displayName = "BillingAddressForm";
