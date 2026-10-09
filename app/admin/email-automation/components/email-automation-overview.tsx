"use client";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmailDashboard } from "@/lib/admin/email-contracts";

import { EmailLogRows } from "./email-history";

export function EmailAutomationOverview({ data }: { data: EmailDashboard }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Ultimele emailuri înregistrate</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailLogRows logs={data.recentLogs} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ultimele execuții ale regulilor</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentExecutions.length === 0 ? (
            <p>Nu există execuții înregistrate.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentExecutions.map(execution => (
                <li key={execution.id} className="rounded-lg border p-3">
                  <p className="font-medium">{execution.trigger.name}</p>
                  <p className="text-sm text-slate-600">
                    Stare înregistrată: {execution.status} ·{" "}
                    {new Date(execution.executedAt).toLocaleString("ro-RO", {
                      timeZone: "Europe/Bucharest",
                    })}
                  </p>
                  {execution.errorMessage && (
                    <p className="mt-1 break-words text-sm text-red-700">
                      {execution.errorMessage}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link
            className="mt-4 inline-block text-sm text-blue-700 underline"
            href="/admin/email-triggers"
          >
            Gestionare reguli de automatizare
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
