import Link from "next/link";

export function DeliveryHero({ updatedAt }: { updatedAt: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <div className="container relative mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100 backdrop-blur-sm">
            Livrare garantată în maximum 7 zile lucrătoare
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Livrare premium în toată România, construită pentru părinții din 2025
          </h1>
          <p className="mt-4 text-base text-blue-100 sm:text-lg">
            De la confirmarea comenzii până la momentul în care copilul deschide
            pachetul, fiecare etapă este monitorizată digital și optimizată pentru
            ca livrarea să ajungă în maximum 7 zile lucrătoare, chiar și în zonele
            rurale.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:text-base">
            <Link
              href="/track-order"
              className="flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
            >
              Urmărește-mi comanda
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-slate-100 backdrop-blur transition hover:border-white/40"
            >
              Ai întrebări? Discută cu noi
            </Link>
          </div>
          <div className="mt-8 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-blue-100 backdrop-blur">
            <span className="inline-flex items-center gap-1 font-semibold text-white">
              🛰️ Tracking în timp real
            </span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Actualizări trimise la fiecare etapă confirmată</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Ultima actualizare: {updatedAt}</span>
          </div>
        </div>
      </div>
    </section>
  );
}


