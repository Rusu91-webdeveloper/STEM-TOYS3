import Link from "next/link";
import React from "react";


import {
  RETURN_POLICY_CUSTOMER_PAYS_EN,
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_REFUND_EN,
  RETURN_POLICY_REFUND_RO,
  RETURN_POLICY_SELLER_PAYS_EN,
  RETURN_POLICY_SELLER_PAYS_RO,
} from "@/lib/returns/policy";

export function ReturnCostNotice({ language = "ro" }: { language?: string }) {
  const english = language === "en";
  return (
    <section
      aria-label={
        english ? "Return costs and refunds" : "Costuri de retur și rambursare"
      }
      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-3"
    >
      <h2 className="font-semibold text-slate-900">
        {english
          ? "Return costs and refunds"
          : "Costuri de retur și rambursare"}
      </h2>
      <p>
        {english
          ? RETURN_POLICY_CUSTOMER_PAYS_EN
          : RETURN_POLICY_CUSTOMER_PAYS_RO}
      </p>
      <p>{english ? RETURN_POLICY_REFUND_EN : RETURN_POLICY_REFUND_RO}</p>
      <p>
        {english ? RETURN_POLICY_SELLER_PAYS_EN : RETURN_POLICY_SELLER_PAYS_RO}
      </p>
      <p>
        <Link href="/returns" className="underline underline-offset-4">
          {english ? "Return policy" : "Politica de retur"}
        </Link>
        {" · "}
        <a href="/withdrawal" className="underline underline-offset-4">
          {english
            ? "Withdraw from the contract"
            : "Retrageți-vă din contract aici"}
        </a>
      </p>
    </section>
  );
}
