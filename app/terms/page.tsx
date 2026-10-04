"use client";

import Link from "next/link";

import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { Button } from "@/components/ui/button";
import { Icon, StatusIcons } from "@/components/ui/icon-system";
import { Separator } from "@/components/ui/separator";
import { COMPANY_LEGAL } from "@/lib/config/company-legal";
import { useTranslation } from "@/lib/i18n";
import {
  RETURN_POLICY_COD_RTO_RO,
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  RETURN_WINDOW_LABEL_RO,
} from "@/lib/returns/policy";

const toc = [
  { id: "intro", label: "1. Introducere" },
  { id: "utilizare", label: "2. Utilizarea Serviciilor" },
  { id: "conturi", label: "3. Conturi Utilizator" },
  { id: "ip", label: "4. Proprietate Intelectuală" },
  { id: "produse", label: "5. Produse și Comenzi" },
  { id: "livrare", label: "6. Livrare" },
  { id: "retur", label: "7. Retururi și Rambursări" },
  { id: "garantii", label: "8. Garanția legală de conformitate" },
  { id: "raspundere", label: "9. Limitarea Răspunderii" },
  { id: "modificari", label: "10. Modificări ale Termenilor" },
  { id: "lege", label: "11. Lege Aplicabilă" },
  { id: "contact", label: "12. Contact" },
];

export default function TermsPage() {
  const { t } = useTranslation();
  const contactEmail = COMPANY_LEGAL.email;
  const lastUpdated = "4 octombrie 2026";

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
                Magazinul TechTots este operat de{" "}
                <strong>{COMPANY_LEGAL.name}</strong>, CUI {COMPANY_LEGAL.cui},
                nr. registrul comerțului {COMPANY_LEGAL.regCom}, sediu:{" "}
                {COMPANY_LEGAL.address}. Email: {COMPANY_LEGAL.email}; telefon:{" "}
                {COMPANY_LEGAL.phone}. Acești termeni descriu utilizarea
                site-ului și condițiile aplicabile comenzilor.
              </p>
              <p>
                Înainte de plasarea comenzii poți consulta acești termeni,
                informațiile produsului și costurile din checkout.{" "}
                <Link href="/privacy">Politica de confidențialitate</Link>{" "}
                explică prelucrarea datelor; acordul pentru cookie-uri de
                analiză și publicitate se exprimă separat și poate fi retras.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="utilizare">
              <h2>2. Utilizarea Serviciilor</h2>
              <ul>
                <li>
                  Utilizați serviciile doar în scopuri legale și în conformitate
                  cu acești termeni.
                </li>
                <li>
                  Nu utilizați serviciile pentru a încălca legi sau a
                  restricționa drepturile altor utilizatori.
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
                Pentru a comanda, trebuie să furnizați informații corecte și să
                vă protejați contul. Sunteți responsabil pentru toate acțiunile
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
                Toate materialele de pe platformă (texte, imagini, software)
                sunt proprietatea TechTots sau a partenerilor și sunt protejate
                de lege.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="produse">
              <h2>5. Produse și Comenzi</h2>
              <p>
                Toate produsele sunt oferite în limita stocului disponibil. Ne
                rezervăm dreptul de a modifica sau retrage produse fără
                notificare.
              </p>
              <p>
                Prețurile sunt exprimate în lei. Totalul comenzii, costul
                livrării și orice taxă ramburs sunt prezentate înainte de
                confirmare. Modificările ulterioare ale prețurilor nu modifică
                un contract deja încheiat. Dacă există o indisponibilitate sau o
                eroare de preț, te contactăm pentru clarificare; nu aplicăm
                automat un preț mai mare.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="livrare">
              <h2>6. Livrare</h2>
              <p>
                Termenul estimat și metoda de livrare sunt prezentate în
                checkout. Dacă apare o întârziere, contactează-ne pentru
                verificare. Aceste estimări nu limitează drepturile legale
                privind livrarea și executarea contractului.
              </p>
              <ul>
                <li>
                  Costurile de transport, taxele pentru plata ramburs (dacă
                  există) și condițiile de livrare sunt afișate înainte de
                  finalizarea comenzii.
                </li>
                <li>
                  Refuzul sau nepreluarea coletului este un retur la expeditor
                  (RTO). Pentru exercitarea retragerii, comunică-ne decizia prin
                  email sau altă declarație neechivocă; simpla nepreluare nu
                  înlocuiește această comunicare.
                </li>
                <li>{RETURN_POLICY_COD_RTO_RO}</li>
                <li>
                  Pentru detalii complete, consultați{" "}
                  <Link href="/shipping">Politica de Livrare</Link>.
                </li>
              </ul>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="retur">
              <h2>7. Retururi și Rambursări</h2>
              <p>
                Politica noastră de retur este concepută pentru satisfacția dvs.
                Consultați pagina dedicată pentru detalii.
              </p>
              <ul>
                <li>
                  După recepția produsului, consumatorul are drept de retragere
                  în <strong>{RETURN_WINDOW_LABEL_RO}</strong>, conform
                  legislației aplicabile.
                </li>
                <li>{RETURN_POLICY_CUSTOMER_PAYS_RO}</li>
                <li>{RETURN_POLICY_SELLER_PAYS_RO}</li>
                <li>
                  Detalii complete:{" "}
                  <Link href="/returns">Politica de Returnare</Link>.
                </li>
                <li>
                  Poți transmite declarația online, fără autentificare, la{" "}
                  <a href="/withdrawal">Retrageți-vă din contract aici</a>.
                  După „Confirmați retragerea”, primești o confirmare de primire
                  cu declarația, data și ora transmiterii, pe suport durabil.
                </li>
              </ul>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="garantii">
              <h2>8. Garanția legală de conformitate</h2>
              <p>
                <Icon
                  icon={StatusIcons.Info}
                  variant="info"
                  size="sm"
                  decorative
                  className="inline align-text-bottom mr-1 text-sky-200"
                />
                Pentru bunurile vândute consumatorilor, vânzătorul răspunde
                pentru neconformitățile existente la livrare și constatate în
                termen de <strong>2 ani de la livrare</strong>, potrivit OUG nr.
                140/2021. În condițiile legii, poți solicita repararea sau
                înlocuirea fără costuri; reducerea prețului ori încetarea
                contractului sunt disponibile în situațiile prevăzute de lege.
                Orice garanție comercială suplimentară nu reduce aceste
                drepturi. Contactează-ne cu numărul comenzii și descrierea
                problemei.
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
                Răspunderea se stabilește potrivit legii aplicabile. Nicio
                prevedere din acești termeni nu exclude garanția legală, dreptul
                de retragere, răspunderea obligatorie pentru produse sau alte
                drepturi ale consumatorului care nu pot fi limitate prin
                contract.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="modificari">
              <h2>10. Modificări ale Termenilor</h2>
              <p>
                Actualizările sunt publicate cu data reviziei. Pentru o comandă
                se aplică termenii acceptați la încheierea contractului;
                reviziile ulterioare nu îi modifică retroactiv condițiile.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="lege">
              <h2>11. Lege Aplicabilă</h2>
              <p>
                Se aplică legea română, cu respectarea protecțiilor obligatorii
                ale consumatorilor. Poți contacta asistența,{" "}
                <a href="https://eservicii.anpc.ro/">ANPC pentru reclamații</a>{" "}
                sau <a href="https://reclamatiisal.anpc.ro/">platforma SAL</a>{" "}
                pentru soluționarea alternativă a litigiilor. Accesul la
                instanțele competente rămâne disponibil.
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
                  "Contactează asistența TechTots pentru clarificări despre comenzi, termeni și drepturile tale."
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
