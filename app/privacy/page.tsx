"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { publicConfig } from "@/lib/config/app-config";

import { Button } from "@/components/ui/button";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { Icon, StatusIcons } from "@/components/ui/icon-system";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

const toc = [
  { id: "intro", label: "1. Introducere" },
  { id: "colectare", label: "2. Ce date colectăm" },
  { id: "utilizare", label: "3. Cum folosim datele" },
  { id: "cookies", label: "4. Cookie-uri și tehnologii" },
  { id: "partajare", label: "5. Partajarea datelor" },
  { id: "securitate", label: "6. Securitatea datelor" },
  { id: "copii", label: "7. Confidențialitatea copiilor" },
  { id: "drepturi", label: "8. Drepturile dvs." },
  { id: "modificari", label: "9. Modificări ale politicii" },
  { id: "contact", label: "10. Contact" },
];

export default function PrivacyPage() {
  const { t } = useTranslation();
  const [contactEmail, setContactEmail] = useState(publicConfig.contactEmail);
  const [contactPhone, setContactPhone] = useState(publicConfig.storePhoneFormatted);
  const lastUpdated = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

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
          if (settings?.contactPhone) {
            setContactPhone(settings.contactPhone);
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
      title={t("privacyH1")}
      description={t(
        "privacyHeroSubtitle",
        "Cum colectăm, folosim și protejăm datele dvs. personale pe platforma TechTots Educational Solutions."
      )}
      lastUpdated={lastUpdated}
      lastUpdatedLabel={t("lastUpdatedLabel", "Ultimă actualizare")}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur sm:p-7 md:p-9">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start">
          <nav
            aria-label={t("privacyTableOfContents", "Cuprins")}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-inner shadow-black/20 backdrop-blur"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200 sm:text-sm">
              {t("privacyTableOfContents", "Cuprins")}
            </h2>
            <ul className="mt-4 space-y-2 text-xs text-slate-200 sm:text-sm">
              {toc.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-medium transition hover:border-sky-400/60 hover:bg-sky-500/15 hover:text-white"
                  >
                    <span>{item.label}</span>
                    <span className="h-2 w-2 rounded-full bg-sky-300/70" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="prose prose-sm prose-invert sm:prose-base md:prose-lg max-w-none">
            <section id="intro">
              <h2>1. Introducere</h2>
              <p>
                La TechTots Educational Solutions ("noi", "al nostru"),
                respectăm confidențialitatea dvs. și ne angajăm să protejăm
                datele personale. Această politică explică modul în care
                colectăm, folosim și protejăm informațiile dvs. când vizitați
                site-ul sau faceți achiziții.
              </p>
              <p>
                Prin utilizarea serviciilor noastre, confirmați că ați citit și
                înțeles această politică.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="colectare">
              <h2>2. Ce date colectăm</h2>
              <ul>
                <li>Nume și prenume</li>
                <li>Adresă de email</li>
                <li>Adresă de livrare</li>
                <li>Număr de telefon</li>
                <li>Informații de plată (nu stocăm detalii complete card)</li>
                <li>IP, browser, dispozitiv, pagini vizitate</li>
              </ul>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="utilizare">
              <h2>3. Cum folosim datele</h2>
              <ul>
                <li>Pentru procesarea comenzilor</li>
                <li>Pentru crearea și gestionarea contului</li>
                <li>Pentru suport clienți</li>
                <li>Pentru comunicări de marketing (cu acordul dvs.)</li>
                <li>Pentru îmbunătățirea serviciilor</li>
                <li>Pentru prevenirea fraudelor</li>
                <li>Pentru respectarea obligațiilor legale</li>
              </ul>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="cookies">
              <h2>4. Cookie-uri și tehnologii</h2>
              <p>
                Folosim cookie-uri și tehnologii similare pentru a colecta
                informații despre activitatea dvs. Puteți seta browserul să
                refuze cookie-urile sau să vă notifice când sunt utilizate.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="partajare">
              <h2>5. Partajarea datelor</h2>
              <ul>
                <li>Furnizori de servicii (curierat, plăți, marketing)</li>
                <li>Autorități legale, când este necesar</li>
                <li>Parteneri de marketing (cu acordul dvs.)</li>
              </ul>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="securitate">
              <h2>6. Securitatea datelor</h2>
              <p>
                <Icon
                  icon={StatusIcons.Info}
                  variant="info"
                  size="sm"
                  decorative
                  className="inline align-text-bottom mr-1 text-sky-200"
                />
                Implementăm măsuri tehnice și organizatorice pentru a proteja
                datele personale. Totuși, nicio metodă nu este 100% sigură.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="copii">
              <h2>7. Confidențialitatea copiilor</h2>
              <p>
                Serviciile noastre nu sunt destinate copiilor sub 13 ani. Nu
                colectăm intenționat date de la copii sub această vârstă.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="drepturi">
              <h2>8. Drepturile dvs.</h2>
              <ul>
                <li>Acces la datele personale</li>
                <li>Rectificare</li>
                <li>Ștergere</li>
                <li>Restricționare</li>
                <li>Portabilitate</li>
                <li>Opoziție</li>
              </ul>
              <p>
                Pentru exercitarea acestor drepturi, contactați-ne folosind
                datele de mai jos.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="modificari">
              <h2>9. Modificări ale politicii</h2>
              <p>
                Putem actualiza această politică periodic. Vom publica
                modificările pe această pagină și vom actualiza data.
              </p>
            </section>
            <Separator className="my-6 border-white/10" />
            <section id="contact">
              <h2>10. Contact</h2>
              <p>
                Pentru întrebări despre confidențialitate, ne puteți contacta la{" "}
                <a href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>{" "}
                sau la adresa: TechTots Educational Solutions, Mehedinți 54-56,
                Bl. D5, Sc. 2, Ap. 70, Cluj-Napoca, Cluj, România.
              </p>
              <p>
                Telefon: <a href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}>{contactPhone}</a>
                <br />
                Program: Luni-Vineri, 9:00 AM - 6:00 PM CET
              </p>
            </section>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-inner shadow-sky-500/20 sm:p-7 md:p-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200 sm:text-sm">
                {t("privacySupportTag", "Suport confidențialitate")}
              </p>
              <h3 className="mt-2 text-base font-semibold text-white sm:text-lg md:text-xl">
                {t(
                  "privacySupportHeading",
                  "Aveți nevoie de ajutor sau clarificări suplimentare?"
                )}
              </h3>
              <p className="mt-2 text-xs text-slate-200 sm:text-sm">
                {t(
                  "privacySupportDescription",
                  "Contactați echipa noastră pentru solicitări privind datele personale sau pentru exercitarea drepturilor GDPR."
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
                  {t(
                    "privacySupportPrimary",
                    "Contactați Suportul TechTots"
                  )}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
              >
                <Link href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-xl shadow-sky-500/30 sm:p-7 md:p-9">
        <div className="grid gap-5 sm:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">
              {t(
                "privacyComplianceHeading",
                "Ne aliniem cu cele mai ridicate standarde de confidențialitate"
              )}
            </h2>
            <p className="mt-3 text-xs text-slate-200 sm:text-sm md:text-base">
              {t(
                "privacyComplianceDescription",
                "Politicile noastre sunt actualizate constant pentru a respecta GDPR și cerințele locale, astfel încât datele familiei tale să fie protejate la fiecare pas."
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200 shadow-inner shadow-sky-500/20 sm:text-sm">
            <p className="font-semibold text-white">
              {t("privacyContactLabel", "Responsabil cu protecția datelor")}
            </p>
            <p className="mt-2">
              Email:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-sky-200 underline underline-offset-4 hover:text-white"
              >
                  {contactEmail}
              </a>
            </p>
            <p className="mt-2">
              {t(
                "privacyContactNote",
                "Trimiteți-ne un mesaj pentru solicitări legate de date personale sau pentru raportarea unor incidente."
              )}
            </p>
          </div>
        </div>
      </section>
    </LegalPageShell>
  );
}
