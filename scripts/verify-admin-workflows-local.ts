import assert from "node:assert/strict";
import { config } from "dotenv";

async function main() {
  config({ path: ".env.local" });
  const dbUrl = new URL(process.env.DATABASE_URL ?? "");
  if (
    dbUrl.hostname !== "localhost" ||
    dbUrl.port !== "55434" ||
    dbUrl.pathname !== "/stemtoys_admin_dev"
  )
    throw new Error("Requires the isolated admin test database.");
  const base = "http://localhost:3000";
  const cookies = new Map<string, string>();
  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${base}${path}`, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
      headers: {
        cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
        ...init.headers,
      },
    });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(";")[0];
      const split = pair.indexOf("=");
      cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return response;
  };
  const json = async (path: string, init: RequestInit = {}) => {
    const response = await request(path, init);
    assert.equal(
      response.status,
      200,
      `${path}: expected successful response, got ${response.status}`
    );
    return response.json();
  };
  for (const path of [
    "/api/admin/settings",
    "/api/admin/payment-rollout",
    "/api/admin/seo/google-search-console",
    "/api/returns/admin",
  ]) {
    const response = await request(path);
    assert.ok(
      [401, 403].includes(response.status),
      `Anonymous access to ${path} must be denied`
    );
  }
  const page = await request("/admin/products");
  assert.ok([302, 307].includes(page.status));
  assert.ok(page.headers.get("location")?.includes("/auth/login"));
  const { csrfToken } = await json("/api/auth/csrf");
  await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken,
      email: "admin@dashboard.local",
      password: "DashboardLocal2026!",
      callbackUrl: `${base}/admin`,
    }).toString(),
  });
  assert.equal((await json("/api/auth/session")).user.role, "ADMIN");
  const settings = await json("/api/admin/settings");
  assert.ok(settings.updatedAt && Array.isArray(settings.history));
  assert.ok(!("securitySettings" in settings));
  const copyResponse = await request("/api/admin/settings/backups");
  assert.equal(copyResponse.status, 200);
  assert.equal(copyResponse.headers.get("cache-control"), "private, no-store");
  const orders = await json("/api/admin/orders?period=all&limit=100");
  assert.equal(orders.pagination.total, 8);
  const euro = orders.orders.find(
    (row: { id: string }) => row.id === "DEMO-1006"
  );
  assert.equal(euro.total, 888);
  assert.equal(euro.currency, "EUR");
  const detail = await json(`/api/admin/orders/${euro.dbId}`);
  assert.equal(detail.order.currency, "EUR");
  assert.equal(detail.order.total, 888);
  const customer = await json("/api/admin/customers/dashboard-guest");
  assert.equal(customer.totalSpent, 330);
  assert.ok(!("password" in customer));
  const history = await json(
    "/api/admin/orders?period=all&customerId=dashboard-customer&limit=100"
  );
  assert.equal(history.pagination.total, 1);
  assert.equal(history.orders[0].id, "DEMO-1002");
  const suppliers = await json(
    "/api/admin/suppliers?status=PENDING&page=1&limit=1"
  );
  assert.equal(suppliers.pagination.total, 1);
  assert.equal(suppliers.filters.statusCounts.PENDING, 1);
  assert.equal(
    (await json("/api/admin/suppliers?search=Furnizor")).pagination.total,
    1
  );
  assert.equal(
    suppliers.suppliers[0].contactPersonEmail,
    "supplier@dashboard.local"
  );
  const supplierExport = await request("/api/admin/suppliers/export", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ status: "PENDING" }),
  });
  assert.equal(supplierExport.status, 200);
  const csv = await supplierExport.text();
  assert.ok(csv.includes('"Firmă"') && csv.includes("Furnizor de test"));
  const returns = await json(
    "/api/returns/admin?search=Kit%20robotic&page=1&limit=10"
  );
  assert.equal(returns.pagination.total, 1);
  assert.equal(
    returns.returns[0].orderItem.product.name,
    "Kit robotic educativ"
  );
  assert.equal((await request("/api/returns/admin?page=-1")).status, 400);
  const returnRecord = returns.returns[0];
  const csrf = await json("/api/csrf-token");
  const returnUpdate = async (resolutionNotes: string | null) =>
    json(`/api/returns/${returnRecord.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf.csrfToken,
        origin: base,
      },
      body: JSON.stringify({
        liability: returnRecord.liability,
        resolutionStatus: returnRecord.resolutionStatus,
        externalClaimDeadline: returnRecord.externalClaimDeadline,
        resolutionNotes,
      }),
    });
  try {
    await returnUpdate(
      "Verificare locală: notă administrativă, fără notificare sau rambursare."
    );
    const updated = await json("/api/returns/admin?search=Kit%20robotic");
    assert.equal(
      updated.returns[0].resolutionNotes,
      "Verificare locală: notă administrativă, fără notificare sau rambursare."
    );
  } finally {
    await returnUpdate(returnRecord.resolutionNotes ?? null);
  }
  const product = await json("/api/admin/products/dashboard-robot");
  const productUpdate = async (stockQuantity: number) =>
    json("/api/admin/products/dashboard-robot", {
      method: "PUT",
      headers: { "Content-Type": "application/json", origin: base },
      body: JSON.stringify({ stockQuantity }),
    });
  try {
    await productUpdate(product.stockQuantity + 1);
    assert.equal(
      (await json("/api/admin/products/dashboard-robot")).stockQuantity,
      product.stockQuantity + 1
    );
  } finally {
    await productUpdate(product.stockQuantity);
  }
  for (const path of [
    "/api/checkout/shipping-settings",
    "/api/checkout/cod-settings",
    "/api/checkout/tax-settings",
    "/api/checkout/settings",
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  const snapshotCount = settings.backups.length;
  for (const path of [
    "/api/admin/seo/google-search-console",
    "/api/admin/payment-rollout",
  ]) {
    const response = await request(path, {
      method: "POST",
      headers: { origin: base },
    });
    assert.equal(response.status, 503);
  }
  assert.ok(snapshotCount > 0);
  console.log(
    "PASS: anonymous access denial, admin sign-in, real settings/history, order currency/detail, customer paid totals/history filter, supplier list/export, global return search and note save, product stock save/reload/restoration, fresh checkout configuration and retired fake saves."
  );
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
