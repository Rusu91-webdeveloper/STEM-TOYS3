"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  Icon,
  StatusIcons,
  CommunicationIcons,
} from "@/components/ui/icon-system";
import { Separator } from "@/components/ui/separator";

export default function GDPRPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="relative h-[220px] sm:h-[280px] md:h-[320px] w-full mb-8">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Conformitate GDPR"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-indigo-600/60 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Conformitate GDPR
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
            Informații despre protecția datelor cu caracter personal și
            drepturile dvs. pe platforma TechTots.
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
              Conformitate GDPR
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Ultima actualizare: Iulie 2025
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-indigo prose-lg max-w-none">
              <section id="intro">
                <h2>1. Introducere</h2>
                <p>
                  Această pagină explică modul în care TechTots respectă
                  Regulamentul (UE) 2016/679 (GDPR) și Legea nr. 190/2018 din
                  România.
                </p>
              </section>
              <Separator className="my-6" />
              <section id="drepturi">
                <h2>2. Drepturile dumneavoastră</h2>
                <ul>
                  <li>Dreptul de acces la datele personale</li>
                  <li>Dreptul la rectificare</li>
                  <li>
                    Dreptul la ștergerea datelor („dreptul de a fi uitat”)
                  </li>
                  <li>Dreptul la restricționarea prelucrării</li>
                  <li>Dreptul la portabilitatea datelor</li>
                  <li>Dreptul la opoziție</li>
                  <li>
                    Dreptul de a nu fi supus unui proces decizional individual
                    automatizat, inclusiv crearea de profiluri
                  </li>
                  <li>Dreptul de a depune plângere la ANSPDCP</li>
                </ul>
              </section>
              <Separator className="my-6" />
              <section id="exercitare">
                <h2>3. Cum puteți exercita drepturile</h2>
                <p>
                  Pentru orice solicitare privind datele personale, ne puteți
                  contacta la adresa de email{" "}
                  <a href="mailto:privacy@techtots.com">privacy@techtots.com</a>{" "}
                  sau prin formularul de <Link href="/contact">contact</Link>.
                </p>
              </section>
              <Separator className="my-6" />
              <section id="dpo">
                <h2>4. Responsabil cu protecția datelor (DPO)</h2>
                <p>
                  Pentru întrebări legate de protecția datelor, contactați
                  responsabilul nostru la{" "}
                  <a href="mailto:privacy@techtots.com">privacy@techtots.com</a>
                  .
                </p>
              </section>
              <Separator className="my-6" />
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
              <Separator className="my-6" />
              <section id="legislatie">
                <h2>6. Legislație relevantă</h2>
                <ul>
                  <li>Regulamentul (UE) 2016/679 (GDPR)</li>
                  <li>
                    Legea nr. 190/2018 privind măsuri de punere în aplicare a
                    GDPR
                  </li>
                </ul>
              </section>
              <Separator className="my-6" />
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
