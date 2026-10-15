"use client";

import { Banknote, ShieldCheck } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { COD_CONSENT_TEXT } from "@/lib/checkout/cod-consent";
import { useTranslation } from "@/lib/i18n";

interface CodRambursConsentPanelProps {
  codConsentAccepted: boolean;
  onCodConsentChange: (accepted: boolean) => void;
  onAcceptClearError: () => void;
}

export function CodRambursConsentPanel({
  codConsentAccepted,
  onCodConsentChange,
  onAcceptClearError,
}: CodRambursConsentPanelProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="cod-consent-title"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <h3
        id="cod-consent-title"
        className="text-base font-semibold tracking-tight text-slate-900"
      >
        {t("codRambursHeroTitle", "Ramburs — plătești la livrare")}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        {t(
          "codRambursHeroSubtitle",
          "Plătești comanda la curier. Pe card autorizezi temporar doar garanția pentru transport."
        )}
      </p>

      <ul className="my-4 space-y-3">
        <li className="flex items-start gap-3">
          <Banknote
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
            aria-hidden
          />
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="font-medium text-slate-900">
              {t("codKeyPointPayTitle", "Plătești la curier")}
            </p>
            <p className="text-slate-600">
              {t(
                "codKeyPointPayBody",
                "Produsele, livrarea și taxa ramburs se achită la primirea coletului."
              )}
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
            aria-hidden
          />
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="font-medium text-slate-900">
              {t(
                "codKeyPointRoundTripTitle",
                "Garanție pentru transportul tur"
              )}
            </p>
            <p className="text-slate-600">
              {t(
                "codShippingHoldSummary",
                "Suma este rezervată temporar, fără încasare acum. Cardul nu se salvează în cont."
              )}
            </p>
          </div>
        </li>
      </ul>

      <Accordion
        type="single"
        collapsible
        className="border-t border-slate-200"
      >
        <AccordionItem value="full-agreement" className="border-none">
          <AccordionTrigger className="min-h-11 gap-3 py-3 text-left text-sm font-medium text-slate-700 hover:no-underline focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {t(
              "codConsentFullTextToggle",
              "Condiții ramburs și eliberarea garanției"
            )}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-slate-600">
            <p>{t("codConsentBody", COD_CONSENT_TEXT)}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <Link
                className="underline underline-offset-4 hover:text-slate-900"
                href="/shipping"
              >
                {t("shippingPolicy", "Politica de livrare")}
              </Link>
              <Link
                className="underline underline-offset-4 hover:text-slate-900"
                href="/returns"
              >
                {t("returnsPolicy", "Politica de retur")}
              </Link>
              <Link
                className="underline underline-offset-4 hover:text-slate-900"
                href="/terms"
              >
                {t("termsAndConditions", "Termeni și Condiții")}
              </Link>
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <label
        htmlFor="cod-consent"
        className={`mt-1 flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
          codConsentAccepted
            ? "border-blue-200 bg-blue-50/60"
            : "border-slate-200 bg-slate-50 hover:border-slate-300"
        }`}
      >
        <Checkbox
          id="cod-consent"
          checked={codConsentAccepted}
          onCheckedChange={checked => {
            const isAccepted = checked === true;
            onCodConsentChange(isAccepted);
            if (isAccepted) onAcceptClearError();
          }}
          className="mt-0.5 h-5 min-h-5 w-5 min-w-5 shrink-0 rounded border-slate-400 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        />
        <span className="text-sm leading-relaxed text-slate-700">
          {t(
            "codConsentLabel",
            "Confirm că am citit condițiile COD. Înțeleg că garanția nu este încasată automat, iar dreptul legal de retragere nu este penalizat."
          )}
        </span>
      </label>
    </section>
  );
}
