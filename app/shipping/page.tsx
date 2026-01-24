import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Politica de Livrare | TechTots - Jucării STEM",
    description:
        "Informații complete despre livrare, costuri, termene și condiții de expediere pentru comenzile TechTots în România.",
    keywords:
        "livrare, expediere, curier, transport, FAN Courier, Sameday, România",
};

export default function ShippingPolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">
                    Politica de Livrare
                </h1>

                {/* Quick Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold text-blue-900 mb-3">
                        Sumar Rapid
                    </h2>
                    <ul className="space-y-2 text-blue-800">
                        <li>✓ Livrare în 1-3 zile lucrătoare</li>
                        <li>
                            ✓ Cost livrare: 19.99 RON (plată online) / 24.99 RON (ramburs)
                        </li>
                        <li>✓ Livrare GRATUITĂ pentru comenzi peste 199 RON</li>
                        <li>✓ Transportatori: FAN Courier, Sameday</li>
                    </ul>
                </div>

                {/* Delivery Times */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Termene de Livrare
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p>
                            Comenzile plasate și confirmate până la ora 14:00 în zilele
                            lucrătoare sunt procesate în aceeași zi. Termenele de livrare sunt
                            estimate și pot varia în funcție de localitate:
                        </p>
                        <ul>
                            <li>
                                <strong>București și localități majore:</strong> 1-2 zile
                                lucrătoare
                            </li>
                            <li>
                                <strong>Restul țării:</strong> 2-3 zile lucrătoare
                            </li>
                            <li>
                                <strong>Localități în zone îndepărtate:</strong> 3-5 zile
                                lucrătoare
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Cost Structure */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Costuri de Livrare
                    </h2>
                    <div className="bg-slate-50 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-slate-900">
                                        Metodă de Plată
                                    </th>
                                    <th className="px-4 py-3 font-medium text-slate-900">
                                        Cost Livrare
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr>
                                    <td className="px-4 py-3">Plată online (card, transfer)</td>
                                    <td className="px-4 py-3 font-semibold text-green-600">
                                        19.99 RON
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Ramburs (plată la livrare)</td>
                                    <td className="px-4 py-3 font-semibold">24.99 RON</td>
                                </tr>
                                <tr className="bg-green-50">
                                    <td className="px-4 py-3">Comenzi peste 199 RON</td>
                                    <td className="px-4 py-3 font-semibold text-green-600">
                                        GRATUIT
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* COD Explanation */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Plata Ramburs (Contra Cost)
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p>
                            Pentru comenzile cu plată ramburs (la livrare), se aplică un cost
                            suplimentar de procesare. Acest cost acoperă:
                        </p>
                        <ul>
                            <li>Serviciile de încasare ale curierului</li>
                            <li>Transferul bancar al sumei încasate</li>
                            <li>Procesarea administrativă</li>
                        </ul>
                        <p>
                            <strong>Important:</strong> Limita maximă pentru plata ramburs
                            este de 10.000 RON pentru persoane fizice și 5.000 RON pentru
                            persoane juridice.
                        </p>
                    </div>
                </section>

                {/* Remote Localities */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Localități în Zone Îndepărtate
                    </h2>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                        <p className="text-amber-800">
                            Pentru anumite localități situate în afara zonelor standard de
                            livrare, pot exista costuri suplimentare sau termene extinse. În
                            aceste cazuri, echipa noastră vă va contacta înainte de expediere
                            pentru a confirma detaliile și eventualele costuri adiționale.
                        </p>
                    </div>
                </section>

                {/* Insurance */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Asigurarea Coletului
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p>
                            Pentru protecția dumneavoastră, toate coletele cu o valoare de
                            peste 500 RON sau care conțin pachete de produse (bundle-uri)
                            beneficiază automat de asigurare la valoarea integrală a comenzii.
                        </p>
                        <p>Această asigurare acoperă:</p>
                        <ul>
                            <li>Pierderea coletului în tranzit</li>
                            <li>Deteriorarea produselor în timpul transportului</li>
                            <li>Furt sau dispariție</li>
                        </ul>
                    </div>
                </section>

                {/* Return Delivery */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Returnarea Produselor
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p>
                            Conform <strong>Directivei UE 2011/83/EU</strong> și legislației
                            române, aveți dreptul de retragere în termen de 14 zile de la
                            primirea produselor, fără a fi necesară justificarea deciziei.
                        </p>
                        <p>
                            <strong>Costurile de returnare:</strong>
                        </p>
                        <ul>
                            <li>
                                <strong>Comenzi peste 199 RON:</strong> Returnare gratuită
                                (oferim etichetă de retur preplătită)
                            </li>
                            <li>
                                <strong>Comenzi sub 199 RON:</strong> Costul returului este
                                suportat de client
                            </li>
                        </ul>
                        <p>
                            Pentru detalii complete, consultați{" "}
                            <Link href="/returns" className="text-primary hover:underline">
                                Politica de Returnare
                            </Link>
                            .
                        </p>
                    </div>
                </section>

                {/* Legal Compliance */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Conformitate Legală
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <p>
                            Această politică de livrare respectă următoarele reglementări:
                        </p>
                        <ul>
                            <li>Directiva UE 2011/83/EU privind drepturile consumatorilor</li>
                            <li>Directiva UE 2019/771 privind contractele de vânzare</li>
                            <li>OG 130/2000 privind protecția consumatorilor</li>
                            <li>Legea nr. 449/2003 privind vânzarea produselor</li>
                        </ul>
                    </div>
                </section>

                {/* Courier Partners */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Partenerii Noștri de Livrare
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4">
                            <h3 className="font-semibold text-slate-900 mb-2">FAN Courier</h3>
                            <p className="text-sm text-slate-600">
                                Livrare standard la domiciliu în toată România. Urmărire în timp
                                real a coletului.
                            </p>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4">
                            <h3 className="font-semibold text-slate-900 mb-2">Sameday</h3>
                            <p className="text-sm text-slate-600">
                                Livrare rapidă și opțiuni de ridicare din EasyBox. Flexibilitate
                                maximă.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-slate-100 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Întrebări despre Livrare?
                    </h2>
                    <p className="text-slate-700 mb-4">
                        Echipa noastră de suport este disponibilă pentru orice nelamuriri
                        legate de livrarea comenzii dumneavoastră.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/contact"
                            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Contactează-ne
                        </Link>
                        <Link
                            href="/faq"
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Întrebări Frecvente
                        </Link>
                    </div>
                </section>

                {/* Last Updated */}
                <p className="text-sm text-slate-500 mt-8">
                    Ultima actualizare: Ianuarie 2026
                </p>
            </div>
        </main>
    );
}
