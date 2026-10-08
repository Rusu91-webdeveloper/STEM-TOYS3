import Link from "next/link";

import { formatStorefrontPrice } from "@/lib/format/storefront-price";
import { RETURN_WINDOW_DAYS } from "@/lib/returns/policy";
import type { ProductDelivery } from "@/lib/shipping/product-delivery";

export function ProductDeliverySummary({
  delivery,
}: {
  delivery: ProductDelivery;
}) {
  if (delivery.isDigital)
    return (
      <p className="text-sm text-slate-600">
        Produs digital, fără transport fizic. Accesul este disponibil după
        confirmarea plății.
      </p>
    );
  return (
    <section
      aria-label="Livrare și retur"
      className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
    >
      <p className="font-semibold text-slate-950">
        Livrare estimată: 1–4 zile lucrătoare
      </p>
      {delivery.methods.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {delivery.methods.map(method => (
            <li
              key={method.name}
              className="flex flex-wrap justify-between gap-x-3 gap-y-1"
            >
              <span>
                {method.name}
                {method.prepaid ? " · plată online" : ""}
              </span>
              <strong>
                {method.price === 0
                  ? "Gratuită"
                  : formatStorefrontPrice(method.price)}
              </strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">
          Costul se calculează în checkout pentru produsele și adresa alese.
        </p>
      )}
      {delivery.freeThreshold !== null && (
        <p className="mt-2">
          Prag de livrare gratuită:{" "}
          {formatStorefrontPrice(delivery.freeThreshold)}, conform condițiilor
          de livrare.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-600">
        Estimare pentru un produs, înainte de reduceri. Adresa, coletele
        suplimentare și disponibilitatea se confirmă în checkout. Taxa ramburs
        este separată.
      </p>
      <details className="mt-2 border-t border-slate-100">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">
          Retur și condiții de livrare
        </summary>
        <p className="leading-6">
          Retragere în {RETURN_WINDOW_DAYS} zile calendaristice. Transportul de
          retur este plătit de client dacă se răzgândește; pentru
          neconformitate, transportul este fără costuri pentru client.
        </p>
        <Link
          href="/shipping"
          className="inline-flex min-h-11 items-center font-semibold text-sky-800 underline"
        >
          Detalii de livrare
        </Link>
        <span aria-hidden="true"> · </span>
        <Link
          href="/returns"
          className="inline-flex min-h-11 items-center font-semibold text-sky-800 underline"
        >
          Politica de retur
        </Link>
      </details>
    </section>
  );
}
