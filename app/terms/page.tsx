"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Icon,
  StatusIcons,
  CommunicationIcons,
} from "@/components/ui/icon-system";

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
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="relative h-[220px] sm:h-[280px] md:h-[320px] w-full mb-8">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Termeni și Condiții"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-indigo-600/60 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Termeni și Condiții
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
            Reguli și condiții pentru utilizarea platformei TechTots și
            achiziționarea produselor noastre educaționale.
          </p>
        </div>
      </div>

      <Container>
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Icon
                icon={StatusIcons.Info}
                variant="info"
                size="lg"
                decorative
              />
              Termeni și Condiții
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Ultima actualizare: 9 august 2024
            </p>
          </CardHeader>
          <CardContent>
            {/* Table of Contents */}
            <nav aria-label="Cuprins" className="mb-6">
              <ul className="flex flex-wrap gap-2 sm:gap-4 text-sm">
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
            <div className="prose prose-indigo prose-lg max-w-none">
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
              <Separator className="my-6" />
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
              <Separator className="my-6" />
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
              <Separator className="my-6" />
              <section id="ip">
                <h2>4. Proprietate Intelectuală</h2>
                <p>
                  Toate materialele de pe platformă (texte, imagini, software)
                  sunt proprietatea TechTots sau a partenerilor și sunt
                  protejate de lege.
                </p>
              </section>
              <Separator className="my-6" />
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
              <Separator className="my-6" />
              <section id="livrare">
                <h2>6. Livrare</h2>
                <p>
                  Termenele de livrare sunt estimative. TechTots nu răspunde
                  pentru întârzieri cauzate de factori externi.
                </p>
              </section>
              <Separator className="my-6" />
              <section id="retur">
                <h2>7. Retururi și Rambursări</h2>
                <p>
                  Politica noastră de retur este concepută pentru satisfacția
                  dvs. Consultați pagina dedicată pentru detalii.
                </p>
              </section>
              <Separator className="my-6" />
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
              <Separator className="my-6" />
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
              <Separator className="my-6" />
              <section id="modificari">
                <h2>10. Modificări ale Termenilor</h2>
                <p>
                  Putem actualiza acești termeni oricând. Continuarea utilizării
                  serviciilor reprezintă acceptul dvs. pentru modificări.
                </p>
              </section>
              <Separator className="my-6" />
              <section id="lege">
                <h2>11. Lege Aplicabilă</h2>
                <p>
                  Acești termeni sunt guvernați de legea română. Orice litigiu
                  va fi soluționat de instanțele competente din România.
                </p>
              </section>
              <Separator className="my-6" />
              <section id="contact">
                <h2>12. Contact</h2>
                <p>
                  Pentru întrebări despre termeni, ne puteți contacta la{" "}
                  <a href="mailto:legal@techtots.com">legal@techtots.com</a>.
                </p>
              </section>
            </div>
            {/* CTA */}
            <Separator className="my-8" />
            <div className="flex flex-col items-center gap-2 mt-6">
              <Icon
                icon={StatusIcons.Help}
                variant="primary"
                size="lg"
                decorative
              />
              <p className="text-lg font-medium text-center">
                Aveți nevoie de ajutor sau clarificări suplimentare?
              </p>
              <Button asChild size="lg" className="mt-2">
                <Link href="/contact">Contactați Suportul TechTots</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
