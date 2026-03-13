import Link from "next/link";

import type { SearchRouteCard } from "@/lib/seo/regional-search";

type InternalLinkCardsProps = {
  eyebrow: string;
  title: string;
  description: string;
  links: SearchRouteCard[];
};

export default function InternalLinkCards({
  eyebrow,
  title,
  description,
  links,
}: InternalLinkCardsProps) {
  if (links.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map(link => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="group rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_45px_-30px_rgba(14,116,144,0.45)]"
          >
            <p className="text-lg font-bold text-slate-900 group-hover:text-sky-800">
              {link.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {link.description}
            </p>
            <span className="mt-4 inline-flex text-sm font-semibold text-sky-700">
              Vezi pagina
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
