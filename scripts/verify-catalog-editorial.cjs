const catalog = require("../lib/products/catalog-editorial.ro.json");
const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base))
  throw new Error(
    "Usage: node scripts/verify-catalog-editorial.cjs https://deployment"
  );
(async () => {
  const response = await fetch(new URL("/api/products?limit=1000", base), {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
  const payload = await response.json();
  const products = payload.products;
  if (!Array.isArray(products) || products.length !== payload.pagination?.total)
    throw new Error("Catalog snapshot is incomplete");
  const failures = [];
  for (const product of products) {
    const copy = catalog.products.find(
      p =>
        p.id === product.id &&
        p.slug.toLowerCase() === product.slug.toLowerCase()
    );
    if (!copy) {
      failures.push(`${product.slug}: editorial review missing`);
      continue;
    }
    const plain = product.description
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    for (const field of [
      "intro",
      "benefit",
      "contents",
      "specifications",
      "warning",
    ]) {
      if (!plain.includes(copy[field]))
        failures.push(`${product.slug}: ${field} differs`);
    }
    if (product.name !== copy.name || product.ageRange !== copy.age)
      failures.push(`${product.slug}: name or age differs`);
  }
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      JSON.stringify({
        reviewedAt: catalog.reviewedAt,
        verifiedProducts: products.length,
        total: payload.pagination.total,
        allCurrentProductsReviewed: true,
      })
    );
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
