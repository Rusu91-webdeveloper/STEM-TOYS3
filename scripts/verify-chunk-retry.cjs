/** Browser fault checks. All error reports and non-read requests are intercepted
 * locally: this never submits synthetic errors, orders or customer data. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = new URL(process.argv[2] || "http://localhost:3016");
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 (compatible; meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler))";

async function check(browser, path, persistent, viewport) {
  const context = await browser.newContext({
    userAgent,
    viewport,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const reports = [];
  let assetRequests = 0;
  const assetUrls = [];
  let documents = 0;
  const chunk =
    path === "/checkout"
      ? /\/_next\/static\/chunks\/app\/checkout\/page-[^/]+\.js$/
      : /\/_next\/static\/chunks\/82471-[^/]+\.js$/;
  try {
    // Isolate the loader's bound from the existing one-document recovery.
    if (persistent) {
      await context.addInitScript(() =>
        sessionStorage.setItem("techtots:chunk-recovery", String(Date.now()))
      );
    }
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === base.origin && url.pathname === "/api/errors") {
        reports.push(request.postDataJSON());
        return route.fulfill({ json: { success: true } });
      }
      if (!["GET", "HEAD"].includes(request.method())) return route.abort();
      if (chunk.test(url.pathname)) {
        assetRequests++;
        assetUrls.push(url);
        if (persistent || assetRequests === 1) return route.abort("failed");
      }
      const token = process.env.VERCEL_OIDC_TOKEN;
      return route.continue(
        token && url.origin === base.origin
          ? {
              headers: {
                ...request.headers(),
                "x-vercel-trusted-oidc-idp-token": token,
              },
            }
          : undefined
      );
    });
    page.on("request", request => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documents++;
    });
    const url = new URL(path, base);
    // An authorized preview share query establishes the protection cookie.
    url.search = base.search;
    const response = await page.goto(url.href, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(
      response.status(),
      path === "/checkout" ? 200 : 404,
      "fault fixture must preserve its HTTP status"
    );
    await page.waitForTimeout(4000);
    assert.equal(assetRequests, 2, `${path}: exactly one chunk retry`);
    assert.equal(assetUrls[1].searchParams.has("_chunk_retry"), true);
    assert.equal(
      assetUrls[1].searchParams.get("dpl"),
      assetUrls[0].searchParams.get("dpl")
    );
    assert.equal(documents, 1, "chunk retry must not refresh the document");
    if (persistent) {
      assert.equal(
        reports.length,
        1,
        "persistent failure must remain reported"
      );
      assert.equal(reports[0].additional.chunkRetryCount, 1);
      await page
        .getByRole("heading", { name: "Pagina nu s-a încărcat" })
        .waitFor();
    } else {
      assert.equal(
        reports.length,
        0,
        "recovered failure must not reach React's error boundary"
      );
      if (path === "/checkout") await page.waitForURL("**/products");
      else
        await page.getByRole("heading", { name: "404", exact: true }).waitFor();
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("techtots:chunk-recovery")
        ),
        null
      );
    }
    return {
      path,
      persistent,
      width: viewport.width,
      assetRequests,
      documents,
      errorReports: reports.length,
    };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = { width: 1280, height: 800 };
    const mobile = { width: 390, height: 844 };
    const results = [];
    for (const [path, persistent, viewport] of [
      ["/categories/a-probe-missing-route", false, desktop],
      ["/categories/a-probe-missing-route", false, mobile],
      ["/checkout", false, desktop],
      ["/checkout", true, desktop],
      ["/categories/a-probe-missing-route", true, desktop],
    ])
      results.push(await check(browser, path, persistent, viewport));
    console.log(JSON.stringify({ origin: base.origin, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(
    error.message.replace(
      /_vercel_share=[^&\s"')]+/g,
      "_vercel_share=[redacted]"
    )
  );
  process.exitCode = 1;
});
