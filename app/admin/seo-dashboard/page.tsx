"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type EventRow = {
  time: string;
  page: string;
  action: string;
  element: string;
};

export default function SeoDashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detail = e.detail || {};
        const row: EventRow = {
          time: new Date().toLocaleTimeString(),
          page: window.location.pathname,
          action: String(detail.action || detail.event || "unknown"),
          element: String(detail.element || detail.elementId || "-"),
        };
        setEvents(prev => [row, ...prev].slice(0, 200));
      } catch {}
    };

    window.addEventListener("tt-conversion", handler as EventListener);
    return () =>
      window.removeEventListener("tt-conversion", handler as EventListener);
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return events;
    const f = filter.toLowerCase();
    return events.filter(
      r =>
        r.page.toLowerCase().includes(f) ||
        r.action.toLowerCase().includes(f) ||
        r.element.toLowerCase().includes(f)
    );
  }, [events, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SEO Dashboard</h1>
        <Link href="/" className="text-sm underline">
          Back to site
        </Link>
      </div>

      <div className="rounded-md border p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Key Pages</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="underline" href="/ghid-jucarii-stem-2025">
            Ghid 2025
          </Link>
          <Link className="underline" href="/jucarii-stem-dupa-varsta">
            După vârstă
          </Link>
          <Link className="underline" href="/beneficiile-jucariilor-stem">
            Beneficii STEM
          </Link>
          <Link className="underline" href="/faq">
            FAQ
          </Link>
          <Link className="underline" href="/categories/science">
            Categories
          </Link>
          <Link className="underline" href="/products">
            Products
          </Link>
        </div>
      </div>

      <div className="rounded-md border p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">
          On-site Click Stream (client session)
        </h2>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by page, action or element"
          className="border rounded px-3 py-2 text-sm w-full mb-3"
        />
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2">Time</th>
                <th className="p-2">Page</th>
                <th className="p-2">Action</th>
                <th className="p-2">Element</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={4}>
                    No events yet. Navigate the site and click CTAs.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className={i % 2 ? "bg-gray-50" : ""}>
                    <td className="p-2 whitespace-nowrap">{r.time}</td>
                    <td className="p-2">{r.page}</td>
                    <td className="p-2">{r.action}</td>
                    <td className="p-2">{r.element}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is a lightweight client-side view. GA4 remains the source of
          truth for reporting.
        </p>
      </div>
    </div>
  );
}
