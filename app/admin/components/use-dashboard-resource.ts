"use client";

import { useEffect, useState } from "react";

interface ResourceState<T> {
  key: string;
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardResource<T>(path: string | null, refresh: number) {
  const [state, setState] = useState<ResourceState<T>>({
    key: path ?? "",
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    if (!path) return undefined;
    const controller = new AbortController();
    setState(previous => ({
      key: path,
      data: previous.key === path ? previous.data : null,
      loading: true,
      error: null,
    }));
    const load = async () => {
      try {
        const response = await fetch(path, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            response.status === 403
              ? "Accesul de administrator nu a putut fi verificat. Reautentifică-te sau încearcă din nou."
              : "Datele nu au putut fi încărcate. Încearcă din nou."
          );
        const data = (await response.json()) as T;
        if (!controller.signal.aborted)
          setState({ key: path, data, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted)
          setState(previous => ({
            ...previous,
            loading: false,
            error:
              error instanceof Error ? error.message : "Date indisponibile.",
          }));
      }
    };
    void load();
    return () => controller.abort();
  }, [path, refresh]);
  if (!path) return { data: null, loading: false, error: null };
  return state.key === path
    ? state
    : { data: null, loading: true, error: null };
}
