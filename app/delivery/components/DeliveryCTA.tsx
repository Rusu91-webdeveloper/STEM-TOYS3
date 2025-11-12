import Link from "next/link";

export function DeliveryCTA() {
  return (
    <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
      <div className="overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20 p-8 text-center shadow-sky-500/20">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Pregătit pentru livrare rapidă?</h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-100 sm:text-base">
          Alătură-te comunității TechTots și oferă copilului tău jucării STEM livrate sigur,
          transparent și garantat în maximum <strong>7 zile lucrătoare</strong>. Suntem alături de
          tine la fiecare pas.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
          >
            Descoperă produsele disponibile acum
          </Link>
          <Link
            href="/faq"
            className="flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-slate-100 backdrop-blur transition hover:border-white/40"
          >
            Vezi toate întrebările frecvente
          </Link>
        </div>
      </div>
    </section>
  );
}


