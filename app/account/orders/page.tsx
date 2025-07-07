import React from "react";

import { OrderHistory } from "@/features/account/components/OrderHistory";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/server";
import { getOrders } from "@/lib/orders";

export default async function OrdersPage() {
  const session = await auth();
  const t = await getTranslations("ro"); // Default to Romanian

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("myOrders")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("viewOrderHistory")}</p>
      </div>
      <OrderHistory initialOrders={orders} />
    </div>
  );
}
