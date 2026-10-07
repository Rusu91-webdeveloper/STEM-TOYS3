import "server-only";

import { db } from "@/lib/db";

export interface StoreHealthCheck {
  id: string;
  label: string;
  status: "ok" | "attention" | "unavailable" | "manual";
  count: number | null;
  detail: string;
  href: string;
}

export function isSupplierFeedStale(
  feed: { lastSyncAt: Date | null; pollingIntervalMinutes: number | null },
  now: Date
): boolean {
  // The deployed Hobby cron runs daily; a nominal hourly feed must not create
  // a false alarm between scheduled runs. Allow one cadence plus 25% grace.
  const cadence = Math.max(1440, feed.pollingIntervalMinutes ?? 1440);
  return (
    !feed.lastSyncAt ||
    now.getTime() - feed.lastSyncAt.getTime() > cadence * 1.25 * 60_000
  );
}

export async function getStoreHealthReport(now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60_000);
  const results = await Promise.allSettled([
    db.supplierFeed.findMany({
      where: { isActive: true },
      select: {
        lastSyncAt: true,
        pollingIntervalMinutes: true,
        lastSyncStatus: true,
      },
    }),
    db.order.count({
      where: { paymentStatus: "FAILED", createdAt: { gte: since } },
    }),
    db.emailLog.count({
      where: {
        status: { in: ["failed", "FAILED", "error"] },
        createdAt: { gte: since },
      },
    }),
    db.order.count({
      where: {
        paymentStatus: "PAID",
        status: { in: ["PROCESSING", "FULFILLED"] },
        createdAt: { lt: new Date(now.getTime() - 48 * 60 * 60_000) },
        OR: [{ trackingNumber: null }, { trackingNumber: "" }],
        items: { some: { isDigital: false, productId: { not: null } } },
      },
    }),
  ]);
  const definitions = [
    {
      id: "supplier-stock",
      label: "Actualizarea stocului",
      detail:
        "Fluxuri active cu sincronizare eșuată, lipsă sau mai veche decât programul zilnic și perioada de grație.",
      href: "/admin/suppliers/feeds",
    },
    {
      id: "payments",
      label: "Comenzi noi cu plata eșuată",
      detail:
        "Comenzi create în ultimele 24h cu starea plății eșuată. Verifică motivul înainte de a contacta clientul sau de a reîncerca.",
      href: "/admin/orders",
    },
    {
      id: "emails",
      label: "Emailuri eșuate în ultimele 24h",
      detail:
        "Eșecuri înregistrate în jurnalul de email. Acceptarea SMTP și livrarea în inbox sunt etape diferite.",
      href: "/admin/email-automation",
    },
    {
      id: "dispatch",
      label: "Comenzi achitate care așteaptă expedierea",
      detail:
        "Comenzi fizice create de peste 48h, încă în procesare și fără număr de urmărire. Verifică programul de lucru și eventualele întârzieri.",
      href: "/admin/orders",
    },
  ];
  const checks: StoreHealthCheck[] = results.map((result, index) => {
    const definition = definitions[index];
    if (result.status !== "fulfilled")
      return {
        ...definition,
        status: "unavailable",
        count: null,
        detail:
          "Datele nu pot fi încărcate acum. Încearcă din nou; lipsa datelor nu confirmă funcționarea.",
      };
    const count = Array.isArray(result.value)
      ? result.value.filter(
          feed =>
            feed.lastSyncStatus === "FAILED" || isSupplierFeedStale(feed, now)
        ).length
      : result.value;
    return { ...definition, count, status: count > 0 ? "attention" : "ok" };
  });
  checks.push({
    id: "recovery",
    label: "Backup și recuperare",
    status: "manual",
    count: null,
    detail:
      "Confirmă în platforma bazei de date ultimul backup, perioada de recuperare și o restaurare într-un mediu separat. Acest panou nu poate verifica automat configurația furnizorului.",
    href: "/admin/settings",
  });
  return { checkedAt: now.toISOString(), checks };
}
