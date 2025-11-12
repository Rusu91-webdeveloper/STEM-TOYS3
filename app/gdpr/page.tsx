"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { Separator } from "@/components/ui/separator";

export default function GDPRPage() {
  return (
    <LegalPageShell
      badge="GDPR Compliance"
      title="Conformitate GDPR"
      description="Informații despre protecția datelor cu caracter personal și drepturile dvs. pe platforma TechTots."
      lastUpdated="Iulie 2025"
      lastUpdatedLabel="Ultimă actualizare"
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur sm:p-7 md:p-9">
        <div className="prose prose-sm prose-invert sm:prose-base md:prose-lg max-w-none">
          <section id="intro">
            <h2>1. Introducere</h2>
            <p>
              Această pagină explică modul în care TechTots respectă Regulamentul
              (UE) 2016/679 (GDPR) și Legea nr. 190/2018 din România.
            </p>
          </section>
          <Separator className="my-6 border-white/10" />
          <section id="drepturi">
            <h2>2. Drepturile dumneavoastră</h2>
            <ul>
              <li>Dreptul de acces la datele personale</li>
              <li>Dreptul la rectificare</li>
              <li>Dreptul la ștergerea datelor („dreptul de a fi uitat”)</li>
              <li>Dreptul la restricționarea prelucrării</li>
              <li>Dreptul la portabilitatea datelor</li>
              <li>Dreptul la opoziție</li>
              <li>
                Dreptul de a nu fi supus unui proces decizional individual automatizat,
                inclusiv crearea de profiluri
              </li>
              <li>Dreptul de a depune plângere la ANSPDCP</li>
            </ul>
          </section>
          <Separator className="my-6 border-white/10" />
          <section id="exercitare">
            <h2>3. Cum puteți exercita drepturile</h2>
            <p>
              Pentru orice solicitare privind datele personale, ne puteți contacta la
              adresa de email{" "}
              <a href="mailto:privacy@techtots.com">privacy@techtots.com</a> sau prin
              formularul de <Link href="/contact">contact</Link>.
            </p>
          </section>
          <Separator className="my-6 border-white/10" />
          <section id="dpo">
            <h2>4. Responsabil cu protecția datelor (DPO)</h2>
            <p>
              Pentru întrebări legate de protecția datelor, contactați responsabilul
              nostru la{" "}
              <a href="mailto:privacy@techtots.com">privacy@techtots.com</a>.
            </p>
          </section>
          <Separator className="my-6 border-white/10" />
          <section id="autoritate">
            <h2>5. Autoritatea de Supraveghere</h2>
            <p>
              Aveți dreptul să depuneți o plângere la{" "}
              <a
                href="https://www.dataprotection.ro/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ANSPDCP
              </a>{" "}
              dacă considerați că drepturile dvs. au fost încălcate.
            </p>
          </section>
          <Separator className="my-6 border-white/10" />
          <section id="legislatie">
            <h2>6. Legislație relevantă</h2>
            <ul>
              <li>Regulamentul (UE) 2016/679 (GDPR)</li>
              <li>
                Legea nr. 190/2018 privind măsuri de punere în aplicare a GDPR
              </li>
            </ul>
          </section>
          <Separator className="my-6 border-white/10" />
          <section id="linkuri">
            <h2>7. Link-uri utile</h2>
            <ul>
              <li>
                <a
                  href="https://www.dataprotection.ro/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ANSPDCP
                </a>
              </li>
              <li>
                <a
                  href="https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX%3A32016R0679"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Textul GDPR
                </a>
              </li>
            </ul>
          </section>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-inner shadow-sky-500/20 sm:p-7 md:p-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200 sm:text-sm">
                Suport GDPR
              </p>
              <h3 className="mt-2 text-base font-semibold text-white sm:text-lg md:text-xl">
                Aveți nevoie de ajutor sau clarificări suplimentare?
              </h3>
              <p className="mt-2 text-xs text-slate-200 sm:text-sm">
                Echipa noastră gestionează solicitările privind datele personale în
                termen de 72 de ore.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400"
              >
                <Link href="/contact">Contactați Suportul TechTots</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
              >
                <Link href="mailto:privacy@techtots.com">
                  privacy@techtots.com
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
              Protecția datelor este prioritatea noastră
            </h2>
            <p className="mt-3 text-xs text-slate-200 sm:text-sm md:text-base">
              Implementăm procese de audit și securitate pentru a garanta că datele
              familiilor TechTots sunt tratate conform celor mai exigente standarde.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200 shadow-inner shadow-sky-500/20 sm:text-sm">
            <p className="font-semibold text-white">
              Responsabil cu protecția datelor (DPO)
            </p>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:privacy@techtots.com"
                className="text-sky-200 underline underline-offset-4 hover:text-white"
              >
                privacy@techtots.com
              </a>
            </p>
            <p className="mt-2">
              Program: Luni - Vineri, 09:00 - 18:00 | Timp mediu de răspuns: 48h
            </p>
          </div>
        </div>
      </section>
    </LegalPageShell>
  );
}
