import Link from "next/link";

import {
  formatCodFeeLabel,
  type PublicCODSettings,
} from "@/lib/pricing/cod-settings";

/** The fee is supplied by the same admin settings used to price checkout. */
export function CodPaymentNotice({
  settings,
}: {
  settings: PublicCODSettings;
}) {
  const fee = formatCodFeeLabel(settings);
  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
      <p className="font-semibold text-slate-900">
        Ramburs la adresă
        {fee
          ? `: +${fee}`
          : settings.active === false
            ? ": fără taxă suplimentară"
            : ": taxa se confirmă la finalizare"}
        .
      </p>
      {Number(settings.percentage) > 0 && (
        <p>
          Procentul se aplică produselor și livrării după reduceri, înainte de
          taxa ramburs.
        </p>
      )}
      <p>
        Fiecare comandă ramburs necesită o autorizare temporară pe card pentru
        transportul tur. Nu este o plată în avans. Produsele și livrarea se
        plătesc la primire. FANbox acceptă plata online.
      </p>
      <Link
        href="/shipping#rto"
        className="inline-block underline underline-offset-2"
      >
        Condiții ramburs și garanție pe card
      </Link>
    </div>
  );
}
