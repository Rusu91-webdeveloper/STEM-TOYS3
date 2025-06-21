/**
 * React hook for CSRF token management
 * Use this in client components that need CSRF protection
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { csrfTokenHelpers } from "@/lib/csrf";

interface UseCsrfTokenReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  addToHeaders: (headers: Record<string, string>) => Record<string, string>;
  addToFormData: (formData: FormData) => FormData;
}

/**
 * Hook for managing CSRF tokens in React components
 */
export function useCsrfToken(): UseCsrfTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const newToken = await csrfTokenHelpers.fetchCsrfToken();
      setToken(newToken);

      if (!newToken) {
        setError("Failed to fetch CSRF token");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to fetch CSRF token: ${errorMessage}`);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch token on mount
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  const addToHeaders = useCallback(
    (headers: Record<string, string>) => {
      if (!token) return headers;
      return csrfTokenHelpers.addTokenToHeaders(headers, token);
    },
    [token]
  );

  const addToFormData = useCallback(
    (formData: FormData) => {
      if (!token) return formData;
      return csrfTokenHelpers.addTokenToFormData(formData, token);
    },
    [token]
  );

  return {
    token,
    loading,
    error,
    refreshToken,
    addToHeaders,
    addToFormData,
  };
}

/**
 * Hook for making CSRF-protected API requests
 */
export function useCsrfFetch() {
  const { token, loading, error, addToHeaders } = useCsrfToken();

  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      if (loading) {
        throw new Error("CSRF token is still loading");
      }

      if (error) {
        throw new Error(`CSRF token error: ${error}`);
      }

      if (!token) {
        throw new Error("No CSRF token available");
      }

      const headers = addToHeaders(
        (options.headers as Record<string, string>) || {}
      );

      return fetch(url, {
        ...options,
        headers,
        credentials: "include", // Ensure cookies are sent
      });
    },
    [token, loading, error, addToHeaders]
  );

  return {
    csrfFetch,
    token,
    loading,
    error,
  };
}

/**
 * Hook for form submissions with CSRF protection
 */
export function useCsrfForm() {
  const { token, loading, error, addToFormData, addToHeaders } = useCsrfToken();

  const submitForm = useCallback(
    async (
      url: string,
      formData: FormData | Record<string, any>,
      options: Omit<RequestInit, "body"> = {}
    ): Promise<Response> => {
      if (loading) {
        throw new Error("CSRF token is still loading");
      }

      if (error) {
        throw new Error(`CSRF token error: ${error}`);
      }

      if (!token) {
        throw new Error("No CSRF token available");
      }

      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (formData instanceof FormData) {
        body = addToFormData(formData);
      } else {
        // JSON submission
        body = JSON.stringify({ ...formData, csrfToken: token });
        headers["Content-Type"] = "application/json";
      }

      headers = addToHeaders({
        ...headers,
        ...((options.headers as Record<string, string>) || {}),
      });

      return fetch(url, {
        method: "POST",
        ...options,
        headers,
        body,
        credentials: "include",
      });
    },
    [token, loading, error, addToFormData, addToHeaders]
  );

  return {
    submitForm,
    token,
    loading,
    error,
    addToFormData,
    addToHeaders,
  };
}
