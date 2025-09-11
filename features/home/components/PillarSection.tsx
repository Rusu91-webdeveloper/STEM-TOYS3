"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type PillarItem = {
  title: string;
  description: string;
  href: string;
  image: string;
  accent: string; // tailwind color class for ring/gradient
};

interface PillarSectionProps {
  items?: PillarItem[];
}

const DEFAULT_PILLARS: PillarItem[] = [
  {
    title: "Ghid 2025",
    description: "Top recomandări și tendințe în jucării STEM pentru 2025.",
    href: "/ghid-jucarii-stem-2025",
    image: "/images/pillars/guide-2025.jpg",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    title: "După vârstă",
    description: "Alege jucării potrivite fiecărei etape de dezvoltare.",
    href: "/jucarii-stem-dupa-varsta",
    image: "/images/pillars/by-age.jpg",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Beneficii STEM",
    description: "De ce STEM contează: învățare prin joacă, curiozitate și abilități-cheie.",
    href: "/beneficiile-jucariilor-stem",
    image: "/images/pillars/benefits.jpg",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    title: "FAQ",
    description: "Întrebări frecvente: livrare, vârstă, siguranță, recomandări.",
    href: "/faq",
    image: "/images/pillars/faq.jpg",
    accent: "from-amber-500 to-orange-500",
  },
];

export function PillarSection({ items = DEFAULT_PILLARS }: PillarSectionProps) {
  return (
    <section aria-label="TechTots Pillars" className="relative py-10 sm:py-12 md:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8 lg:mb-10 text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-semibold tracking-wide">
            Inspirație & Ghidare
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Explorează temele noastre cheie
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Descoperă conținut esențial pentru a face cele mai bune alegeri pentru cei mici.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="relative h-40 sm:h-44 md:h-48">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.accent} opacity-60 group-hover:opacity-70 transition-opacity`} />
              </div>

              <div className="p-4 sm:p-5">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {item.title}
                  <span className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 group-hover:bg-gray-200">Nou</span>
                </h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{item.description}</p>

                <div className="mt-3 flex items-center text-sm font-medium text-indigo-700 group-hover:text-indigo-800">
                  Vezi detalii
                  <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default React.memo(PillarSection);


