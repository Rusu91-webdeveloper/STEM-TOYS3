"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SettingsView } from "@/lib/admin/settings-view";

export function useAdminSettings() {
  const [data, setData] = useState<SettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const load = useCallback(async () => {
    if (busy.current) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
        signal: request.signal,
      });
      if (!response.ok) throw new Error("Setările sunt indisponibile.");
      const result = await response.json();
      if (!request.signal.aborted) setData(result);
    } catch {
      if (!request.signal.aborted)
        setError("Setările nu au putut fi încărcate. Reîncearcă.");
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, [load]);
  const write = async (
    url: string,
    method: "PUT" | "POST",
    body: Record<string, unknown>,
    success: string
  ) => {
    if (!data || busy.current || loading) return false;
    busy.current = true;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, expectedUpdatedAt: data.updatedAt }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Modificarea nu a putut fi salvată.");
      if (mounted.current) {
        setData(result);
        setMessage(success);
      }
      return true;
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof Error ? failure.message : "Salvarea a eșuat."
        );
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  return { data, loading, saving, error, message, load, write };
}
