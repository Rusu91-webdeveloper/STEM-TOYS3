"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { emailPagination } from "@/lib/admin/email-contracts";
import { useEmailResource } from "@/lib/admin/use-email-resource";
const triggerList = z.object({
  triggers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      type: z.string(),
      status: z.string(),
      isActive: z.boolean(),
      actionType: z.string(),
      _count: z.object({ executions: z.number().int().nonnegative() }),
    })
  ),
  pagination: emailPagination,
});
export default function EmailTriggersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { data, error, loading, refresh } = useEmailResource(
    `/api/admin/email-triggers?${new URLSearchParams({ page: String(page), search })}`,
    triggerList
  );
  const toggle = async (id: string, active: boolean) => {
    setBusy(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/admin/email-triggers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: active ? "PAUSED" : "ACTIVE" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Salvarea a eșuat");
      await refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Salvarea a eșuat");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Reguli de automatizare email</h1>
      <p className="text-slate-600">
        Regulile salvate și numărul execuțiilor înregistrate. Starea activă
        descrie configurația; rezultatele trimiterilor sunt în istoricul email.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/email-automation">Istoric și rezultate</Link>
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void refresh()}
        >
          Reîncarcă
        </Button>
      </div>
      <Input
        aria-label="Caută reguli"
        placeholder="Numele regulii"
        value={search}
        onChange={e => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />
      {saveError && (
        <p role="alert" className="text-red-700">
          {saveError}
        </p>
      )}
      {loading ? (
        <p role="status">Se încarcă regulile…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => void refresh()}>Reîncearcă</Button>
        </div>
      ) : (
        data && (
          <>
            <p>{data.pagination.total} reguli salvate</p>
            {!data.triggers.length ? (
              <p>Nu există reguli pentru această selecție.</p>
            ) : (
              data.triggers.map(trigger => (
                <Card key={trigger.id}>
                  <CardContent className="space-y-3 p-5">
                    <h2 className="text-lg font-semibold">{trigger.name}</h2>
                    <p>{trigger.description}</p>
                    <p className="text-sm text-slate-600">
                      {trigger.type} · {trigger.actionType} · {trigger.status} ·{" "}
                      {trigger._count.executions} execuții înregistrate
                    </p>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void toggle(trigger.id, trigger.isActive)}
                    >
                      {trigger.isActive ? "Pune în pauză" : "Activează"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
            <div className="flex gap-3">
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
