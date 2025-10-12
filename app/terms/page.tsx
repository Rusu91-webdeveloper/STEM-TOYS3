"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  Icon,
  StatusIcons,
  CommunicationIcons,
} from "@/components/ui/icon-system";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="bg-gray-50 min-h-screen pb-6 sm:pb-8 md:pb-12">
      {/* Hero Section - Compact on Mobile */}
      <div className="relative h-[120px] sm:h-[180px] md:h-[240px] lg:h-[280px] xl:h-[320px] w-full mb-4 sm:mb-6 md:mb-8">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Termeni și Condiții"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-indigo-600/60 flex flex-col items-center justify-center text-center px-3 sm:px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg">
            {t("termsH1")}
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-indigo-100 max-w-2xl mx-auto">
            Reguli și condiții pentru utilizarea platformei TechTots și
            achiziționarea produselor noastre educaționale.
          </p>
        </div>
      </div>

      <Container className="px-3 sm:px-4">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold flex items-center gap-1.5 sm:gap-2">
              <Icon
                icon={StatusIcons.Info}
                variant="info"
                size="lg"
                decorative
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              Termeni și Condiții
            </CardTitle>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1">
              Ultima actualizare: 9 august 2024
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {/* Table of Contents - Compact on Mobile */}
            <nav aria-label="Cuprins" className="mb-3 sm:mb-4 md:mb-6">
              <ul className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-4 text-[10px] sm:text-xs md:text-sm">
                {toc.map(item => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-indigo-700 hover:underline font-medium"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="prose prose-indigo prose-sm sm:prose-base md:prose-lg max-w-none">
              <section id="intro">
                <h2>1. Introducere</h2>
                <p>
                  Bine ați venit pe platforma TechTots ("noi", "al nostru").
                  Acești termeni reglementează accesul și utilizarea site-ului,
                  produselor și serviciilor noastre.
                </p>
                <p>
                  Prin accesarea sau utilizarea serviciilor, sunteți de acord cu
                  acești termeni și cu Politica de Confidențialitate. Dacă nu
                  sunteți de acord, vă rugăm să nu utilizați serviciile noastre.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="utilizare">
                <h2>2. Utilizarea Serviciilor</h2>
                <ul>
                  <li>
                    Utilizați serviciile doar în scopuri legale și în
                    conformitate cu acești termeni.
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
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="conturi">
                <h2>3. Conturi Utilizator</h2>
                <p>
                  Pentru a comanda, trebuie să furnizați informații corecte și
                  să vă protejați contul. Sunteți responsabil pentru toate
                  acțiunile efectuate din contul dvs.
                </p>
                <p>
                  Ne rezervăm dreptul de a dezactiva conturi care încalcă acești
                  termeni.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="ip">
                <h2>4. Proprietate Intelectuală</h2>
                <p>
                  Toate materialele de pe platformă (texte, imagini, software)
                  sunt proprietatea TechTots sau a partenerilor și sunt
                  protejate de lege.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="produse">
                <h2>5. Produse și Comenzi</h2>
                <p>
                  Toate produsele sunt oferite în limita stocului disponibil. Ne
                  rezervăm dreptul de a modifica sau retrage produse fără
                  notificare.
                </p>
                <p>
                  Prețurile pot fi modificate oricând. Putem refuza comenzi la
                  discreția noastră.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="livrare">
                <h2>6. Livrare</h2>
                <p>
                  Termenele de livrare sunt estimative. TechTots nu răspunde
                  pentru întârzieri cauzate de factori externi.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="retur">
                <h2>7. Retururi și Rambursări</h2>
                <p>
                  Politica noastră de retur este concepută pentru satisfacția
                  dvs. Consultați pagina dedicată pentru detalii.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="garantii">
                <h2>8. Declarație de Garanție</h2>
                <p>
                  <Icon
                    icon={StatusIcons.Info}
                    variant="info"
                    size="sm"
                    decorative
                    className="inline align-text-bottom mr-1"
                  />
                  Produsele și serviciile sunt oferite "ca atare" fără garanții
                  explicite sau implicite.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="raspundere">
                <h2>9. Limitarea Răspunderii</h2>
                <p>
                  <Icon
                    icon={StatusIcons.Warning}
                    variant="warning"
                    size="sm"
                    decorative
                    className="inline align-text-bottom mr-1"
                  />
                  TechTots nu răspunde pentru daune indirecte sau pierderi
                  rezultate din utilizarea serviciilor sau produselor.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="modificari">
                <h2>10. Modificări ale Termenilor</h2>
                <p>
                  Putem actualiza acești termeni oricând. Continuarea utilizării
                  serviciilor reprezintă acceptul dvs. pentru modificări.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="lege">
                <h2>11. Lege Aplicabilă</h2>
                <p>
                  Acești termeni sunt guvernați de legea română. Orice litigiu
                  va fi soluționat de instanțele competente din România.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="contact">
                <h2>12. Contact</h2>
                <p>
                  Pentru întrebări despre termeni, ne puteți contacta la{" "}
                  <a href="mailto:legal@techtots.com">legal@techtots.com</a>.
                </p>
              </section>
            </div>
            {/* CTA - Compact on Mobile */}
            <Separator className="my-4 sm:my-6 md:my-8" />
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 md:mt-6">
              <Icon
                icon={StatusIcons.Help}
                variant="primary"
                size="lg"
                decorative
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
              />
              <p className="text-sm sm:text-base md:text-lg font-medium text-center">
                Aveți nevoie de ajutor sau clarificări suplimentare?
              </p>
              <Button
                asChild
                size="lg"
                className="mt-1.5 sm:mt-2 text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6"
              >
                <Link href="/contact">Contactați Suportul TechTots</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
