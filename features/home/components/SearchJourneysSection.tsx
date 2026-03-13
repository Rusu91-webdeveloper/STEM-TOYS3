import Link from "next/link";

import {
  getRegionalStemLinks,
  nationalCommercialRoutes,
} from "@/lib/seo/regional-search";

export function SearchJourneysSection() {
  const regionalLinks = getRegionalStemLinks(5);

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 px-6 py-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] sm:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
              Cautari Comerciale
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Am organizat magazinul pe felul in care cauta clientii in Romania
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              In loc sa trimitem toata autoritatea doar spre homepage, construim
              pagini dedicate pentru intentiile care aduc cumparatori: STEM,
              educative, inteligente, robotica si selectie dupa varsta.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {nationalCommercialRoutes.map(journey => (
              <Link
                key={journey.href}
                href={journey.href}
                className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_45px_-30px_rgba(14,116,144,0.45)]"
              >
                <p className="text-xl font-bold text-slate-900 group-hover:text-sky-800">
                  {journey.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {journey.description}
                </p>
                <span className="mt-4 inline-flex text-sm font-semibold text-sky-700">
                  Vezi pagina
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">
                Cerere Regionala
              </p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                Sustinem si cautarile locale din orasele care pot aduce volum
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Paginile regionale sunt legate de hubul national STEM si de
                categoriile comerciale. Asa putem raspunde mai bine cautarilor
                de tip "jucarii STEM Bucuresti" sau "jucarii educative Cluj".
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {regionalLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-[1.5rem] border border-slate-200 bg-sky-50/70 p-5 transition hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_45px_-30px_rgba(14,116,144,0.45)]"
                >
                  <p className="text-xl font-bold text-slate-900 group-hover:text-sky-800">
                    {link.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {link.description}
                  </p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-sky-700">
                    Vezi pagina regionala
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
