"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SnapshotResponse = {
  redis: boolean;
  data: Record<
    string,
    {
      count: number;
      avg: number;
      p75: number;
      last: { value?: number; rating?: string; ts?: number } | null;
    }
  >;
};

export function WebVitalsSnapshot() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/web-vitals");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SnapshotResponse;
      setSnapshot(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatMs = (v?: number) =>
    typeof v === "number" ? `${Math.round(v)} ms` : "-";
  const formatUnit = (name: string, v?: number) => {
    if (typeof v !== "number") return "-";
    // CLS is unitless (0-1), others are ms
    return name === "CLS" ? v.toFixed(3) : `${Math.round(v)} ms`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Web Vitals Snapshot</CardTitle>
          <CardDescription>
            Aggregated last 24h (avg, p75, last)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-red-600">Failed to load: {error}</p>
        )}
        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Metric</th>
                  <th className="py-2 pr-4">Count</th>
                  <th className="py-2 pr-4">Avg</th>
                  <th className="py-2 pr-4">p75</th>
                  <th className="py-2 pr-4">Last</th>
                  <th className="py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(["LCP", "INP", "CLS", "FCP", "TTFB"] as const).map(name => {
                  const row = snapshot?.data?.[name];
                  return (
                    <tr key={name} className="border-t">
                      <td className="py-2 pr-4 font-medium">{name}</td>
                      <td className="py-2 pr-4">{row?.count ?? 0}</td>
                      <td className="py-2 pr-4">
                        {formatUnit(name, row?.avg)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatUnit(name, row?.p75)}
                      </td>
                      <td className="py-2 pr-4">
                        {name === "CLS"
                          ? ((row?.last?.value ?? undefined)?.toFixed?.(3) ??
                            "-")
                          : formatMs(row?.last?.value)}
                      </td>
                      <td className="py-2">
                        {row?.last?.rating ? (
                          <span
                            className={
                              row.last.rating === "good"
                                ? "text-green-600"
                                : row.last.rating === "needs-improvement"
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {row.last.rating}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Storage: {snapshot?.redis ? "Redis" : "In-memory fallback"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
