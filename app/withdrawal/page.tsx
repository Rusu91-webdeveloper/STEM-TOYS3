import type { Metadata } from "next";
import Link from "next/link";

import { WithdrawalForm } from "@/features/returns/components/WithdrawalForm";

export const metadata: Metadata = {
  title: "Retragere din contract | TechTots",
  description:
    "Trimite online declarația de retragere din contract, fără autentificare și fără justificare, și primește confirmarea de primire.",
};

export default function WithdrawalPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-slate-900">
      <h1 className="text-3xl font-bold">Retrageți-vă din contract aici</h1>
      <p>
        Poți comunica retragerea fără cont, fără motiv și fără fotografii.
        Identifică o comandă sau contractul și, dacă retragerea este parțială,
        produsele vizate.
      </p>
      <p>
        În mod obișnuit, ai 14 zile calendaristice de la primirea bunurilor.
        Poți comunica retragerea și înainte de livrare. Înregistrăm declarația
        la momentul trimiterii; termenul aplicabil și eventualele excepții
        legale sunt verificate separat.
      </p>
      <WithdrawalForm />
      <p>
        Poți comunica retragerea și prin email la{" "}
        <a className="underline" href="mailto:info@techtots.ro">
          info@techtots.ro
        </a>
        . Consultă{" "}
        <Link className="underline" href="/returns">
          politica de retur și rambursare
        </Link>
        . Pentru neconformitate sau garanție,{" "}
        <Link className="underline" href="/contact">
          contactează-ne
        </Link>
        ; aceste drepturi sunt distincte de retragere.
      </p>
    </div>
  );
}
