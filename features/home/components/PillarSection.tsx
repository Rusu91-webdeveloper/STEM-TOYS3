import { ArrowUpRight, BookOpen, Brain, CircleHelp, Gift } from "lucide-react";
import Link from "next/link";

const items = [
  {
    title: "Cadouri 6–8 ani",
    description: "Idei de cadouri pentru următoarea descoperire.",
    href: "/cadouri-stem-6-8-ani",
    icon: Gift,
  },
  {
    title: "Beneficii STEM",
    description: "Cum susține joaca logica și creativitatea.",
    href: "/beneficiile-jucariilor-stem",
    icon: Brain,
  },
  {
    title: "Întrebări frecvente",
    description: "Răspunsuri despre livrare, vârstă și siguranță.",
    href: "/faq",
    icon: CircleHelp,
  },
  {
    title: "Ghid STEM 2026",
    description: "Repere practice pentru o alegere potrivită.",
    href: "/ghid-jucarii-stem-2026",
    icon: BookOpen,
  },
];

export function PillarSection() {
  return (
    <section
      aria-labelledby="home-themes"
      className="mx-auto w-full max-w-7xl px-5 py-9 sm:px-8"
    >
      <h2 id="home-themes" className="mb-5 text-xl font-bold text-[#0b1b32]">
        Mai ușor de ales
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group border-t border-slate-300 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Icon className="mb-3 h-5 w-5 text-blue-700" aria-hidden />
            <h3 className="flex items-center justify-between gap-2 text-sm font-bold text-slate-950">
              {title}
              <ArrowUpRight size={16} aria-hidden />
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PillarSection;
