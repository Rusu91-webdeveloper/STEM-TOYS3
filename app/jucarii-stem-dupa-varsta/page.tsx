import type { Metadata } from "next";
import React from "react";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "metaTitle" as any,
  description: "metaDescription" as any,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/jucarii-stem-dupa-varsta",
  translations: {
    ro: {
      title: "Jucării STEM Perfecte pentru Fiecare Vârstă",
      description:
        "Recomandări pe grupe de vârstă: 3-5, 6-8, 9-12, 13+ cu beneficii clare.",
    },
    en: {
      title: "STEM Toys by Age Group",
      description:
        "Age-specific STEM toy recommendations: 3-5, 6-8, 9-12, 13+ with benefits.",
    },
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jucării STEM după vârstă",
      author: {
        "@type": "Person",
        name: "TechTots Editorial",
        url: "https://www.techtots.ro/about",
      },
      dateModified: new Date().toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Ce jucării STEM sunt potrivite pentru 3–5 ani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Alege jocuri senzoriale, sortare, construcții mari și activități de numărare. Simplu, repetabil, cu feedback imediat.",
          },
        },
        {
          "@type": "Question",
          name: "Cum progresez de la 6–8 la 9–12 ani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "De la programare vizuală și kituri scurte la robotică entry-level și proiecte de inginerie pe mai multe zile.",
          },
        },
        {
          "@type": "Question",
          name: "Ce opțiuni există pentru 13+ ani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Proiecte reale cu microcontrolere, imprimare 3D, robotică avansată și interdisciplinaritate (eco, artă, mobilitate).",
          },
        },
      ],
    },
  ],
});

export default function StemByAgePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">
        Jucării STEM Perfecte pentru Fiecare Vârstă
      </h1>
      <p className="text-xs text-muted-foreground mb-6">
        By TechTots Editorial · Updated {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-muted-foreground mb-8">
        Găsește rapid jucării potrivite pentru vârsta copilului și obiectivele
        tale educaționale. Listele includ beneficii de dezvoltare și link-uri
        către categorii relevante.
      </p>
      <div className="mb-8 rounded-md border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Pe scurt</h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>3–5: senzorial, sortare, construcții mari.</li>
          <li>
            6–8: programare vizuală, experimente scurte, mecanisme simple.
          </li>
          <li>
            9–12: robotică entry-level, circuite, proiecte pe mai multe zile.
          </li>
          <li>13+: microcontrolere, imprimare 3D, proiecte reale.</li>
          <li>Crește dificultatea treptat și oferă feedback pe efort.</li>
        </ul>
      </div>

      <nav aria-label="Cuprins" className="mb-10 border rounded-md p-4">
        <h2 className="font-semibold mb-3">Cuprins</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>
            <a className="underline" href="#3-5">
              3–5 ani
            </a>
          </li>
          <li>
            <a className="underline" href="#6-8">
              6–8 ani
            </a>
          </li>
          <li>
            <a className="underline" href="#9-12">
              9–12 ani
            </a>
          </li>
          <li>
            <a className="underline" href="#13plus">
              13+ ani
            </a>
          </li>
          <li>
            <a className="underline" href="#sfaturi">
              Sfaturi de alegere
            </a>
          </li>
        </ol>
      </nav>

      <section id="3-5" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">3–5 ani</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>Jocuri senzoriale, sortare culori/forme</li>
          <li>Seturi de construcții mari, blocuri magnetice</li>
          <li>Activități de numărare și potrivire</li>
        </ul>
        <p className="text-sm">
          Explorează{" "}
          <a className="underline" href="/categories/mathematics">
            Matematică
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/engineering">
            Inginerie
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          În această etapă, accentul este pe explorare senzorială, motricitate
          fină și dezvoltarea limbajului. Alege jucării care invită la atingere,
          clasificare și descriere (moale/tare, mare/mic, culori/forme).
          Seturile de construcție cu piese mari cresc toleranța la frustrare și
          oferă feedback rapid (ce cade, ce stă). Evită regulile complicate;
          alege activități scurte, repetabile, cu variații (aceeași sarcină,
          culori diferite). Încurajează întrebări „de ce” și denumirea pașilor
          („pun, împing, număr”).
        </p>
      </section>

      <section id="6-8" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">6–8 ani</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>Programare vizuală, puzzle-uri logice</li>
          <li>Kiturile științifice entry-level</li>
          <li>Seturi de construcție cu mecanisme simple</li>
        </ul>
        <p className="text-sm">
          Vezi{" "}
          <a className="underline" href="/categories/technology">
            Tehnologie
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/science">
            Știință
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          Copiii pot urmări instrucțiuni pas-cu-pas și încep să se bucure de
          provocări cu reguli simple. Programarea vizuală (blocuri) introduce
          secvențierea și cauză-efect, iar puzzle-urile cresc răbdarea și
          flexibilitatea cognitivă. În știință, alegeți kituri cu experimente
          scurte, sigure, care cer observație și concluzii („Ce s-a schimbat?”).
          La construcții, mecanismele simple (pârghii, roți dințate) sunt ideale
          pentru a face legătura între teorie și rezultat.
        </p>
      </section>

      <section id="9-12" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">9–12 ani</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>Robotică entry-level, circuite și senzori</li>
          <li>Proiecte de inginerie la scară mică</li>
          <li>Probleme matematice și jocuri strategice</li>
        </ul>
        <p className="text-sm">
          Recomandăm{" "}
          <a className="underline" href="/categories/engineering">
            Inginerie
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/mathematics">
            Matematică
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          La această vârstă, copiii pot planifica proiecte pe mai multe zile și
          pot depana erori. Seturile de robotică entry-level, circuitele cu
          senzori și proiectele de inginerie stimulează gândirea sistemică și
          documentarea procesului. Jocurile strategice și problemele deschise
          dezvoltă capacitatea de a compara soluții și de a justifica alegeri.
          Căutați kituri extensibile (piese suplimentare, proiecte online)
          pentru a susține progresul.
        </p>
      </section>

      <section id="13plus" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">13+ ani</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>Robotică avansată, imprimare 3D</li>
          <li>Proiecte electronice și microcontrolere</li>
          <li>Proiecte interdisciplinare STEM</li>
        </ul>
        <p className="text-sm">
          Descoperă{" "}
          <a className="underline" href="/categories/technology">
            Tehnologie
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/engineering">
            Inginerie
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          Adolescenții au nevoie de autonomie, proiecte reale și rezultate
          vizibile. Microcontrolerele, imprimarea 3D și seturile de robotică
          avansată oferă context pentru design, prototipare și iterație.
          Încurajați documentarea (jurnal, video), lucrul în echipă și
          conectarea cu comunități (cluburi, hackathoane). Legați proiectele de
          interese reale (eco, mobilitate, artă) pentru a crește motivația.
        </p>
      </section>

      <section id="sfaturi" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">Sfaturi de alegere</h2>
        <ol className="list-decimal ml-6 text-muted-foreground space-y-2">
          <li>Alege după interesul copilului pentru motivație intrinsecă.</li>
          <li>Progresează treptat de la simplu la complex.</li>
          <li>Preferă seturi cu ghiduri clare și resurse online.</li>
          <li>Verifică standardele de siguranță și materialele.</li>
        </ol>
        <p className="text-muted-foreground">
          Păstrați sesiuni scurte și frecvente pentru învățare susținută.
          Alternați proiecte individuale cu activități în echipă. Dacă apare
          frustrarea, micșorați provocarea sau împărțiți sarcina în pași mai
          mici. Oferiți feedback pozitiv pe efort (nu doar pe rezultat) pentru a
          construi perseverența și bucuria explorării.
        </p>
        <div className="mt-2">
          <a
            href="/products"
            className="inline-block px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Explorează produsele
          </a>
        </div>
      </section>
    </div>
  );
}
