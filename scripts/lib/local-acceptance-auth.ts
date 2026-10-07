import assert from "node:assert/strict";

import type { APIRequestContext } from "@playwright/test";

export async function loginFixture(
  api: APIRequestContext,
  input: { email: string; password: string; role: string; baseURL: string }
) {
  const csrf = await (await api.get("/api/auth/csrf")).json();
  await api.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      email: input.email,
      password: input.password,
      callbackUrl: input.baseURL,
    },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  const session = await (await api.get("/api/auth/session")).json();
  assert.equal(
    session.user?.role,
    input.role,
    "Real credentials login must establish the expected role"
  );
}

export async function fixtureCsrf(api: APIRequestContext) {
  const result = await (await api.get("/api/csrf-token")).json();
  assert.ok(result.csrfToken);
  return { "X-CSRF-Token": result.csrfToken };
}
