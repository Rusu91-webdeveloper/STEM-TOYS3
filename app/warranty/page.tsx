import { getAppConfig } from "@/lib/config/app-config";
import { Card } from "@/components/ui/card";

export { metadata } from "./metadata";

export default async function WarrantyPage() {
  const cfg = await getAppConfig();
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(16,185,129,0.07),_transparent_60%)]" />

      <div className="relative z-10 py-8 sm:py-10 lg:py-16">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/75 to-slate-950/90 p-8 shadow-xl shadow-black/40 backdrop-blur sm:p-10">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
                TechTots Warranty
              </span>
              <h1 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                Garanția Legală
              </h1>
              <p className="mt-4 text-sm text-slate-200 sm:text-base md:text-lg">
                Protecție completă de 2 ani pentru toate produsele TechTots
              </p>
              <div className="mt-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-2xl font-bold text-emerald-200 shadow-inner shadow-emerald-500/30 sm:h-18 sm:w-18">
                  2
                </div>
              </div>
            </div>
          </div>

          <section className="mx-auto mt-10 max-w-5xl space-y-8 sm:mt-12 lg:space-y-12">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-8">
              <h2 className="mb-5 flex items-center gap-3 text-base font-semibold text-slate-900 sm:text-lg md:text-2xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-700">
                  ✓
                </span>
                Garanția Legală (2 Ani)
              </h2>

              <div className="prose prose-sm max-w-none text-slate-700 sm:prose-base">
                <p className="leading-relaxed">
                  Toate produsele noastre beneficiază de{" "}
                  <strong>garanție legală de 2 ani</strong> împotriva defectelor
                  de conformitate, conform legislației UE. Această garanție este
                  gratuită și se aplică automat. Procesăm cererile de garanție
                  în coordonare cu furnizorii noștri pentru a asigura rezolvarea
                  rapidă.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 md:gap-6">
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-inner shadow-emerald-500/20">
                    <h3 className="text-sm font-semibold text-emerald-800 sm:text-base md:text-lg">
                      Primele 12 luni
                    </h3>
                    <p className="mt-2 text-xs text-emerald-900/80 sm:text-sm">
                      Nu trebuie să demonstrezi că defectul exista la momentul
                      livrării. Se presupune că defectul era prezent la livrare.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 shadow-inner shadow-sky-500/20">
                    <h3 className="text-sm font-semibold text-sky-800 sm:text-base md:text-lg">
                      Următoarele 12 luni
                    </h3>
                    <p className="mt-2 text-xs text-sky-900/80 sm:text-sm">
                      Produsul rămâne sub garanție, dar s-ar putea să fie nevoie
                      să demonstrezi că defectul nu a fost cauzat de utilizarea
                      normală.
                    </p>
                  </div>
                </div>

                <h3 className="mt-7 text-sm font-semibold text-slate-900 sm:text-base md:text-lg">
                  Produsul poate fi returnat sub garanție dacă:
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-700 sm:text-sm md:text-base">
                  <li>Nu corespunde descrierii produsului</li>
                  <li>Are calități diferite față de modelul prezentat</li>
                  <li>
                    Nu este potrivit pentru scopul său normal de utilizare
                  </li>
                  <li>
                    Nu prezintă calitatea și performanța normale pentru produse
                    similare
                  </li>
                  <li>
                    Nu a fost instalat corect din cauza instrucțiunilor
                    deficitare
                  </li>
                </ul>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 via-indigo-900/50 to-slate-950/80 p-6 text-slate-100 shadow-xl shadow-emerald-500/30 sm:p-8">
              <h2 className="text-lg font-semibold text-white sm:text-xl md:text-2xl">
                Contactează-ne pentru Garanție
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 md:gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                    📞 Suport Garanție
                  </h3>
                  <div className="mt-3 space-y-2 text-xs text-slate-100 sm:text-sm">
                    <p>
                      📧 Email:{" "}
                      <a
                        href={`mailto:${cfg.supportEmail}`}
                        className="text-emerald-100 underline underline-offset-4 hover:text-white"
                      >
                        {cfg.supportEmail}
                      </a>
                    </p>
                    <p>
                      📱 Telefon:{" "}
                      <a
                        href={`tel:${cfg.contactPhone}`}
                        className="text-emerald-100 underline underline-offset-4 hover:text-white"
                      >
                        {cfg.storePhoneFormatted}
                      </a>
                    </p>
                    <p>🕒 Program: Luni - Duminică, 9:00 - 18:00</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                    📍 Centrul de Service
                  </h3>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-slate-100 sm:text-sm">
                    <p>TechTots Educational Solutions</p>
                    <p>Departamentul Garanții</p>
                    <p>Str. Mehedinți 54-56</p>
                    <p>400000 Cluj-Napoca, România</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-slate-100 sm:text-sm">
                💡 <strong>Sfat:</strong> Pentru aplicarea garanției, poți
                folosi și sistemul online prin{" "}
                <a
                  href="/account/orders"
                  className="text-emerald-100 underline underline-offset-4 hover:text-white"
                >
                  Comenzile Mele
                </a>{" "}
                - selectează "Problemă cu Produsul" în locul returnării.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-8">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg md:text-xl">
                📋 Baza Legală
              </h2>
              <div className="mt-4 space-y-2 text-xs text-slate-700 sm:text-sm">
                <p>Această politică de garanție se bazează pe:</p>
                <ul className="ml-3 list-disc space-y-1 text-slate-700 sm:ml-4">
                  <li>
                    Directiva UE 2019/771 privind contractele de vânzare a
                    bunurilor
                  </li>
                  <li>
                    Directiva UE 2019/770 privind contractele pentru furnizarea
                    de conținut digital
                  </li>
                  <li>
                    Legea română nr. 449/2003 privind vânzarea de bunuri de
                    consum
                  </li>
                  <li>
                    Ordonanța Guvernului nr. 21/1992 privind protecția
                    consumatorilor
                  </li>
                </ul>
                <p className="mt-4 text-slate-500">
                  <strong>Ultimă actualizare:</strong>{" "}
                  {new Date().toLocaleDateString("ro-RO")} | Versiunea 1.0
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
