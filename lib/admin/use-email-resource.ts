"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";

import { readEmailResource } from "./email-contracts";

export function useEmailResource<T>(url: string, schema: z.ZodType<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setData(null);
    setError(null);
    setLoading(true);
    try {
      const result = await readEmailResource(url, schema, controller.signal);
      if (!controller.signal.aborted) setData(result);
    } catch {
      if (!controller.signal.aborted)
        setError(
          "Datele nu au putut fi încărcate. Verifică sesiunea și reîncearcă."
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [url, schema]);
  useEffect(() => {
    void refresh();
    return () => request.current?.abort();
  }, [refresh]);
  return { data, error, loading, refresh };
}
