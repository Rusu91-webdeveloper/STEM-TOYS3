import React from "react";

import { OrderHistory } from "@/features/account/components/OrderHistory";
import { glassPanelClass } from "@/features/home/components/homeTheme";
import { getTranslations } from "@/lib/i18n/server";
import { auth } from "@/lib/server/auth";
import { getOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await auth();
  const t = await getTranslations("ro"); // Default to Romanian

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  const orders = await getOrders();

  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex flex-col gap-1 border-white/10 bg-slate-900/70 px-5 py-4 text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight">{t("myOrders")}</h2>
        <p className="text-sm text-slate-300">{t("viewOrderHistory")}</p>
      </div>
      <OrderHistory initialOrders={orders} />
    </div>
  );
}
