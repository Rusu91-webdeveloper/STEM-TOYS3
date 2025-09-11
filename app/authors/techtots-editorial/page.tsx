import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "metaTitle" as any,
  description: "metaDescription" as any,
  pathWithoutLocale: "/authors/techtots-editorial",
  translations: {
    ro: {
      title: "TechTots Editorial | Autor",
      description:
        "Profilul autorului: TechTots Editorial. Expertiză în jucării STEM, educație și ghiduri pentru părinți.",
    },
    en: {
      title: "TechTots Editorial | Author",
      description:
        "Author profile: TechTots Editorial. Expertise in STEM toys, education, and parent guides.",
    },
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "TechTots Editorial",
    url: "https://www.techtots.ro/authors/techtots-editorial",
    sameAs: [
      "https://www.linkedin.com/company/techtots-romania/",
      "https://www.instagram.com/techtots_magazin/",
    ],
  },
});

export default function TechTotsEditorialAuthorPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">TechTots Editorial</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Autor și editor de conținut educațional STEM
      </p>

      <div className="space-y-4 text-muted-foreground mb-8">
        <p>
          Echipa TechTots Editorial creează ghiduri și articole despre jucării
          STEM, selecție pe vârste, beneficii educaționale și activități
          practice pentru acasă și școală.
        </p>
        <p>
          Misiunea noastră este să ajutăm părinții și educatorii să aleagă
          jucăriile potrivite și să le integreze în învățarea de zi cu zi.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Articole recomandate</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <Link className="underline" href="/ghid-jucarii-stem-2025">
            Ghidul Complet al Jucăriilor STEM 2025
          </Link>
        </li>
        <li>
          <Link className="underline" href="/jucarii-stem-dupa-varsta">
            Jucării STEM după vârstă
          </Link>
        </li>
        <li>
          <Link className="underline" href="/beneficiile-jucariilor-stem">
            Beneficiile jucăriilor STEM
          </Link>
        </li>
      </ul>
    </div>
  );
}
