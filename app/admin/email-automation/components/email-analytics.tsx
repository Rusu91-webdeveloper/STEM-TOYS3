"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { EmailDashboard } from "@/lib/admin/email-contracts";

export function EmailAnalytics({
  metrics,
}: {
  metrics: EmailDashboard["metrics"];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Statistici de urmărire</h2>
      <p className="text-sm text-slate-600">
        Procentele folosesc mesajele distincte cu eveniment SENT înregistrat.
        Deschiderile și clicurile repetate sunt numărate o singură dată per
        mesaj. Testele sunt excluse. Fără o bază de trimiteri, procentul este
        indisponibil.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Deschideri", metrics.totalOpened, metrics.openRate],
          ["Clicuri", metrics.totalClicked, metrics.clickRate],
          ["Livrări confirmate", metrics.totalDelivered, metrics.deliveryRate],
          ["Respingeri", metrics.totalBounced, metrics.bounceRate],
          ["Dezabonări", metrics.totalUnsubscribed, metrics.unsubscribeRate],
        ].map(([label, count, rate]) => (
          <Card key={String(label)}>
            <CardContent className="p-5">
              <p>{label}</p>
              <p className="my-2 text-2xl font-bold">
                {rate === null ? "—" : `${rate}%`}
              </p>
              <p className="text-sm text-slate-500">
                {count} mesaje cu eveniment înregistrat
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Absența unui eveniment de deschidere sau clic nu dovedește că
        destinatarul nu a citit emailul. Nu există comparații sau ținte
        presupuse.
      </p>
    </div>
  );
}
