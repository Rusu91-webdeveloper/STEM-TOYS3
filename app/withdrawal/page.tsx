import type { Metadata } from "next";
import Link from "next/link";

import { WithdrawalForm } from "@/features/returns/components/WithdrawalForm";

export const metadata: Metadata = {
  title: "Retragere din comandă | TechTots",
  description:
    "Comunică online retragerea din comandă, fără cont și fără să justifici decizia. Primești prin email confirmarea de primire.",
};

export default function WithdrawalPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-slate-900 sm:py-14">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-blue-700">
          Retururi și retragere
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Vrei să renunți la o cumpărare?
        </h1>
        <p className="text-base leading-relaxed text-slate-600">
          Completează formularul pentru a ne comunica retragerea din comandă. Nu
          ai nevoie de cont, de un motiv sau de fotografii.
        </p>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
        <p>
          <strong>Ce înseamnă „retragere din contract”?</strong> Renunțarea la
          cumpărarea produselor din comanda ta. Contractul de vânzare se referă
          la cumpărarea confirmată de magazin; nu ai nevoie de un document
          semnat separat.
        </p>
        <p>
          <strong>
            În mod obișnuit, ai 14 zile calendaristice de la primirea
            produselor.
          </strong>{" "}
          Poți comunica retragerea și înainte de livrare. Înregistrăm data și
          ora trimiterii; verificăm separat termenul aplicabil și eventualele
          excepții legale.
        </p>
      </div>
      <WithdrawalForm />
      <p className="text-sm leading-relaxed text-slate-600">
        Poți comunica retragerea și prin email la{" "}
        <a className="underline" href="mailto:info@techtots.ro">
          info@techtots.ro
        </a>
        . Consultă{" "}
        <Link className="underline" href="/returns">
          politica de retur și rambursare
        </Link>
        . Pentru un produs defect, neconform sau o problemă de garanție,{" "}
        <Link className="underline" href="/contact">
          contactează-ne
        </Link>
        ; acestea se soluționează separat și nu sunt limitate la termenul de
        retragere.
      </p>
    </div>
  );
}
