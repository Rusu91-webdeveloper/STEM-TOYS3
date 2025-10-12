import { Card } from "@/components/ui/card";

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-6 md:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header - Compact on Mobile */}
          <div className="text-center mb-4 sm:mb-6 md:mb-12">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Garanția Legală
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
              Protecție completă de 2 ani pentru toate produsele TechTots
            </p>
            <div className="flex justify-center mt-3 sm:mt-4 md:mt-6">
              <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-xl sm:text-2xl font-bold">
                2
              </div>
            </div>
          </div>

          {/* Main Warranty Section - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-8">
              <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                  ✓
                </span>
                Garanția Legală (2 Ani)
              </h2>

              <div className="prose prose-sm sm:prose-base max-w-none">
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  Toate produsele noastre beneficiază de{" "}
                  <strong>garanție legală de 2 ani</strong> împotriva defectelor
                  de conformitate, conform legislației UE. Această garanție este
                  gratuită și se aplică automat.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 my-3 sm:my-4 md:my-6">
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-green-800 mb-1 sm:mb-2">
                      Prima 12 luni
                    </h3>
                    <p className="text-green-700 text-[10px] sm:text-xs md:text-sm">
                      Nu trebuie să demonstrezi că defectul exista la momentul
                      livrării. Se presupune că defectul era prezent la livrare.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-blue-800 mb-1 sm:mb-2">
                      Următoarele 12 luni
                    </h3>
                    <p className="text-blue-700 text-[10px] sm:text-xs md:text-sm">
                      Produsul rămâne sub garanție, dar s-ar putea să fie nevoie
                      să demonstrezi că defectul nu a fost cauzat de utilizarea
                      normală.
                    </p>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base md:text-lg font-semibold mt-4 sm:mt-5 md:mt-6 mb-2 sm:mb-3">
                  Produsul poate fi returnat sub garanție dacă:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm md:text-base text-gray-600">
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
          </section>

          {/* Contact Information - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-4 sm:p-5 md:p-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 md:mb-6">
                Contactează-ne pentru Garanție
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3">
                    📞 Suport Garanție
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 text-blue-100 text-xs sm:text-sm">
                    <p>
                      📧 Email:{" "}
                      <a
                        href="mailto:webira.rem.srl@gmail.com"
                        className="text-white underline break-all"
                      >
                        webira.rem.srl@gmail.com
                      </a>
                    </p>
                    <p>
                      📱 Telefon:{" "}
                      <a
                        href="tel:+40771248029"
                        className="text-white underline"
                      >
                        0771 248 029
                      </a>
                    </p>
                    <p>🕒 Program: Luni - Duminică, 9:00 - 18:00</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3">
                    📍 Centrul de Service
                  </h3>
                  <div className="text-blue-100 text-xs sm:text-sm">
                    <p>TechTots Educational Solutions</p>
                    <p>Departamentul Garanții</p>
                    <p>Str. Mehedinți 54-56</p>
                    <p>400000 Cluj-Napoca, România</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 md:mt-6 bg-white/10 rounded-lg p-3 sm:p-4">
                <p className="text-blue-100 text-xs sm:text-sm">
                  💡 <strong>Sfat:</strong> Pentru aplicarea garanției, poți
                  folosi și sistemul online prin{" "}
                  <a
                    href="/account/orders"
                    className="text-white underline font-semibold"
                  >
                    Comenzile Mele
                  </a>{" "}
                  - selectează "Problemă cu Produsul" în locul returnării.
                </p>
              </div>
            </div>
          </section>

          {/* Legal Compliance - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                📋 Baza Legală
              </h2>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1.5 sm:space-y-2">
                <p>Această politică de garanție se bazează pe:</p>
                <ul className="list-disc list-inside space-y-1 ml-3 sm:ml-4">
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
                <p className="mt-3 sm:mt-4">
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
