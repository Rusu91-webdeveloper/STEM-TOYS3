"use client";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  emailDashboardContract,
  emailPagination,
  type EmailDashboard,
} from "@/lib/admin/email-contracts";
import { useEmailResource } from "@/lib/admin/use-email-resource";
const logList = z.object({
  logs: emailDashboardContract.shape.recentLogs,
  pagination: emailPagination,
});
const labels: Record<string, string> = {
  accepted: "Acceptat de furnizor",
  sent: "Sent — fără confirmare",
  failed: "Eșuat",
  pending: "În așteptare",
  delivered: "Stare înregistrată: delivered",
};
export function EmailLogRows({ logs }: { logs: EmailDashboard["recentLogs"] }) {
  if (!logs.length)
    return <p>Nu există emailuri înregistrate pentru această selecție.</p>;
  return (
    <div className="space-y-3">
      {logs.map(log => (
        <article className="min-w-0 rounded-xl border p-4" key={log.id}>
          <div className="flex flex-wrap justify-between gap-2">
            <p className="break-words font-medium">{log.subject}</p>
            <span
              className={`text-sm ${log.verified ? "text-green-700" : log.status === "failed" ? "text-red-700" : "text-amber-700"}`}
            >
              {labels[log.status] ?? `Stare înregistrată: ${log.status}`}
            </span>
          </div>
          <p className="mt-1 break-all text-sm text-slate-600">
            Către: {log.to}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(log.createdAt).toLocaleString("ro-RO", {
              timeZone: "Europe/Bucharest",
            })}
            {log.template ? ` · ${log.template.name}` : ""}
          </p>
          {log.error && (
            <p className="mt-2 break-words text-sm text-red-700">{log.error}</p>
          )}
        </article>
      ))}
    </div>
  );
}
export function EmailHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, loading, error, refresh } = useEmailResource(
    `/api/admin/email-logs?${new URLSearchParams({ page: String(page), limit: "20", search })}`,
    logList
  );
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Istoric email</h2>
      <Input
        aria-label="Caută emailuri"
        placeholder="Destinatar sau subiect"
        value={search}
        onChange={e => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />
      {loading ? (
        <p role="status">Se încarcă istoricul…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => void refresh()}>Reîncearcă</Button>
        </div>
      ) : (
        data && (
          <>
            <p className="text-sm text-slate-500">
              {data.pagination.total} înregistrări
            </p>
            <EmailLogRows logs={data.logs} />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Înapoi
              </Button>
              <span>Pagina {page}</span>
              <Button
                variant="outline"
                disabled={page >= data.pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Înainte
              </Button>
            </div>
          </>
        )
      )}
    </div>
  );
}
