"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { OPEN_CONSENT_EVENT, saveCookieConsent } from "@/lib/analytics/consent";
import { useCookieConsent } from "@/lib/analytics/use-cookie-consent";

export default function CookieConsent() {
  const { consent, ready } = useCookieConsent(true);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const reopen = () => {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, [consent]);

  if (!ready) return null;
  const choose = (analyticsChoice: boolean, marketingChoice: boolean) => {
    if (
      !saveCookieConsent({
        analytics: analyticsChoice,
        marketing: marketingChoice,
      })
    ) {
      setError(true);
      return;
    }
    setError(false);
    setOpen(false);
    setCustomize(false);
  };

  const buttonClass =
    "min-h-11 rounded-lg border border-slate-400 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-4 sm:text-sm";
  if (consent && !open)
    return (
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 z-[60] rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:bottom-3"
      >
        Setări cookie-uri
      </button>
    );

  return (
    <section
      aria-label="Preferințe cookie-uri"
      data-cookie-consent
      className="fixed inset-x-0 bottom-0 z-[70] max-h-[75svh] overflow-y-auto border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] sm:px-5"
    >
      <div
        className={`mx-auto max-w-6xl ${!customize ? "lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-x-8" : ""}`}
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tu alegi cookie-urile
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm">
            Cookie-uri necesare pentru coș și comandă. Cu acordul tău, Google
            Analytics/Vercel măsoară traficul, iar Meta/TikTok reclamele. Poți
            cumpăra și dacă refuzi.{" "}
            <Link href="/privacy" className="underline">
              Confidențialitate
            </Link>
            .
          </p>
          {customize && (
            <fieldset className="mt-3 space-y-2 text-sm text-slate-800">
              <legend className="mb-2 font-semibold">Preferințele tale</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked disabled /> Necesare — active
                permanent
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={event => setAnalytics(event.target.checked)}
                />{" "}
                Analiză și performanță — Google Analytics, Vercel
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={event => setMarketing(event.target.checked)}
                />{" "}
                Publicitate — Meta, TikTok
              </label>
            </fieldset>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Nu am putut salva preferințele în acest browser. Cookie-urile
              opționale rămân dezactivate până când putem salva alegerea.
            </p>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 lg:mt-0">
          <button
            type="button"
            className={buttonClass}
            onClick={() => choose(false, false)}
          >
            Refuz opționale
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => choose(true, true)}
          >
            Accept toate
          </button>
          {customize ? (
            <button
              type="button"
              className={buttonClass}
              onClick={() => choose(analytics, marketing)}
            >
              Salvez preferințele
            </button>
          ) : (
            <button
              type="button"
              className={buttonClass}
              onClick={() => setCustomize(true)}
            >
              Personalizez
            </button>
          )}
          {consent && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => setOpen(false)}
            >
              Închid
            </button>
          )}
        </div>
        {customize && (
          <p className="mt-2 text-xs text-slate-600">
            Păstrăm alegerea timp de 6 luni. O poți schimba oricând din „Setări
            cookie-uri”. Retragerea acordului reîncarcă pagina pentru a opri
            serviciile deja încărcate.
          </p>
        )}
      </div>
    </section>
  );
}
