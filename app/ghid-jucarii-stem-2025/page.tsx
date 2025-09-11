import type { Metadata } from "next";
import React from "react";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "metaTitle" as any,
  description: "metaDescription" as any,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/ghid-jucarii-stem-2025",
  translations: {
    ro: {
      title: "Ghidul Complet al Jucăriilor STEM pentru Copii în 2025",
      description:
        "Peste 3000 de cuvinte: categorii STEM, grupe de vârstă, beneficii, top recomandări.",
    },
    en: {
      title: "Ultimate STEM Toys Guide 2025",
      description:
        "Long-form guide: STEM categories, age groups, benefits, and top picks.",
    },
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Ghidul Complet al Jucăriilor STEM în 2025",
      inLanguage: ["ro", "en"],
      wordCount: 3000,
      author: {
        "@type": "Person",
        name: "TechTots Editorial",
        url: "https://www.techtots.ro/about",
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://www.techtots.ro/ghid-jucarii-stem-2025",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Cum aleg jucăria STEM potrivită pentru vârsta copilului?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Folosește recomandările pe grupe de vârstă din ghid și asigură-te că dificultatea crește gradual. Alege seturi cu proiecte progresive și ghiduri clare.",
          },
        },
        {
          "@type": "Question",
          name: "Sunt jucăriile STEM sigure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Toate produsele listate respectă standardele de siguranță. Verifică indicațiile de vârstă și folosește supraveghere când sunt incluse substanțe sau componente mici.",
          },
        },
        {
          "@type": "Question",
          name: "Ce categorie STEM să aleg pentru început?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pornește de la interesul copilului: experimente (Știință), programare/jocuri (Tehnologie), construcții (Inginerie), logică/jocuri (Matematică).",
          },
        },
      ],
    },
  ],
});

export default function StemGuide2025Page() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">
        Ghidul Complet al Jucăriilor STEM pentru Copii în 2025
      </h1>
      <p className="text-xs text-muted-foreground mb-6">
        By TechTots Editorial · Updated {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-muted-foreground mb-8">
        Alege inteligent jucării STEM adaptate vârstei, intereselor și nivelului
        copilului. Ghidul include recomandări pe categorii STEM, grupe de vârstă
        și sfaturi practice pentru părinți și educatori.
      </p>

      <div className="mb-8 rounded-md border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Pe scurt</h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>Alege după interes și vârstă; crește gradual dificultatea.</li>
          <li>Preferă seturi cu proiecte progresive și ghiduri clare.</li>
          <li>Știință = experimente; Tehnologie = programare/robotică.</li>
          <li>
            Inginerie = construcții/mechanisme; Matematică = jocuri logice.
          </li>
          <li>
            Alternează joaca liberă cu proiecte ghidate și lucrul în echipă.
          </li>
        </ul>
      </div>

      <nav aria-label="Cuprins" className="mb-10 border rounded-md p-4">
        <h2 className="font-semibold mb-3">Cuprins</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>
            <a className="underline" href="#ce-sunt-stem">
              Ce sunt jucăriile STEM
            </a>
          </li>
          <li>
            <a className="underline" href="#categorii">
              Categorii STEM: Știință, Tehnologie, Inginerie, Matematică
            </a>
          </li>
          <li>
            <a className="underline" href="#varsta">
              Recomandări pe vârstă
            </a>
          </li>
          <li>
            <a className="underline" href="#alegere">
              Cum alegi corect jucăria
            </a>
          </li>
          <li>
            <a className="underline" href="#top">
              Top recomandări 2025
            </a>
          </li>
          <li>
            <a className="underline" href="#faq">
              Întrebări frecvente
            </a>
          </li>
        </ol>
      </nav>

      <section id="ce-sunt-stem" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Ce sunt jucăriile STEM</h2>
        <p className="text-muted-foreground">
          Jucăriile STEM stimulează învățarea prin joc în domeniile știință,
          tehnologie, inginerie și matematică. Scopul lor este să traducă
          concepte abstracte în experiențe tactile și vizuale, astfel încât
          copiii să poată explora, testa ipoteze și vedea efectele acțiunilor
          lor în timp real. Spre deosebire de jucăriile pasive, jucăriile STEM
          pun accentul pe experimentare, proiecte practice, prototipare și
          iterare. Fie că este vorba despre construirea unui pod din piese
          modulare, programarea unui robot să urmeze o linie sau observarea unei
          reacții chimice sigure, aceste activități cultivă gândirea critică,
          perseverența și capacitatea de a învăța din greșeli.
        </p>
        <p className="text-muted-foreground">
          Beneficiul major este transferul învățării: abilitățile de analiză,
          logică și lucru în echipă dobândite prin joc devin competențe utile la
          școală și în viața de zi cu zi. În plus, jucăriile STEM sunt excelente
          pentru a descoperi interese: un copil atras de experimente poate
          înclina spre științe, în timp ce altul pasionat de construcții poate
          dezvolta o afinitate pentru inginerie. Recomandarea noastră este să
          alternați provocările, păstrând un echilibru între joacă liberă și
          proiecte ghidate.
        </p>
      </section>

      <section id="categorii" className="space-y-6 mb-10">
        <h2 className="text-2xl font-semibold">Categorii STEM</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Știință</h3>
            <p className="text-muted-foreground">
              Experimente, chimie, fizică și biologie pentru curioșii despre
              lumea din jur. Kiturile bune includ manuale clare, materiale
              sigure și activități progresive (observ, notez, concluzionez).
              Căutați seturi care pun accent pe observație și explicații pe
              înțelesul copiilor, nu doar pe efecte „wow”. Vezi selecția noastră
              la{" "}
              <a className="underline" href="/categories/science">
                /categories/science
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Tehnologie</h3>
            <p className="text-muted-foreground">
              Programare prin jocuri, robotică și electronice ușoare. Pentru
              începători, interfețele de tip „drag-and-drop” sunt ideale, iar pe
              măsură ce cresc, pot trece la limbaje simple. Căutați jucării cu
              proiecte scalabile, senzori integrați și comunități online cu idei
              de extindere. Descoperă recomandări la{" "}
              <a className="underline" href="/categories/technology">
                /categories/technology
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Inginerie</h3>
            <p className="text-muted-foreground">
              Construcții, mecanisme și proiecte hands-on. Un set bun oferă
              stabilitate structurală, diversitate de piese și ghiduri care
              prezintă principii (pârghii, roți dințate, greutate). Este util ca
              proiectele să aibă niveluri de dificultate, astfel încât copiii să
              își poată vedea progresul și să își dezvolte încrederea.
              Inspiră-te din categoria{" "}
              <a className="underline" href="/categories/engineering">
                /categories/engineering
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Matematică</h3>
            <p className="text-muted-foreground">
              Jocuri logice, abac, geometrie și probabilități. Alegeți jocuri
              care introduc concepte treptat, încurajează strategiile și
              discuțiile despre „de ce funcționează”. Pentru copiii reticenți la
              matematică, optați pentru jocuri story-driven sau colaborative
              pentru a crește motivația. Explorează{" "}
              <a className="underline" href="/categories/mathematics">
                /categories/mathematics
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section id="varsta" className="space-y-6 mb-10">
        <h2 className="text-2xl font-semibold">Recomandări pe vârstă</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-2">
          <li>3–5 ani: jocuri senzoriale, sortare, construcții simple</li>
          <li>6–8 ani: kituri științifice, programare vizuală, puzzle-uri</li>
          <li>9–12 ani: robotică entry-level, circuite, proiecte inginerie</li>
          <li>
            13+ ani: imprimare 3D, robotică avansată, proiecte electronice
          </li>
        </ul>
        <p className="text-sm">
          Vezi pagina dedicată:{" "}
          <a className="underline" href="/jucarii-stem-dupa-varsta">
            Jucării STEM după vârstă
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          Sugestie practică: porniți de la abilitățile existente ale copilului
          și creșteți gradual dificultatea. O provocare prea ușoară plictisește,
          una prea grea demotivează. Căutați seturi cu proiecte în pași mici,
          feedback rapid (vizual/auditiv) și oportunități de lucru în echipă.
          Alternați activități scurte de 15–20 de minute cu proiecte mai lungi
          de weekend pentru a menține interesul și pentru a încuraja
          planificarea.
        </p>
      </section>

      <section id="alegere" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Cum alegi corect jucăria</h2>
        <ol className="list-decimal ml-6 text-muted-foreground space-y-2">
          <li>
            Stabilește obiectivul educațional (logică, creativitate,
            colaborare).
          </li>
          <li>Potrivește nivelul de dificultate cu vârsta și interesul.</li>
          <li>Verifică materialele și standardele de siguranță.</li>
          <li>Preferă kituri cu proiecte progresive și ghiduri clare.</li>
        </ol>
        <p className="text-muted-foreground">
          Întreabă-te: „Ce va învăța copilul meu concret din acest set?” și „Cum
          pot contribui eu ca părinte?” Kiturile cu extensii (piese
          suplimentare, proiecte online) asigură durabilitate educațională.
          Verifică dacă există resurse video, comunități sau provocări
          săptămânale pentru a transforma jucăria într-o experiență continuă.
        </p>
      </section>

      <section id="top" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Top recomandări 2025</h2>
        <p className="text-muted-foreground">
          Curând vom publica o listă curată de produse reprezentative pe grupe
          de vârstă și categorii. Până atunci, explorează oferta noastră la{" "}
          <a className="underline" href="/products">
            /products
          </a>
          .
        </p>
      </section>

      <section id="faq" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Întrebări frecvente</h2>
        <p className="text-muted-foreground">
          Pentru răspunsuri rapide despre siguranță, vârstă și retur, vezi{" "}
          <a className="underline" href="/faq">
            /faq
          </a>
          .
        </p>
      </section>

      <section className="space-y-3 mb-4">
        <div className="rounded-lg border bg-gradient-to-r from-indigo-50 to-purple-50 p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Gata să alegi?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Explorează colecția noastră de jucării STEM alese cu grijă.
          </p>
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
