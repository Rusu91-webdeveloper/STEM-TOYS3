"use client";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailPagination } from "@/lib/admin/email-contracts";
import { useEmailResource } from "@/lib/admin/use-email-resource";
const subscriberList = z.object({
  subscribers: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      isActive: z.boolean(),
      createdAt: z.string(),
    })
  ),
  pagination: emailPagination,
});
export function EmailSegments() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data, loading, error, refresh } = useEmailResource(
    `/api/admin/email-subscribers?${new URLSearchParams({ page: String(page), search, isActive: status })}`,
    subscriberList
  );
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Abonați newsletter</h2>
      <p className="text-sm text-slate-600">
        Adresele salvate prin înscrierea la newsletter, împreună cu starea lor
        reală.
      </p>
      <div className="flex flex-wrap gap-3">
        <Input
          className="sm:max-w-sm"
          aria-label="Caută abonați"
          placeholder="Adresă email"
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="rounded-md border p-2"
          aria-label="Starea abonamentului"
          value={status}
          onChange={e => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="all">Toate stările</option>
          <option value="true">Activ</option>
          <option value="false">Inactiv</option>
        </select>
      </div>
      {loading ? (
        <p role="status">Se încarcă abonații…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => void refresh()}>Reîncearcă</Button>
        </div>
      ) : (
        data && (
          <>
            <p>{data.pagination.total} abonați pentru selecția curentă</p>
            {!data.subscribers.length ? (
              <p>Nu există abonați pentru această selecție.</p>
            ) : (
              <ul className="space-y-2">
                {data.subscribers.map(subscriber => (
                  <li
                    key={subscriber.id}
                    className="flex flex-wrap justify-between gap-2 rounded-lg border bg-white p-4"
                  >
                    <span className="break-all">{subscriber.email}</span>
                    <span className="text-sm">
                      {subscriber.isActive ? "Activ" : "Inactiv"}
                    </span>
                  </li>
                ))}
              </ul>
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
