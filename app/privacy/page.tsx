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

  return (
    <div className="bg-gray-50 min-h-screen pb-6 sm:pb-8 md:pb-12">
      {/* Hero Section - Compact on Mobile */}
      <div className="relative h-[120px] sm:h-[180px] md:h-[240px] lg:h-[280px] xl:h-[320px] w-full mb-4 sm:mb-6 md:mb-8">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Politica de Confidențialitate"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-indigo-600/60 flex flex-col items-center justify-center text-center px-3 sm:px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg">
            {t("privacyH1")}
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-indigo-100 max-w-2xl mx-auto">
            Cum colectăm, folosim și protejăm datele dvs. personale pe platforma
            TechTots Educational Solutions.
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
              Politica de Confidențialitate
            </CardTitle>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1">
              Ultima actualizare:{" "}
              {new Date().toLocaleDateString("ro-RO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
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
                  La TechTots Educational Solutions ("noi", "al nostru"),
                  respectăm confidențialitatea dvs. și ne angajăm să protejăm
                  datele personale. Această politică explică modul în care
                  colectăm, folosim și protejăm informațiile dvs. când vizitați
                  site-ul sau faceți achiziții.
                </p>
                <p>
                  Prin utilizarea serviciilor noastre, confirmați că ați citit
                  și înțeles această politică.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
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
              <Separator className="my-3 sm:my-4 md:my-6" />
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
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="cookies">
                <h2>4. Cookie-uri și tehnologii</h2>
                <p>
                  Folosim cookie-uri și tehnologii similare pentru a colecta
                  informații despre activitatea dvs. Puteți seta browserul să
                  refuze cookie-urile sau să vă notifice când sunt utilizate.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="partajare">
                <h2>5. Partajarea datelor</h2>
                <ul>
                  <li>Furnizori de servicii (curierat, plăți, marketing)</li>
                  <li>Autorități legale, când este necesar</li>
                  <li>Parteneri de marketing (cu acordul dvs.)</li>
                </ul>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="securitate">
                <h2>6. Securitatea datelor</h2>
                <p>
                  <Icon
                    icon={StatusIcons.Info}
                    variant="info"
                    size="sm"
                    decorative
                    className="inline align-text-bottom mr-1"
                  />
                  Implementăm măsuri tehnice și organizatorice pentru a proteja
                  datele personale. Totuși, nicio metodă nu este 100% sigură.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="copii">
                <h2>7. Confidențialitatea copiilor</h2>
                <p>
                  Serviciile noastre nu sunt destinate copiilor sub 13 ani. Nu
                  colectăm intenționat date de la copii sub această vârstă.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
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
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="modificari">
                <h2>9. Modificări ale politicii</h2>
                <p>
                  Putem actualiza această politică periodic. Vom publica
                  modificările pe această pagină și vom actualiza data.
                </p>
              </section>
              <Separator className="my-3 sm:my-4 md:my-6" />
              <section id="contact">
                <h2>10. Contact</h2>
                <p>
                  Pentru întrebări despre confidențialitate, ne puteți contacta
                  la{" "}
                  <a href="mailto:webira.rem.srl@gmail.com">
                    webira.rem.srl@gmail.com
                  </a>{" "}
                  sau la adresa: TechTots Educational Solutions, Mehedinti
                  54-56, Bl D5, sc 2, apt 70, Cluj-Napoca, Cluj, România.
                </p>
                <p>
                  Telefon: <a href="tel:+40771248029">+40 771 248 029</a>
                  <br />
                  Program: Luni-Vineri, 9:00 AM - 6:00 PM CET
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
                <Link href="/contact">
                  Contactați Suportul TechTots Educational Solutions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
