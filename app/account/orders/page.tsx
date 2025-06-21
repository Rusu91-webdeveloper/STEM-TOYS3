import React from "react";
import { auth } from "@/lib/auth";
import { OrderHistory } from "@/features/account/components/OrderHistory";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getTranslations("ro"); // Default to Romanian

  return {
    title: `${t("orders")} | ${t("account")}`,
    description: t("viewOrderHistory"),
  };
}

export default async function OrdersPage() {
  const session = await auth();
  const t = await getTranslations("ro"); // Default to Romanian

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("myOrders")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("viewOrderHistory")}</p>
      </div>
      <OrderHistory />
    </div>
  );
}
