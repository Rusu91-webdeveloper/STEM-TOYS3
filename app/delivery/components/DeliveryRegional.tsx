import { getAppConfig } from "@/lib/config/app-config";
import type { LogisticsPillar } from "../data";

export async function DeliveryRegional({ logisticsPillars }: { logisticsPillars: LogisticsPillar[] }) {
  const cfg = await getAppConfig();
  const phoneRaw = cfg.contactPhone.replace(/[^0-9]/g, "");

  return (
    <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/30">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Pilonii procesului nostru logistic
          </h2>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">
            Procesăm fiecare comandă cu obiectivul clar de a respecta termenul maxim de 7 zile
            lucrătoare, indiferent de destinație. Iată cum lucrăm în fiecare etapă.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {logisticsPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow hover:border-sky-500/30 hover:shadow-sky-500/10"
              >
                <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{pillar.summary}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {pillar.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-sky-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6">
          <div className="rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20 p-6 shadow-sky-500/20">
            <h3 className="text-lg font-semibold text-white">Promisiunea TechTots</h3>
            <p className="mt-3 text-sm text-slate-100">
              Dacă livrarea ta depășește <strong>7 zile lucrătoare</strong>, primești automat un
              voucher de transport gratuit la următoarea comandă și acces la consultanță prioritară
              pentru următoarea achiziție STEM.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-slate-100">
              <p className="font-semibold text-white">Cum revendici garanția:</p>
              <ol className="mt-2 space-y-2">
                <li>1. Trimite dovada întârzierii la {cfg.contactEmail}</li>
                <li>2. Primești voucherul în cel mai scurt timp posibil (valabil 60 de zile)</li>
                <li>3. Livrăm următoarea comandă cu prioritate</li>
              </ol>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Suport live pentru livrare</h3>
            <p className="mt-2 text-sm text-slate-200">
              Oferim chat live cu specialiști logistici, WhatsApp Business și hotline telefonic 7/7
              între 08:00 și 21:00.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-100">
              <p>
                📞 <strong>Telefon:</strong>{" "}
                <a href={`tel:${cfg.contactPhone}`} className="text-sky-300 underline underline-offset-4">
                  {cfg.storePhoneFormatted}
                </a>
              </p>
              <p>
                💬 <strong>WhatsApp:</strong>{" "}
                <a
                  href={`https://wa.me/${phoneRaw}`}
                  className="text-sky-300 underline underline-offset-4"
                >
                  wa.me/{phoneRaw}
                </a>
              </p>
              <p>
                ✉️ <strong>Email:</strong>{" "}
                <a
                  href={`mailto:${cfg.contactEmail}`}
                  className="break-all text-sky-300 underline underline-offset-4"
                >
                  {cfg.contactEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
