import Link from "next/link";
import { Metadata } from "next";

import { appConfig } from "@/lib/config/app-config";
import { auth } from "@/lib/server/auth";
import {
  getStoreSettings,
  getShippingSettings,
} from "@/lib/utils/store-settings";

const lastUpdated = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

// These will be populated with dynamic threshold
const getQuickSummaryLeft = (threshold: string) => [
  "14 zile pentru returnare fără justificare",
  "2 ani garanție legală pentru produse defecte",
  `Returnare gratuită pentru comenzi peste ${threshold} lei`,
];

const quickSummaryRight = [
  "Rambursare completă în 14 zile",
  "Proces sustenabil și eco-friendly",
  "Refuzul la livrare (RTO) poate genera cost logistic tur + retur",
];

const getProcessSteps = (ordersHref: string) => [
  {
    icon: "🛒",
    title: "1. Mergi la Comenzile Mele",
    description: `Accesează <a href="${ordersHref}" class="text-sky-700 underline underline-offset-4 hover:text-sky-600">Comenzile Mele</a> din contul tău`,
  },
  {
    icon: "🔄",
    title: "2. Inițiază Returnarea",
    description: 'Apasă butonul "Returnează Produs" și completează formularul',
  },
  {
    icon: "📧",
    title: "3. Primește Eticheta",
    description: "Vei primi automat un email cu eticheta de returnare",
  },
  {
    icon: "💰",
    title: "4. Primește Rambursarea",
    description: "Rambursare completă în 14 zile de la primirea produsului",
  },
];

const exceptionsList = [
  {
    title: "Produse personalizate",
    description: "Jucării gravate sau customizate la cerere",
  },
  {
    title: "Produse perisabile",
    description: "Articole cu durată limitată de viață",
  },
  {
    title: "Software desigilat",
    description: "Aplicații sau jocuri educaționale activate",
  },
  {
    title: "Conținut digital descarcat",
    description: "Cărți digitale sau resurse educaționale accesate",
  },
  {
    title: "Produse igienice desigilate",
    description: "Pentru siguranța și sănătatea tuturor",
  },
];

const sustainabilityCards = [
  {
    icon: "♻️",
    title: "Reparare și Recondiționare",
    description:
      "Produsele returnate sunt evaluate pentru reparare și recondiționare înainte de a fi considerate pentru reciclare.",
  },
  {
    icon: "📦",
    title: "Ambalaje Reutilizabile",
    description:
      "Folosim ambalaje care pot fi reutilizate pentru returnări și încurajăm clienții să returneze ambalajele pentru reutilizare.",
  },
  {
    icon: "🚚",
    title: "Transport Consolidat",
    description:
      "Colectăm returnările regional pentru a reduce amprenta de carbon prin transport consolidat și optimizat.",
  },
];

const legalItems = [
  "OUG nr. 34/2014 privind drepturile consumatorilor în contractele cu profesioniștii",
  "OUG nr. 140/2021 privind anumite aspecte referitoare la contractele de vânzare de bunuri",
  "Legea nr. 193/2000 privind clauzele abuzive în contractele încheiate cu consumatorii",
  "Planul de Acțiune pentru Economia Circulară al UE (2020)",
  "GDPR și legislația română de protecție a datelor",
];

export const metadata: Metadata = {
  title: "Politica de Returnare | TechTots Educational Solutions",
  description:
    "Politica de returnare pentru produsele STEM educaționale. Informații clare despre retragere în 14 zile, RTO (refuz/nepreluare) și costuri logistice.",
  keywords:
    "politica returnare, returnare produse, garanție, drepturile consumatorului, UE, România",
};

export default async function ReturnsPage() {
  const session = await auth();
  const storeSettings = await getStoreSettings();
  const shippingSettings = await getShippingSettings();

  // Get free shipping threshold from database (synced with /shipping page)
  const freeThreshold = shippingSettings?.freeThreshold?.price || "199";
  const formattedThreshold = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(freeThreshold));

  const contactEmail = storeSettings?.contactEmail ?? appConfig.contactEmail;
  const contactPhone =
    storeSettings?.contactPhone ?? appConfig.storePhoneFormatted;
  const isAuthenticated = Boolean(session?.user);
  const ordersLinkHref = isAuthenticated ? "/account/orders" : "/auth/login";
  const ordersLinkCtaLabel = isAuthenticated
    ? "Mergi la Comenzile Mele"
    : "Autentifică-te pentru a vedea comenzile";
  const processSteps = getProcessSteps(ordersLinkHref);
  const ordersLinkInlineLabel = isAuthenticated
    ? "Comenzile Mele (/account/orders)"
    : "Autentifică-te pentru a accesa Comenzile Mele";

  // Generate dynamic quick summary with threshold
  const quickSummaryLeft = getQuickSummaryLeft(formattedThreshold);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.08),_transparent_60%)]" />

      <div className="relative z-10">
        <section className="container mx-auto px-3 py-8 sm:px-6 sm:py-10 lg:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-950/95 p-6 shadow-xl shadow-black/40 sm:p-10">
            <div className="absolute inset-y-[20%] right-0 hidden w-1/3 rounded-full bg-sky-500/10 blur-3xl lg:block" />
            <div className="relative mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                TechTots Returns
              </span>
              <h1 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                Politica de Returnare
              </h1>
              <p className="mt-4 text-sm text-slate-200 sm:text-lg">
                Returnări simple și sigure pentru produsele tale educaționale
                STEM, cu transparență totală și garanție de confort.
              </p>
              <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-xs text-slate-200 backdrop-blur">
                <span>📅 Ultimă actualizare: {lastUpdated}</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>Conformă cu legislația UE și România</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-3 pb-10 sm:px-6 lg:pb-16">
          <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-6 lg:p-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg md:text-xl">
                    🚀 Returnare Rapidă Online
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm md:text-base">
                    Cea mai simplă modalitate de a returna un produs este prin
                    contul tău online.
                  </p>
                </div>
                <Link
                  href={ordersLinkHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sky-500/10 transition hover:border-sky-300 hover:bg-sky-100 sm:w-auto sm:px-5 sm:py-2.5 md:px-6 md:py-3 md:text-base"
                >
                  <span>🛒</span>
                  {ordersLinkCtaLabel}
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
              <h2 className="mb-5 flex items-center text-base font-semibold text-slate-900 sm:text-lg md:mb-7 md:text-2xl">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 sm:h-9 sm:w-9 sm:text-sm md:h-10 md:w-10">
                  !
                </span>
                Refuz la Livrare vs. Retur după Livrare
              </h2>
              <div className="space-y-3 text-xs text-slate-700 sm:text-sm md:text-base">
                <p>
                  <strong>Refuzul coletului la livrare</strong> sau{" "}
                  <strong>nepreluarea din punctul de ridicare</strong>{" "}
                  reprezintă retur la expeditor (RTO). Nu este același lucru cu
                  dreptul de retragere exercitat după recepția produsului.
                </p>
                <p>
                  Pentru RTO se pot aplica doar{" "}
                  <strong>costurile logistice efective (tur + retur)</strong>,
                  dacă au fost comunicate clar înainte de finalizarea comenzii.
                </p>
                <p>
                  Pentru produsele defecte/neconforme, costurile aferente
                  remedierii și transportului rămân în sarcina vânzătorului.
                </p>
                <p>
                  Dacă există diferențe peste garanția COD autorizată, acestea
                  nu sunt colectate printr-un debit automat separat post-refuz,
                  ci prin fluxuri legale și contabile aplicabile în România.
                </p>
                <p className="text-slate-600">
                  Vezi detalii complete în{" "}
                  <Link
                    href="/shipping"
                    className="font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-600"
                  >
                    Politica de Livrare
                  </Link>{" "}
                  și{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-600"
                  >
                    Termeni și Condiții
                  </Link>
                  .
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-8">
              <h2 className="text-center text-base font-semibold text-slate-900 sm:text-lg md:text-xl">
                📋 Rezumat Rapid - Drepturile Tale
              </h2>
              <div className="mt-5 grid gap-4 text-xs text-slate-700 sm:grid-cols-2 sm:text-sm md:gap-6">
                {[quickSummaryLeft, quickSummaryRight].map(
                  (column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2 sm:space-y-3">
                      {column.map(item => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-3 shadow-inner shadow-slate-900/5"
                        >
                          <span className="mt-0.5 flex-shrink-0 text-lg text-emerald-500 sm:text-xl md:text-2xl">
                            ✅
                          </span>
                          <div className="leading-relaxed text-slate-700">
                            {item}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
              <h2 className="mb-5 flex items-center text-base font-semibold text-slate-900 sm:text-lg md:mb-7 md:text-2xl">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 sm:h-9 sm:w-9 sm:text-sm md:h-10 md:w-10">
                  1
                </span>
                Dreptul de Retragere (14 Zile)
              </h2>
              <div className="prose prose-sm sm:prose-base max-w-none text-slate-700">
                <p className="leading-relaxed">
                  În conformitate cu{" "}
                  <strong>
                    Directiva UE privind Drepturile Consumatorilor
                  </strong>
                  , ai dreptul să returnezi orice produs comandat online în
                  termen de <strong>14 zile calendaristice</strong> de la
                  primirea produsului, fără a fi necesar să oferi o justificare.
                </p>
              </div>
              <div className="my-5 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 shadow-inner shadow-sky-500/30 sm:my-6">
                <h3 className="text-sm font-semibold text-sky-800 sm:text-base md:text-lg">
                  📅 Perioada de Răgândire
                </h3>
                <p className="mt-2 text-xs text-slate-700 sm:text-sm">
                  Perioada de 14 zile începe din ziua în care{" "}
                  <strong>tu sau o persoană desemnată de tine</strong> (alta
                  decât transportatorul) iei în posesie produsul. Dacă comanda
                  conține mai multe produse livrate separat, termenul începe din
                  ziua primirii ultimului produs.
                </p>
              </div>
              <div className="my-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner shadow-slate-900/5 sm:my-6 sm:p-5 md:my-7 md:p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 sm:text-base md:text-lg">
                  🔄 Procesul Simplificat de Returnare
                </h3>
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="mb-2 text-xs font-medium text-sky-800 sm:text-sm">
                    Pentru clienții înregistrați - Metoda Recomandată:
                  </p>
                  <ol className="ml-3 list-decimal space-y-1.5 text-xs text-slate-700 sm:ml-5 sm:space-y-2 sm:text-sm">
                    <li>
                      Accesează contul tău și mergi la{" "}
                      <Link
                        href={ordersLinkHref}
                        className="font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-600"
                      >
                        {ordersLinkInlineLabel}
                      </Link>
                    </li>
                    <li>
                      Găsește comanda care conține produsul pe care dorești să
                      îl returnezi
                    </li>
                    <li>
                      Apasă pe butonul "Returnează Produs" de lângă articolul
                      dorit
                    </li>
                    <li>
                      Completează formularul de returnare cu motivul (opțional
                      pentru perioada de răgândire)
                    </li>
                    <li>
                      <strong>Pentru produse defecte:</strong> Încarcă
                      fotografiile/videoclipurile solicitate (obligatoriu)
                    </li>
                    <li>
                      <strong>
                        Vei primi automat un email cu eticheta de returnare
                      </strong>{" "}
                      și instrucțiuni detaliate
                    </li>
                    <li>
                      <strong>Notă:</strong> Pentru anumiți furnizori,
                      returnările pot necesita autorizare (ARP/RMA). În acest
                      caz, vei primi un număr de autorizare în email după
                      procesarea cererii.
                    </li>
                    <li>Printează eticheta și atașează-o pe pachet</li>
                    <li>
                      Împachetează produsul în ambalajul original (dacă este
                      posibil)
                    </li>
                    <li>
                      Predă pachetul la punctul de colectare indicat în email
                    </li>
                  </ol>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base md:text-lg">
                  Alternativ - Contact Direct:
                </h3>
                <ol className="ml-3 mt-2 list-decimal space-y-1.5 text-xs text-slate-700 sm:ml-5 sm:space-y-2 sm:text-sm">
                  <li>
                    Contactează-ne prin email la{" "}
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sky-700 underline underline-offset-4 hover:text-sky-600"
                    >
                      {contactEmail}
                    </a>{" "}
                    sau telefon la{" "}
                    <a
                      href={`tel:${contactPhone.replace(/\s/g, "")}`}
                      className="text-sky-700 underline underline-offset-4 hover:text-sky-600"
                    >
                      {contactPhone}
                    </a>
                  </li>
                  <li>
                    Specifică numărul comenzii și motivul returnării (opțional
                    pentru perioada de răgândire)
                  </li>
                  <li>
                    Vei primi un email cu eticheta de returnare și instrucțiuni
                    detaliate
                  </li>
                  <li>
                    Împachetează produsul în ambalajul original (dacă este
                    posibil)
                  </li>
                  <li>
                    Predă pachetul la punctul de colectare indicat în email
                  </li>
                </ol>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
              <h2 className="mb-5 flex items-center text-base font-semibold text-slate-900 sm:text-lg md:mb-7 md:text-2xl">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 sm:h-9 sm:w-9 sm:text-sm md:h-10 md:w-10">
                  2
                </span>
                Procesul de Returnare
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {processSteps.map(step => (
                  <div key={step.title} className="text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl shadow-inner shadow-slate-900/5 sm:h-16 sm:w-16">
                      {step.icon}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-900 sm:text-sm md:text-base">
                      {step.title}
                    </h3>
                    <p
                      className="mt-1 text-[10px] text-slate-600 sm:text-xs md:text-sm"
                      dangerouslySetInnerHTML={{ __html: step.description }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-xs text-slate-900 shadow-inner shadow-amber-500/20 sm:mt-7 sm:p-5 sm:text-sm">
                <h3 className="text-sm font-semibold text-amber-900 sm:text-base md:text-lg">
                  ⚠️ Important - Costurile de Returnare
                </h3>
                <ul className="mt-3 space-y-2 text-amber-900/90">
                  <li>
                    •{" "}
                    <strong>
                      Returnări în perioada de răgândire (14 zile):
                    </strong>{" "}
                    Returnare gratuită pentru comenzi ≥{" "}
                    <strong>{formattedThreshold} lei</strong>, altfel costurile
                    sunt suportate de client
                  </li>
                  <li>
                    • <strong>Produse defecte sau neconforme:</strong> Suportăm
                    noi toate costurile de returnare
                  </li>
                  <li>
                    • <strong>Eroare din partea noastră:</strong> Transport
                    gratuit și rambursare completă
                  </li>
                  <li>
                    • <strong>Eticheta de returnare:</strong> Vei primi automat
                    prin email - nu este nevoie să printezi nimic în avans
                  </li>
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
              <h2 className="mb-5 flex items-center text-base font-semibold text-slate-900 sm:text-lg md:mb-7 md:text-2xl">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700 sm:h-9 sm:w-9 sm:text-sm md:h-10 md:w-10">
                  3
                </span>
                Excepții de la Dreptul de Returnare
              </h2>
              <p className="mb-4 text-xs text-slate-700 sm:mb-5 sm:text-sm md:text-base">
                Conform legislației UE, următoarele produse nu pot fi returnate
                în perioada de răgândire:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {exceptionsList.map(item => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner shadow-slate-900/5"
                  >
                    <span className="mt-1 text-sm text-rose-500 sm:text-base">
                      ❌
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-900 sm:text-sm md:text-base">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-600 sm:text-xs md:text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-sky-300/40 bg-sky-500/10 p-4 text-xs text-slate-900 shadow-inner shadow-sky-500/20 sm:mt-6 sm:text-sm">
                <strong>Notă:</strong> Aceste excepții se aplică doar dreptului
                de retragere (14 zile). Garanția legală de 2 ani pentru produse
                defecte rămâne valabilă pentru toate produsele.
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
              <h2 className="mb-5 flex items-center text-base font-semibold text-slate-900 sm:text-lg md:mb-7 md:text-2xl">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 sm:h-9 sm:w-9 sm:text-sm md:h-10 md:w-10">
                  🌱
                </span>
                Returnări Sustenabile și Responsabile
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-slate-700 sm:mb-5 sm:text-sm md:mb-6 md:text-base">
                În spiritul{" "}
                <strong>
                  Planului de Acțiune pentru Economia Circulară al UE
                </strong>
                , ne angajăm să gestionăm returnările într-un mod sustenabil și
                responsabil pentru mediu.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                {sustainabilityCards.map(card => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner shadow-slate-900/5 backdrop-blur"
                  >
                    <h3 className="flex items-center text-xs font-semibold text-slate-900 sm:text-sm md:text-base">
                      <span className="mr-2">{card.icon}</span>
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[10px] text-slate-600 sm:text-xs md:text-sm">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 text-xs text-emerald-900 shadow-inner shadow-emerald-500/20 sm:mt-6 sm:text-sm md:text-base">
                <h3 className="text-sm font-semibold text-emerald-900 sm:text-base md:text-lg">
                  🌍 Programul Nostru "Jucării pentru Viitor"
                </h3>
                <p className="mt-2">
                  Pentru produse în stare foarte bună care nu pot fi revândute,
                  oferim opțiunea de donare către școli și organizații
                  educaționale din România. Contactează-ne dacă dorești să
                  participi la acest program.
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-xl shadow-sky-500/30 sm:p-7 md:p-9">
              <h2 className="text-lg font-semibold text-white sm:text-xl md:text-2xl">
                Ai Nevoie de Ajutor cu Returnarea?
              </h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-sky-100 sm:text-sm md:mt-6">
                💡 <strong>Sfat:</strong> Majoritatea problemelor se rezolvă
                rapid prin{" "}
                <Link
                  href={ordersLinkHref}
                  className="text-white underline underline-offset-4"
                >
                  Comenzile Mele
                </Link>{" "}
                - unde poți iniția returnarea în câteva clickuri și vei primi
                automat emailul cu eticheta!
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 md:gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                    📞 Contactează Echipa Noastră
                  </h3>
                  <div className="mt-3 space-y-2 text-xs text-slate-100 sm:text-sm">
                    <p>
                      📧 Email:{" "}
                      <a
                        href={`mailto:${contactEmail}`}
                        className="text-sky-100 underline underline-offset-4 hover:text-white"
                      >
                        {contactEmail}
                      </a>
                    </p>
                    <p>
                      📱 Telefon:{" "}
                      <a
                        href={`tel:${contactPhone.replace(/\s/g, "")}`}
                        className="text-sky-100 underline underline-offset-4 hover:text-white"
                      >
                        {contactPhone}
                      </a>
                    </p>
                    <p>🕒 Program: Luni - Duminică, 9:00 - 18:00</p>
                    <p>
                      💬 Chat Live: Disponibil pe site în timpul programului
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                    📍 Adresa pentru Returnări
                  </h3>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-slate-100 sm:text-sm">
                    <p>TechTots Educational Solutions</p>
                    <p>Centrul de Returnări</p>
                    <p>Str. Mehedinți 54-56</p>
                    <p>400000 Cluj-Napoca, România</p>
                    <p className="mt-3 text-xs text-slate-200">
                      <strong className="text-white">
                        Nu trimite produse la această adresă fără să ne
                        contactezi mai întâi!
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg md:text-xl">
                📋 Legislație și Conformitate
              </h2>
              <div className="mt-4 space-y-2 text-xs text-slate-700 sm:text-sm">
                <p>Această politică de returnare este în conformitate cu:</p>
                <ul className="ml-3 list-disc space-y-1 text-slate-700 sm:ml-4">
                  {legalItems.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-slate-600">
                  Pentru refuz/nepreluare colet (RTO), orice diferență peste
                  garanția COD autorizată se gestionează prin procedurile
                  comerciale, legale și contabile aplicabile în România.
                </p>
                <p className="mt-4 text-slate-500">
                  <strong>Ultimă actualizare:</strong> {lastUpdated} | Versiunea
                  2.2
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
