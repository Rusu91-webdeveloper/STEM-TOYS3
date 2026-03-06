import { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  Clock,
  CreditCard,
  Package,
  Shield,
  MapPin,
  HelpCircle,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

import {
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  RETURN_WINDOW_LABEL_RO,
} from "@/lib/returns/policy";
import { COD_MAX_B2B, COD_MAX_B2C } from "@/lib/shipping/cod-thresholds";
import { getShippingSettings } from "@/lib/utils/store-settings";

export const metadata: Metadata = {
  title: "Livrare și Transport | TechTots - Jucării STEM",
  description:
    "Informații complete despre livrare, costuri, termene și condiții de expediere pentru comenzile TechTots în România. Livrare rapidă cu FanCourier.",
  keywords:
    "livrare, expediere, curier, transport, FanCourier, România, jucării STEM",
};

// Format price for display
function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default async function ShippingPage() {
  // Fetch shipping settings from database
  const shippingSettings = await getShippingSettings();

  // Extract values with fallbacks
  const onlinePaymentPrice = shippingSettings.onlinePaymentPrice || "19.99";
  const rambursPrice = shippingSettings.rambursPrice || "24.99";
  const freeThreshold = shippingSettings.freeThreshold?.price || "199";
  const isFreeShippingActive = shippingSettings.freeThreshold?.active !== false;

  const codLimitB2C = COD_MAX_B2C;
  const codLimitB2B = COD_MAX_B2B;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Truck className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">Livrare și Transport</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Livrăm rapid în toată România cu parteneri de încredere. Primești
            coletul în 5-10 zile lucrătoare.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-10 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sumar Rapid
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Livrare în 5-10 zile lucrătoare
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Cost livrare: {formatPrice(onlinePaymentPrice)} RON (online) /{" "}
              {formatPrice(rambursPrice)} RON (ramburs)
            </li>
            {isFreeShippingActive && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Livrare GRATUITĂ pentru comenzi peste{" "}
                {formatPrice(freeThreshold)} RON
              </li>
            )}
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Transportator: FanCourier
            </li>
            <li className="flex items-center gap-2 md:col-span-2">
              <span className="text-green-600">✓</span>
              Refuz/nepreluare colet (RTO): se pot aplica costuri logistice tur
              + retur
            </li>
          </ul>
        </div>

        {/* Shipping Costs - Dynamic from Database */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Costuri de Livrare
          </h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">
                    Metodă de Plată
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-900 text-right">
                    Cost Livrare
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span>Plată online (card, transfer)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600 text-right text-lg">
                    {formatPrice(onlinePaymentPrice)} RON
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-orange-600" />
                      <span>Ramburs (plată la livrare)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-right text-lg">
                    {formatPrice(rambursPrice)} RON
                  </td>
                </tr>
                {isFreeShippingActive && (
                  <tr className="bg-green-50 hover:bg-green-100 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-green-600" />
                        <span className="font-medium">
                          Comenzi peste {formatPrice(freeThreshold)} RON
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600 text-right text-lg">
                      GRATUIT
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delivery Timeline */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            Termene de Livrare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="text-3xl mb-3">🏙️</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                București și orașe mari
              </h3>
              <p className="text-slate-600 text-sm">3-5 zile lucrătoare</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="text-3xl mb-3">🗺️</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Restul țării
              </h3>
              <p className="text-slate-600 text-sm">5-7 zile lucrătoare</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="text-3xl mb-3">🏔️</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Zone îndepărtate
              </h3>
              <p className="text-slate-600 text-sm">7-10 zile lucrătoare</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            * Comenzile plasate până la ora 14:00 în zilele lucrătoare sunt
            procesate în aceeași zi. Timpul de livrare depinde și de procesarea
            de către furnizor.
          </p>
        </section>

        {/* COD section with dynamic limits from configured thresholds */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            Plata Ramburs (la livrare)
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <p className="text-slate-700 mb-4">
              Pentru comenzile cu plată ramburs se aplică un cost suplimentar de
              procesare care acoperă serviciile de încasare ale curierului și
              transferul bancar.
            </p>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <p className="font-semibold text-orange-800 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Limite ramburs:{" "}
                <span className="text-lg sm:text-2xl">
                  B2C {formatPrice(codLimitB2C)} RON / B2B{" "}
                  {formatPrice(codLimitB2B)} RON
                </span>
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Pentru comenzi peste aceste limite, vă rugăm să folosiți plata
                online cu cardul.
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-orange-300 bg-white p-4">
              <p className="font-semibold text-orange-900">
                Important pentru comenzile ramburs:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>
                  • Refuzul la livrare sau nepreluarea coletului este tratat ca
                  retur la expeditor (RTO).
                </li>
                <li>
                  • În caz de RTO se pot factura doar costurile logistice
                  efective (transport tur + retur), fără penalități arbitrare.
                </li>
                <li>
                  • Dacă există sume achitate în avans pentru transport/avans
                  logistic, acestea pot fi reținute în limita costurilor
                  logistice reale.
                </li>
                <li>
                  • Dacă există diferențe peste garanția COD autorizată,
                  recuperarea se face prin fluxuri legale/contabile aplicabile
                  în România (ex. facturare), nu prin debit automat separat
                  post-refuz.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Refuz la Livrare și Colet Nepreluat (RTO)
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-900 mb-4">
              Refuzul coletului la ușă sau nepreluarea acestuia din punctul de
              ridicare nu este același lucru cu returnarea după recepție
              (dreptul de retragere în 14 zile).
            </p>
            <ul className="space-y-2 text-sm text-amber-900/90">
              <li>
                • <strong>RTO (return to origin):</strong> coletul se întoarce
                la expeditor.
              </li>
              <li>
                • <strong>Costuri:</strong> se pot aplica costurile logistice
                reale tur + retur, dacă au fost comunicate înainte de comandă.
              </li>
              <li>
                • <strong>Conformitate:</strong> pentru produse
                neconforme/defecte, costurile remedierii și transportului sunt
                suportate de vânzător.
              </li>
            </ul>
          </div>
        </section>

        {/* Insurance */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            Asigurarea Coletului
          </h2>
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <p className="text-slate-700 mb-4">
              Toate coletele cu o valoare de peste 500 RON beneficiază automat
              de asigurare la valoarea integrală a comenzii. Acoperă:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <li className="flex items-center gap-2 text-slate-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Pierderea în tranzit
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Deteriorarea produselor
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Furt sau dispariție
              </li>
            </ul>
          </div>
        </section>

        {/* Remote Localities */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            Zone Îndepărtate
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800">
              Pentru localități în afara zonelor standard de livrare pot exista
              termene extinse. În aceste cazuri, vă contactăm înainte de
              expediere pentru a confirma detaliile.
            </p>
          </div>
        </section>

        {/* Returns */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Returnarea Produselor
          </h2>
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <p className="text-slate-700 mb-4">
              Conform <strong>Directivei UE 2011/83/EU</strong>, aveți dreptul
              de retragere în termen de <strong>{RETURN_WINDOW_LABEL_RO}</strong>{" "}
              de la primirea produselor.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-800">
                  Retur în perioada de retragere
                </p>
                <p className="text-slate-600 text-sm">
                  {RETURN_POLICY_CUSTOMER_PAYS_RO}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="font-semibold text-green-800">
                  Produse defecte, neconforme sau expediate greșit
                </p>
                <p className="text-green-700 text-sm">
                  {RETURN_POLICY_SELLER_PAYS_RO}
                </p>
              </div>
            </div>
            <Link
              href="/returns"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Vezi Politica de Returnare <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Courier Partner */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Partenerul Nostru de Livrare
          </h2>
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900">FanCourier</h3>
                <p className="text-slate-600">
                  Livrare la domiciliu în toată România cu urmărire în timp
                  real.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Întrebări Frecvente
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Cât durează livrarea?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Livrarea durează de obicei 5-10 zile lucrătoare de la
                confirmarea comenzii. Timpul exact depinde de procesarea de
                către furnizor și de zona de livrare.
              </p>
            </details>
            <details className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Cum urmăresc coletul?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                După expediere primești un email cu link-ul de urmărire
                FanCourier. Poți verifica statusul și reprograma livrarea direct
                din portalul curierului.
              </p>
            </details>
            <details className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Ce se întâmplă dacă nu sunt acasă?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Curierul te va contacta telefonic. Poți solicita redirecționarea
                coletului sau o nouă zi de livrare. Echipa de suport te poate
                ajuta pentru a găsi soluția preferată.
              </p>
            </details>
            <details className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Ce se întâmplă dacă refuz comanda ramburs?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Refuzul la livrare sau nepreluarea coletului sunt tratate ca
                retur la expeditor (RTO). Pentru acest scenariu se pot aplica
                costurile logistice efective tur + retur, conform informațiilor
                comunicate în checkout, în Termeni și în politicile de
                livrare/retur. Dacă rămâne o diferență peste garanția COD
                autorizată, aceasta se gestionează prin fluxuri
                legale/contabile.
              </p>
            </details>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Întrebări despre Livrare?</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Echipa noastră de suport este disponibilă pentru orice nelămuriri
            legate de livrarea comenzii tale.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              Contactează-ne
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors border border-blue-500"
            >
              Întrebări Frecvente
            </Link>
          </div>
        </section>

        {/* Legal */}
        <section className="mt-10 text-sm text-slate-500">
          <h3 className="font-semibold text-slate-700 mb-2">
            Conformitate Legală
          </h3>
          <p>
            Această politică respectă legislația aplicabilă privind protecția
            consumatorilor și comerțul electronic, inclusiv OUG nr. 34/2014, OUG
            nr. 140/2021 și Legea nr. 193/2000.
          </p>
          <p className="mt-2">
            Prevederile privind refuzul la livrare/nepreluarea coletului se
            aplică exclusiv costurilor logistice efective, comunicate
            precontractual.
          </p>
          <p className="mt-2">
            Dacă există diferențe peste garanția COD autorizată, acestea sunt
            gestionate prin procesele comerciale, legale și contabile aplicabile
            în România.
          </p>
          <p className="mt-4">
            Ultima actualizare:{" "}
            {new Intl.DateTimeFormat("ro-RO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>
        </section>
      </div>
    </main>
  );
}
