"use client";

import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  PackageX,
} from "lucide-react";
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

  const keyPoints = [
    {
      icon: Banknote,
      title: t("codKeyPointPayTitle", "Plătești la curier"),
      body: t(
        "codKeyPointPayBody",
        "Suma comenzii și taxa ramburs se achită la primirea coletului, nu în momentul plasării."
      ),
      accent: "text-amber-700 bg-amber-50 border-amber-100",
    },
    {
      icon: PackageX,
      title: t("codKeyPointRtoTitle", "Refuz sau nepreluare"),
      body: t(
        "codKeyPointRtoBody",
        "Dacă refuzi coletul la livrare sau nu îl ridici în termen, acesta poate fi returnat expeditorului (RTO)."
      ),
      accent: "text-slate-800 bg-slate-50 border-slate-200",
    },
    {
      icon: ArrowLeftRight,
      title: t("codKeyPointRoundTripTitle", "Reținem doar transportul tur"),
      body: t(
        "codKeyPointRoundTripBody",
        "Dacă o comandă ramburs este refuzată sau neridicată, suportăm returul la expeditor și putem reține doar costul logistic al transportului tur, dacă a fost comunicat înainte de comandă."
      ),
      accent: "text-amber-900 bg-amber-50/90 border-amber-100",
    },
    {
      icon: BadgeCheck,
      title: t("codKeyPointAckTitle", "Confirmare înainte de plată"),
      body: t(
        "codKeyPointAckBody",
        "Continuarea comenzii cu ramburs necesită acceptarea explicită a acestor condiții."
      ),
      accent: "text-emerald-800 bg-emerald-50 border-emerald-100",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" />
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/90 to-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/60">
              <Banknote className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  {t(
                    "codRambursHeroTitle",
                    "Ramburs — plătești la livrare"
                  )}
                </h3>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  {t("codRambursHeroBadge", "Informare obligatorie")}
                </span>
              </div>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
                {t(
                  "codRambursHeroSubtitle",
                  "Iată, pe scurt, ce trebuie să știi înainte să alegi ramburs — la fel ca în checkout-urile mari din e-commerce."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {keyPoints.map(point => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className={`rounded-xl border p-3.5 shadow-sm ${point.accent}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <p className="text-sm font-semibold leading-snug">
                    {point.title}
                  </p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 sm:text-[13px]">
                  {point.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
            {t("codStepOne", "Pasul 1")}
          </span>
          <span className="text-slate-400">·</span>
          <span>{t("requiredLabel", "Obligatoriu")}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {t(
              "codConsentCardTitle",
              "Confirmă condițiile pentru plata ramburs"
            )}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t(
              "codConsentCardBody",
              "Plătești la livrare, dar avem nevoie de confirmarea ta că ai înțeles regulile logistice aplicabile dacă pachetul este refuzat sau nu este ridicat."
            )}
          </p>

          <label
            htmlFor="cod-consent"
            className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors hover:border-slate-300"
          >
            <Checkbox
              id="cod-consent"
              checked={codConsentAccepted}
              onCheckedChange={checked => {
                const isAccepted = checked === true;
                onCodConsentChange(isAccepted);
                if (isAccepted) onAcceptClearError();
              }}
              className="mt-0.5 h-5 w-5 rounded-md border-2 border-amber-500 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700 data-[state=checked]:text-white"
            />
            <span className="text-sm font-medium leading-relaxed text-slate-900">
              {t(
                "codConsentLabel",
                "Confirm că am citit condițiile COD și înțeleg că, în caz de refuz sau nepreluare, returul la expeditor este suportat de comerciant, iar dacă a fost comunicat în prealabil poate fi reținut doar costul logistic al transportului tur."
              )}
            </span>
          </label>

          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {t(
              "codConsentShortNote",
              "Pe scurt: la livrare plătești produsele și taxa COD. Dacă refuzi coletul sau nu îl ridici, suportăm returul la expeditor și putem reține doar costul logistic al transportului tur, dacă acesta a fost afișat înainte de comandă."
            )}
          </p>
        </div>

        <Accordion type="single" collapsible className="rounded-xl border border-slate-200 bg-white px-1">
          <AccordionItem value="full-agreement" className="border-none px-3">
            <AccordionTrigger className="py-3 text-sm font-semibold text-slate-900 hover:no-underline">
              {t(
                "codConsentFullTextToggle",
                "Vezi textul complet al acordului COD"
              )}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-slate-600">
              {t("codConsentBody", COD_CONSENT_TEXT)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-center text-xs text-slate-500 sm:text-left">
          {t("codConsentLinksPrefix", "Detalii complete:")}{" "}
          <Link
            className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
            href="/shipping"
          >
            {t("shippingPolicy", "Politica de livrare")}
          </Link>
          {", "}
          <Link
            className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
            href="/returns"
          >
            {t("returnsPolicy", "Politica de retur")}
          </Link>{" "}
          {t("andText", "și")}{" "}
          <Link
            className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
            href="/terms"
          >
            {t("termsAndConditions", "Termeni și Condiții")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
