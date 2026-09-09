"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ages = [
  {
    age: "3–5 ani",
    group: "PRESCHOOL_3_5",
    benefit:
      "Forme, culori și construcții simple pentru coordonare și primele descoperiri.",
  },
  {
    age: "6–8 ani",
    group: "ELEMENTARY_6_8",
    benefit:
      "Experimente și jocuri de logică pentru întrebările mari ale celor mici.",
  },
  {
    age: "9–12 ani",
    group: "MIDDLE_SCHOOL_9_12",
    benefit:
      "Proiecte de construit și provocări STEM pentru idei tot mai îndrăznețe.",
  },
  {
    age: "13+ ani",
    group: "TEENS_13_PLUS",
    benefit:
      "Circuite, inginerie și robotică pentru următorul proiect personal.",
  },
];

export function AgeCategoriesSection({
  t: _t,
}: {
  t: (key: string, fallback?: string) => string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const expanded = hovered ?? active;
  return (
    <section
      aria-labelledby="home-ages"
      className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8"
    >
      <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <h2
          id="home-ages"
          className="text-xl font-bold tracking-tight text-slate-950"
        >
          Alege după vârstă
        </h2>
        <p className="text-sm text-slate-600">
          Selectat cu grijă pentru fiecare etapă.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-4 sm:gap-3">
        {ages.map(item => (
          <div
            key={item.group}
            className="group rounded-xl border border-slate-200 bg-white"
            onPointerEnter={event => {
              if (event.pointerType === "mouse") setHovered(item.group);
            }}
            onPointerLeave={() => setHovered(null)}
          >
            <button
              type="button"
              aria-expanded={expanded === item.group}
              aria-controls={`preview-${item.group}`}
              onClick={() =>
                setActive(value => (value === item.group ? null : item.group))
              }
              onKeyDown={event => {
                if (event.key === "Escape") {
                  setActive(null);
                  setHovered(null);
                }
              }}
              className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold text-[#0b1b32] hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {item.age}
              <ChevronDown size={16} aria-hidden />
            </button>
            <div
              id={`preview-${item.group}`}
              hidden={expanded !== item.group}
              className="px-4 pb-3"
            >
              <p className="mb-2 text-xs leading-5 text-slate-600">
                {item.benefit}
              </p>
              <Link
                href={`/products?ageGroup=${item.group}`}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 underline underline-offset-4"
              >
                Vezi jucăriile <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
