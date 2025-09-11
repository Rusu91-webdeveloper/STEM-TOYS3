import type { Metadata } from "next";
import React from "react";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "metaTitle" as any,
  description: "metaDescription" as any,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/beneficiile-jucariilor-stem",
  translations: {
    ro: {
      title:
        "De ce Sunt Importante Jucăriile STEM pentru Dezvoltarea Copilului",
      description:
        "Beneficii educaționale: gândire critică, logică, creativitate, colaborare, autonomie.",
    },
    en: {
      title: "Educational Benefits of STEM Toys",
      description:
        "How STEM toys build critical thinking, logic, creativity, collaboration, autonomy.",
    },
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Beneficiile jucăriilor STEM",
      author: {
        "@type": "Person",
        name: "TechTots Editorial",
        url: "https://www.techtots.ro/about",
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Ce beneficii dezvoltă jucăriile STEM?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Gândire critică, logică, creativitate, colaborare, autonomie și transfer spre performanța școlară.",
          },
        },
        {
          "@type": "Question",
          name: "Cum cresc perseverența și autonomia?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prin proiecte iterative, jurnal de proiect, feedback pe efort și normalizarea erorilor ca pas de învățare.",
          },
        },
        {
          "@type": "Question",
          name: "Cum conectez joaca STEM la viața reală?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Alege teme reale (energie, mediu), cere prezentări (poster/video) și folosește rubrici simple de auto-evaluare.",
          },
        },
      ],
    },
  ],
});

export default function StemBenefitsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">
        De ce Sunt Importante Jucăriile STEM pentru Dezvoltarea Copilului
      </h1>
      <p className="text-xs text-muted-foreground mb-6">
        By TechTots Editorial · Updated {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-muted-foreground mb-8">
        Învață cum jucăriile STEM accelerează dezvoltarea cognitivă, socială și
        emoțională prin activități practice și proiecte captivante.
      </p>
      <div className="mb-8 rounded-md border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Pe scurt</h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>Gândire critică, logică, creativitate, colaborare.</li>
          <li>Perseverență prin proiecte iterative și feedback pe efort.</li>
          <li>Transfer spre performanța școlară și abilități reale.</li>
          <li>Leagă activitățile de teme reale (energie, mediu, sănătate).</li>
          <li>Încurajează prezentări și auto-reflecție ghidată.</li>
        </ul>
      </div>

      <nav aria-label="Cuprins" className="mb-10 border rounded-md p-4">
        <h2 className="font-semibold mb-3">Cuprins</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>
            <a className="underline" href="#gandire">
              Gândire critică și logică
            </a>
          </li>
          <li>
            <a className="underline" href="#creativitate">
              Creativitate și inovație
            </a>
          </li>
          <li>
            <a className="underline" href="#colaborare">
              Colaborare și comunicare
            </a>
          </li>
          <li>
            <a className="underline" href="#autonomie">
              Autonomie și perseverență
            </a>
          </li>
          <li>
            <a className="underline" href="#transfer">
              Transfer spre școală și viața reală
            </a>
          </li>
        </ol>
      </nav>

      <section id="gandire" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Gândire critică și logică</h2>
        <p className="text-muted-foreground">
          Puzzle-urile, problemele deschise și programarea vizuală dezvoltă
          abilități de analiză, planificare și rezolvare de probleme.
        </p>
        <p className="text-muted-foreground">
          Alternați sarcini cu răspuns unic (corect/greșit) cu provocări
          deschise (mai multe soluții posibile). Încurajați copiii să-și explice
          pașii, să compare strategii și să identifice „de ce a funcționat”.
          Folosiți limbajul procesului: observ, presupun, testez, ajustez.
        </p>
      </section>

      <section id="creativitate" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Creativitate și inovație</h2>
        <p className="text-muted-foreground">
          Seturile de construcții, proiectele de inginerie și electronica
          creativă încurajează generarea de idei și design iterativ.
        </p>
        <p className="text-muted-foreground">
          Oferiți „brief-uri” scurte (Construiește un pod care să țină X
          greutate) și timp pentru prototipare. Validați încercările, nu doar
          rezultatul final. Introduceți restricții creative (număr limitat de
          piese) pentru a stimula soluții ingenioase.
        </p>
      </section>

      <section id="colaborare" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Colaborare și comunicare</h2>
        <p className="text-muted-foreground">
          Proiectele în echipă dezvoltă leadership, împărțirea rolurilor și
          comunicarea clară.
        </p>
        <p className="text-muted-foreground">
          Stabiliți roluri (designer, constructor, tester) și reguli simple de
          feedback (specific, pozitiv, constructiv). Alternați rolurile pentru
          echitate și învățare holistică.
        </p>
      </section>

      <section id="autonomie" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Autonomie și perseverență</h2>
        <p className="text-muted-foreground">
          Copiii învață să gestioneze eșecul constructiv, să depaneze și să
          rămână motivați până la rezultat.
        </p>
        <p className="text-muted-foreground">
          Folosiți jurnal de proiect (Ce am încercat? Ce schimb?) și sărbătoriți
          micro-progresele. Normalizați eșecul ca parte a procesului („Nu a mers
          încă”). Oferiți timp de „cooldown” când frustrarea e mare.
        </p>
      </section>

      <section id="transfer" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">
          Transfer spre școală și viața reală
        </h2>
        <p className="text-muted-foreground">
          Competențele STEM susțin performanța școlară la matematică și științe
          și se transferă în abilități de viață: planificare, decizii, gândire
          sistemică.
        </p>
        <p className="text-muted-foreground">
          Legați proiectele de contexte reale (energie, mediu, sănătate).
          Invitați copiii să prezinte rezultatele (poster, video). Folosiți
          rubrici simple de evaluare pentru auto-reflecție: Claritate,
          Creativitate, Rigoare.
        </p>
        <p className="text-sm">
          Explorează categoriile noastre:{" "}
          <a className="underline" href="/categories/science">
            Știință
          </a>
          ,{" "}
          <a className="underline" href="/categories/technology">
            Tehnologie
          </a>
          ,{" "}
          <a className="underline" href="/categories/engineering">
            Inginerie
          </a>
          ,{" "}
          <a className="underline" href="/categories/mathematics">
            Matematică
          </a>
          .
        </p>
        <div className="mt-2">
          <a
            href="/products"
            className="inline-block px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Vezi produsele
          </a>
        </div>
      </section>
    </div>
  );
}
