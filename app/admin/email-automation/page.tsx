"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emailDashboardContract } from "@/lib/admin/email-contracts";
import { useEmailResource } from "@/lib/admin/use-email-resource";

import { EmailAnalytics } from "./components/email-analytics";
import { EmailAutomationOverview } from "./components/email-automation-overview";
import { EmailCampaigns } from "./components/email-campaigns";
import { EmailHistory } from "./components/email-history";
import { EmailSegments } from "./components/email-segments";

export default function EmailAutomationPage() {
  const { data, loading, error, refresh } = useEmailResource(
    "/api/admin/email-dashboard",
    emailDashboardContract
  );
  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email și automatizări</h1>
          <p className="mt-2 text-slate-600">
            Șabloane, abonați și istoricul emailurilor din baza de date a
            magazinului.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          disabled={loading}
        >
          Reîncarcă datele
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/email-templates">Gestionare șabloane</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/email-sequences">Gestionare secvențe</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/email-triggers">Reguli de automatizare</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/settings">Setări email</Link>
        </Button>
      </div>
      {loading ? (
        <p role="status">Se încarcă datele email…</p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-white p-5"
        >
          <p>{error}</p>
          <Button className="mt-3" onClick={() => void refresh()}>
            Reîncearcă
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Șabloane salvate", data.counts.templates, "Toate stările"],
              [
                "Abonați activi",
                data.counts.subscribers,
                `${data.counts.inactiveSubscribers} abonați inactivi`,
              ],
              [
                "Acceptate de furnizor",
                data.counts.accepted,
                "Include teste; acceptare, nu livrare",
              ],
              [
                "Trimiteri eșuate",
                data.counts.failed,
                `${data.counts.logs} înregistrări în istoric`,
              ],
              [
                "Secvențe salvate",
                data.counts.sequences,
                `${data.counts.activeSequences} configurate active`,
              ],
              [
                "Campanii salvate",
                data.counts.campaigns,
                `${data.counts.activeCampaigns} în trimitere / programate`,
              ],
              [
                "Reguli de automatizare",
                data.counts.triggers,
                `${data.counts.activeTriggers} configurate active`,
              ],
              [
                "Trimiteri urmărite",
                data.metrics.totalSent,
                "Evenimente SENT salvate, fără teste",
              ],
            ].map(([title, value, detail]) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <p className="text-sm text-slate-600">{title}</p>
                  <p className="my-2 text-3xl font-bold">
                    {Number(value).toLocaleString("ro-RO")}
                  </p>
                  <p className="text-xs text-slate-500">{detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {data.counts.unverified > 0 && (
            <p
              role="note"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"
            >
              {data.counts.unverified} înregistrări vechi au starea „sent”, fără
              confirmare de la furnizor. Sunt vizibile în istoric și nu sunt
              numărate ca emailuri acceptate.
            </p>
          )}
          <p className="text-sm text-slate-500">
            Sunt afișate numai înregistrările păstrate în baza de date.
            Emailurile vechi fără jurnal și evenimentele eliminate prin politica
            de retenție nu pot fi reconstruite. O listă goală confirmată nu este
            o eroare de încărcare.
          </p>
          <Tabs defaultValue="overview" className="min-w-0 space-y-4">
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="overview">Activitate</TabsTrigger>
              <TabsTrigger value="history">Istoric email</TabsTrigger>
              <TabsTrigger value="campaigns">Campanii</TabsTrigger>
              <TabsTrigger value="analytics">Statistici</TabsTrigger>
              <TabsTrigger value="subscribers">Abonați</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <EmailAutomationOverview data={data} />
            </TabsContent>
            <TabsContent value="history">
              <EmailHistory />
            </TabsContent>
            <TabsContent value="campaigns">
              <EmailCampaigns />
            </TabsContent>
            <TabsContent value="analytics">
              <EmailAnalytics metrics={data.metrics} />
            </TabsContent>
            <TabsContent value="subscribers">
              <EmailSegments />
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
