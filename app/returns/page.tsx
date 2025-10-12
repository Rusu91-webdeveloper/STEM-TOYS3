import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Returnare | TechTots Educational Solutions",
  description:
    "Politica de returnare pentru produsele STEM educaționale. Returnări gratuite în 14 zile pentru comenzi peste 50 € sau 250 lei, conformă cu legislația UE din 2025.",
  keywords:
    "politica returnare, returnare produse, garanție, drepturile consumatorului, UE, România",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Compact on Mobile */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">
              Politica de Returnare
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-blue-100">
              Returnări simple și sigure pentru produsele tale educaționale STEM
            </p>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 md:p-4 mt-3 sm:mt-4 md:mt-6 inline-block">
              <p className="text-xs sm:text-sm">
                📅 Ultimă actualizare: {new Date().toLocaleDateString("ro-RO")}{" "}
                | Conformă cu legislația UE 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact on Mobile */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quick Return Access - Compact on Mobile */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-blue-800 mb-1 sm:mb-2">
                  🚀 Returnare Rapidă Online
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-blue-700">
                  Cea mai simplă modalitate de a returna un produs este prin
                  contul tău online
                </p>
              </div>
              <a
                href="/account/orders"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg transition-colors inline-flex items-center justify-center text-sm sm:text-base"
              >
                <span className="mr-2">🛒</span>
                Mergi la Comenzile Mele
              </a>
            </div>
          </div>

          {/* Quick Summary - Compact on Mobile */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-green-800 mb-3 sm:mb-4 md:mb-6 text-center">
              📋 Rezumat Rapid - Drepturile Tale
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-green-600 text-sm sm:text-base md:text-lg mt-0.5 flex-shrink-0">
                    ✅
                  </span>
                  <div className="leading-relaxed">
                    <strong>14 zile</strong> pentru returnare fără justificare
                  </div>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-green-600 text-sm sm:text-base md:text-lg mt-0.5 flex-shrink-0">
                    ✅
                  </span>
                  <div className="leading-relaxed">
                    <strong>2 ani</strong> garanție legală pentru produse
                    defecte
                  </div>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-green-600 text-sm sm:text-base md:text-lg mt-0.5 flex-shrink-0">
                    ✅
                  </span>
                  <div className="leading-relaxed">
                    Returnare <strong>gratuită</strong> pentru comenzi peste{" "}
                    <strong>50 € sau 250 lei</strong>
                  </div>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-green-600 text-sm sm:text-base md:text-lg mt-0.5 flex-shrink-0">
                    ✅
                  </span>
                  <div className="leading-relaxed">
                    Rambursare <strong>completă</strong> în 14 zile
                  </div>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-green-600 text-sm sm:text-base md:text-lg mt-0.5 flex-shrink-0">
                    ✅
                  </span>
                  <div className="leading-relaxed">
                    Proces <strong>sustenabil</strong> și eco-friendly
                  </div>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-green-600 text-sm sm:text-base md:text-lg mt-0.5 flex-shrink-0">
                    ✅
                  </span>
                  <div className="leading-relaxed">
                    Suport <strong>multilingv</strong> disponibil
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dreptul de Retragere - 14 zile - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-8">
              <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                  1
                </span>
                Dreptul de Retragere (14 Zile)
              </h2>

              <div className="prose prose-sm sm:prose-base max-w-none">
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  În conformitate cu{" "}
                  <strong>
                    Directiva UE privind Drepturile Consumatorilor
                  </strong>
                  , ai dreptul să returnezi orice produs comandat online în
                  termen de <strong>14 zile calendaristice</strong> de la
                  primirea produsului, fără a fi necesar să oferi o justificare.
                </p>

                <div className="bg-blue-50 border-l-2 sm:border-l-4 border-blue-400 p-3 sm:p-4 my-3 sm:my-4 md:my-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-blue-800 mb-1 sm:mb-2">
                    📅 Perioada de Răgândire
                  </h3>
                  <p className="text-blue-700 text-xs sm:text-sm">
                    Perioada de 14 zile începe din ziua în care{" "}
                    <strong>tu sau o persoană desemnată de tine</strong> (alta
                    decât transportatorul) iei în posesie produsul. Dacă comanda
                    conține mai multe produse livrate separat, termenul începe
                    din ziua primirii ultimului produs.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-6 my-3 sm:my-4 md:my-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-blue-800 mb-2 sm:mb-3 md:mb-4 flex items-center">
                    🔄 Procesul Simplificat de Returnare
                  </h3>
                  <div className="bg-white rounded-lg p-3 sm:p-4 border-l-2 sm:border-l-4 border-blue-400">
                    <p className="text-blue-700 font-medium mb-2 text-xs sm:text-sm">
                      Pentru clienții înregistrați - Metoda Recomandată:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-blue-600 ml-2 sm:ml-4 text-xs sm:text-sm">
                      <li>
                        Accesează contul tău și mergi la{" "}
                        <a
                          href="/account/orders"
                          className="font-semibold underline hover:text-blue-800"
                        >
                          Comenzile Mele (/account/orders)
                        </a>
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
                        <strong>
                          Vei primi automat un email cu eticheta de returnare
                        </strong>{" "}
                        și instrucțiuni detaliate
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

                <h3 className="text-sm sm:text-base md:text-lg font-semibold mt-4 sm:mt-5 md:mt-6 mb-2 sm:mb-3">
                  Alternativ - Contact Direct:
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-600 text-xs sm:text-sm">
                  <li>
                    Contactează-ne prin email la{" "}
                    <a
                      href="mailto:webira.rem.srl@gmail.com"
                      className="text-blue-600 hover:underline"
                    >
                      webira.rem.srl@gmail.com
                    </a>{" "}
                    sau telefon la 0771 248 029
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
            </div>
          </section>

          {/* Procesul de Returnare - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-8">
              <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                  2
                </span>
                Procesul de Returnare
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <span className="text-xl sm:text-2xl">🛒</span>
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2">
                    1. Mergi la Comenzile Mele
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                    Accesează{" "}
                    <a
                      href="/account/orders"
                      className="text-blue-600 underline"
                    >
                      Comenzile Mele
                    </a>{" "}
                    din contul tău
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <span className="text-xl sm:text-2xl">🔄</span>
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2">
                    2. Inițiază Returnarea
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                    Apasă butonul "Returnează Produs" și completează formularul
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-yellow-100 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <span className="text-xl sm:text-2xl">📧</span>
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2">
                    3. Primește Eticheta
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                    Vei primi automat un email cu eticheta de returnare
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <span className="text-xl sm:text-2xl">💰</span>
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2">
                    4. Primește Rambursarea
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                    Rambursare completă în 14 zile de la primirea produsului
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 md:mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-yellow-800 mb-2">
                  ⚠️ Important - Costurile de Returnare
                </h3>
                <ul className="text-yellow-700 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <li>
                    •{" "}
                    <strong>
                      Returnări în perioada de răgândire (14 zile):
                    </strong>{" "}
                    Returnare gratuită pentru comenzi ≥{" "}
                    <strong>50 € sau 250 lei</strong>, altfel costurile sunt
                    suportate de client
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
            </div>
          </section>

          {/* Excepții de la Returnare - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-8">
              <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                  3
                </span>
                Excepții de la Dreptul de Returnare
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4">
                Conform legislației UE, următoarele produse nu pot fi returnate
                în perioada de răgândire:
              </p>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5 sm:mt-1 text-sm sm:text-base">
                      ❌
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium">
                        Produse personalizate
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                        Jucării gravate sau customizate la cerere
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5 sm:mt-1 text-sm sm:text-base">
                      ❌
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium">
                        Produse perisabile
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                        Articole cu durată limitată de viață
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5 sm:mt-1 text-sm sm:text-base">
                      ❌
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium">
                        Software desigilat
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                        Aplicații sau jocuri educaționale activate
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5 sm:mt-1 text-sm sm:text-base">
                      ❌
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium">
                        Conținut digital descarcat
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                        Cărți digitale sau resurse educaționale accesate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5 sm:mt-1 text-sm sm:text-base">
                      ❌
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium">
                        Produse igienice desigilate
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                        Pentru siguranța și sănătatea tuturor
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 md:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-blue-700 text-xs sm:text-sm">
                  <strong>Notă:</strong> Aceste excepții se aplică doar
                  dreptului de retragere (14 zile). Garanția legală de 2 ani
                  pentru produse defecte rămâne valabilă pentru toate produsele.
                </p>
              </div>
            </div>
          </section>

          {/* Sustenabilitate și Responsabilitate - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-8">
              <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                  🌱
                </span>
                Returnări Sustenabile și Responsabile
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4 md:mb-6 leading-relaxed">
                În spiritul{" "}
                <strong>
                  Planului de Acțiune pentru Economia Circulară al UE
                </strong>
                , ne angajăm să gestionăm returnările într-un mod sustenabil și
                responsabil pentru mediu.
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-green-800 mb-1 sm:mb-2 flex items-center">
                    <span className="mr-1 sm:mr-2">♻️</span> Reparare și
                    Recondiționare
                  </h3>
                  <p className="text-green-700 text-[10px] sm:text-xs md:text-sm">
                    Produsele returnate sunt evaluate pentru reparare și
                    recondiționare înainte de a fi considerate pentru reciclare.
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-blue-800 mb-1 sm:mb-2 flex items-center">
                    <span className="mr-1 sm:mr-2">📦</span> Ambalaje
                    Reutilizabile
                  </h3>
                  <p className="text-blue-700 text-[10px] sm:text-xs md:text-sm">
                    Folosim ambalaje care pot fi reutilizate pentru returnări și
                    încurajăm clienții să returneze ambalajele pentru
                    reutilizare.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-purple-800 mb-1 sm:mb-2 flex items-center">
                    <span className="mr-1 sm:mr-2">🚚</span> Transport
                    Consolidat
                  </h3>
                  <p className="text-purple-700 text-[10px] sm:text-xs md:text-sm">
                    Colectăm returnările regional pentru a reduce amprenta de
                    carbon prin transport consolidat și optimizat.
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 md:mt-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-green-800 mb-1 sm:mb-2">
                  🌍 Programul Nostru "Jucării pentru Viitor"
                </h3>
                <p className="text-green-700 text-xs sm:text-sm">
                  Pentru produse în stare foarte bună care nu pot fi revândute,
                  oferim opțiunea de donare către școli și organizații
                  educaționale din România. Contactează-ne dacă dorești să
                  participi la acest program.
                </p>
              </div>
            </div>
          </section>

          {/* Informații de Contact - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 sm:p-5 md:p-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 md:mb-6">
                Ai Nevoie de Ajutor cu Returnarea?
              </h2>

              <div className="bg-white/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
                <p className="text-blue-100 text-xs sm:text-sm">
                  💡 <strong>Sfat:</strong> Majoritatea problemelor se rezolvă
                  rapid prin{" "}
                  <a
                    href="/account/orders"
                    className="text-white underline font-semibold"
                  >
                    Comenzile Mele
                  </a>{" "}
                  - unde poți iniția returnarea în câteva clickuri și vei primi
                  automat emailul cu eticheta!
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3">
                    📞 Contactează Echipa Noastră
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
                    <p>
                      💬 Chat Live: Disponibil pe site în timpul programului
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3">
                    📍 Adresa pentru Returnări
                  </h3>
                  <div className="text-blue-100 text-xs sm:text-sm">
                    <p>TechTots Educational Solutions</p>
                    <p>Centrul de Returnări</p>
                    <p>Str. Mehedinți 54-56</p>
                    <p>400000 Cluj-Napoca, România</p>
                    <p className="mt-2 text-xs">
                      <strong>
                        Nu trimite produse la această adresă fără să ne
                        contactezi mai întâi!
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Legislație și Conformitate - Compact on Mobile */}
          <section className="mb-4 sm:mb-6 md:mb-10">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                📋 Legislație și Conformitate
              </h2>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1.5 sm:space-y-2">
                <p>Această politică de returnare este în conformitate cu:</p>
                <ul className="list-disc list-inside space-y-1 ml-3 sm:ml-4">
                  <li>
                    Directiva UE 2011/83/EU privind drepturile consumatorilor
                  </li>
                  <li>
                    Directiva UE 2019/771 privind contractele de vânzare a
                    bunurilor
                  </li>
                  <li>
                    Legea română nr. 449/2003 privind vânzarea de bunuri de
                    consum
                  </li>
                  <li>
                    Planul de Acțiune pentru Economia Circulară al UE (2020)
                  </li>
                  <li>GDPR și legislația română de protecție a datelor</li>
                </ul>
                <p className="mt-3 sm:mt-4">
                  <strong>Ultimă actualizare:</strong>{" "}
                  {new Date().toLocaleDateString("ro-RO")} | Versiunea 2.1 -
                  Adaptată pentru 2025
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
