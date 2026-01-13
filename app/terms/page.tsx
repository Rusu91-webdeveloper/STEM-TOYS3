"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { Icon, StatusIcons } from "@/components/ui/icon-system";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

const toc = [
  { id: "intro", label: "1. Introducere" },
  { id: "utilizare", label: "2. Utilizarea Serviciilor" },
  { id: "conturi", label: "3. Conturi Utilizator" },
  { id: "ip", label: "4. Proprietate Intelectuală" },
  { id: "produse", label: "5. Produse și Comenzi" },
  { id: "livrare", label: "6. Livrare" },
  { id: "retur", label: "7. Retururi și Rambursări" },
  { id: "garantii", label: "8. Declarație de Garanție" },
  { id: "raspundere", label: "9. Limitarea Răspunderii" },
  { id: "modificari", label: "10. Modificări ale Termenilor" },
  { id: "lege", label: "11. Lege Aplicabilă" },
  { id: "contact", label: "12. Contact" },
];

export default function TermsPage() {
  const { t } = useTranslation();
  const [contactEmail, setContactEmail] = useState("webira.rem.srl@gmail.com");
  const lastUpdated = t("termsLastUpdated", "9 august 2024");

  // Fetch store settings for contact info
  useEffect(() => {
    async function loadContactInfo() {
      try {
        const response = await fetch("/api/store-settings");
        if (response.ok) {
          const settings = await response.json();
          if (settings?.contactEmail) {
            setContactEmail(settings.contactEmail);
          }
        }
      } catch (error) {
        console.error("Error loading contact info:", error);
      }
    }
    loadContactInfo();
  }, []);

  return (
    <LegalPageShell
      badge={t("legalBadge", "TechTots Legal")}
      title={t("termsH1")}
      description={t(
        "termsHeroSubtitle",
        "Reguli și condiții pentru utilizarea platformei TechTots și achiziționarea produselor noastre educaționale."
      )}
      lastUpdated={lastUpdated}
      lastUpdatedLabel={t("lastUpdatedLabel", "Ultimă actualizare")}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur sm:p-7 md:p-9">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start">
          <nav
            aria-label={t("termsTableOfContents", "Cuprins")}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-inner shadow-black/20 backdrop-blur"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200 sm:text-sm">
              {t("termsTableOfContents", "Cuprins")}
            </h2>
            <ul className="mt-4 space-y-2 text-xs text-slate-200 sm:text-sm">
              {toc.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-medium transition hover:border-emerald-400/60 hover:bg-emerald-500/15 hover:text-white"
                  >
                    <span>{item.label}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-300/70" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="prose prose-sm prose-invert sm:prose-base md:prose-lg max-w-none">
            <section id="intro">
              <h2>1. Introducere</h2>
              <p>
                Bine ați venit pe platforma TechTots ("noi", "al nostru"). Acești
                termeni reglementează accesul și utilizarea site-ului, produselor
                și serviciilor noastre.
              </p>
              <p>
                Prin accesarea sau utilizarea serviciilor, sunteți de acord cu
                acești termeni și cu Politica de Confidențialitate. Dacă nu sunteți
                de acord, vă rugăm să nu utilizați serviciile noastre.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="utilizare">
              <h2>2. Utilizarea Serviciilor</h2>
              <ul>
                <li>
                  Utilizați serviciile doar în scopuri legale și în conformitate cu
                  acești termeni.
                </li>
                <li>
                  Nu utilizați serviciile pentru a încălca legi sau a restricționa
                  drepturile altor utilizatori.
                </li>
                <li>
                  Nu încercați să accesați neautorizat părți ale platformei.
                </li>
              </ul>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="conturi">
              <h2>3. Conturi Utilizator</h2>
              <p>
                Pentru a comanda, trebuie să furnizați informații corecte și să vă
                protejați contul. Sunteți responsabil pentru toate acțiunile
                efectuate din contul dvs.
              </p>
              <p>
                Ne rezervăm dreptul de a dezactiva conturi care încalcă acești
                termeni.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="ip">
              <h2>4. Proprietate Intelectuală</h2>
              <p>
                Toate materialele de pe platformă (texte, imagini, software) sunt
                proprietatea TechTots sau a partenerilor și sunt protejate de lege.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="produse">
              <h2>5. Produse și Comenzi</h2>
              <p>
                Toate produsele sunt oferite în limita stocului disponibil. Ne
                rezervăm dreptul de a modifica sau retrage produse fără notificare.
              </p>
              <p>
                Prețurile pot fi modificate oricând. Putem refuza comenzi la
                discreția noastră.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="livrare">
              <h2>6. Livrare</h2>
              <p>
                Termenele de livrare sunt estimative. TechTots nu răspunde pentru
                întârzieri cauzate de factori externi.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="retur">
              <h2>7. Retururi și Rambursări</h2>
              <p>
                Politica noastră de retur este concepută pentru satisfacția dvs.
                Consultați pagina dedicată pentru detalii.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="garantii">
              <h2>8. Declarație de Garanție</h2>
              <p>
                <Icon
                  icon={StatusIcons.Info}
                  variant="info"
                  size="sm"
                  decorative
                  className="inline align-text-bottom mr-1 text-sky-200"
                />
                Produsele și serviciile sunt oferite "ca atare" fără garanții
                explicite sau implicite.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="raspundere">
              <h2>9. Limitarea Răspunderii</h2>
              <p>
                <Icon
                  icon={StatusIcons.Warning}
                  variant="warning"
                  size="sm"
                  decorative
                  className="inline align-text-bottom mr-1 text-amber-200"
                />
                TechTots nu răspunde pentru daune indirecte sau pierderi rezultate
                din utilizarea serviciilor sau produselor.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="modificari">
              <h2>10. Modificări ale Termenilor</h2>
              <p>
                Putem actualiza acești termeni oricând. Continuarea utilizării
                serviciilor reprezintă acceptul dvs. pentru modificări.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="lege">
              <h2>11. Lege Aplicabilă</h2>
              <p>
                Acești termeni sunt guvernați de legea română. Orice litigiu va fi
                soluționat de instanțele competente din România.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="contact">
              <h2>12. Contact</h2>
              <p>
                Pentru întrebări despre termeni, ne puteți contacta la{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </p>
            </section>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-inner shadow-emerald-500/20 sm:p-7 md:p-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200 sm:text-sm">
                {t("termsSupportTag", "Asistență legală")}
              </p>
              <h3 className="mt-2 text-base font-semibold text-white sm:text-lg md:text-xl">
                {t(
                  "termsSupportHeading",
                  "Aveți întrebări despre termeni sau contracte?"
                )}
              </h3>
              <p className="mt-2 text-xs text-slate-200 sm:text-sm">
                {t(
                  "termsSupportDescription",
                  "Echipa noastră juridică este disponibilă pentru clarificări rapide și transparente."
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400"
              >
                <Link href="/contact">
                  {t("termsSupportPrimary", "Contactați Suportul TechTots")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
              >
                <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-xl shadow-emerald-500/30 sm:p-7 md:p-9">
        <div className="grid gap-5 sm:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">
              {t(
                "termsComplianceHeading",
                "Un cadru contractual adaptat pentru părinți și educatori"
              )}
            </h2>
            <p className="mt-3 text-xs text-slate-200 sm:text-sm md:text-base">
              {t(
                "termsComplianceDescription",
                "Actualizăm constant termenii pentru a reflecta reglementările UE și bunele practici în ecommerce educațional."
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200 shadow-inner shadow-emerald-500/20 sm:text-sm">
            <p className="font-semibold text-white">
              {t("termsContactLabel", "Punct de contact legal")}
            </p>
            <p className="mt-2">
              Email:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-emerald-200 underline underline-offset-4 hover:text-white"
              >
                  {contactEmail}
              </a>
            </p>
            <p className="mt-2">
              {t(
                "termsContactNote",
                "Trimiteți-ne un mesaj pentru solicitări contractuale, parteneriate sau clarificări legale."
              )}
            </p>
          </div>
        </div>
      </section>
    </LegalPageShell>
  );
}
