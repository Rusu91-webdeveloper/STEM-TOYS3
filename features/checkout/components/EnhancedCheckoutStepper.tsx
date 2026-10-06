"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CheckoutData, CheckoutStep } from "../types";

/** Address and courier selection are two parts of the same delivery stage. */
export function EnhancedCheckoutStepper({
  currentStep,
  checkoutData,
  onStepChange,
}: {
  currentStep: CheckoutStep;
  checkoutData: CheckoutData;
  onStepChange?: (step: CheckoutStep) => void;
}) {
  const active =
    currentStep === "review" ? 2 : currentStep === "payment" ? 1 : 0;
  const steps = [
    { label: "Livrare", target: "shipping-address" as const },
    { label: "Plată", target: "payment" as const },
    { label: "Verificare", target: "review" as const },
  ];

  return (
    <nav aria-label="Pașii comenzii" className="border-b border-slate-200 pb-4">
      <ol className="flex items-center gap-3 sm:gap-6">
        {steps.map((step, index) => {
          const canEdit =
            index < active &&
            (index === 0 || Boolean(checkoutData.shippingMethod));
          return (
            <li key={step.label} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!canEdit || !onStepChange}
                onClick={() => onStepChange?.(step.target)}
                aria-current={index === active ? "step" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 text-xs font-semibold sm:text-sm",
                  index === active ? "text-slate-900" : "text-slate-500",
                  canEdit && "hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    index === active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {index < active ? <Check size={14} aria-hidden /> : index + 1}
                </span>
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
