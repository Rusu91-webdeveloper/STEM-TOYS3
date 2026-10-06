/** Refresh owned storefront photo copies using only the public catalog API. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const manifestFile = path.resolve("lib/products/catalog-images.json");
const photoDir = path.resolve("public/images/catalog");
const allowedHosts = new Set([
  "cdnmpro.com",
  "gomagcdn.ro",
  "www.boribon.ro",
  "boribon.ro",
]);
const refresh = process.argv.includes("--refresh");

async function main() {
  const manifest: Record<string, string> = JSON.parse(
    await readFile(manifestFile, "utf8")
  );
  const sourceArg = process.argv.find(arg => arg.startsWith("--source="));
  const source =
    sourceArg?.slice("--source=".length) ??
    "https://www.techtots.ro/api/products?limit=1000";
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
  const payload = await response.json();
  const products: Array<{ images?: string[] }> = Array.isArray(payload)
    ? payload
    : payload.products;
  if (!Array.isArray(products)) throw new Error("Catalog products missing");
  // Refuse a truncated catalog instead of silently calling a partial copy complete.
  if (payload.pagination?.total && payload.pagination.total > products.length)
    throw new Error(
      "Catalog API is paginated; fetch the full catalog before refreshing photos"
    );
  const originals = new Map(
    Object.entries(manifest).map(([source, local]) => [local, source])
  );
  const sources = [
    ...new Set(products.flatMap(product => product.images ?? [])),
  ]
    .map(source => originals.get(source) ?? source)
    .filter(
      source =>
        /^https:\/\//.test(source) && allowedHosts.has(new URL(source).hostname)
    );
  await mkdir(photoDir, { recursive: true });
  let copied = 0;
  const failures: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < sources.length) {
        const source = sources[next++];
        if (manifest[source] && !refresh) continue;
        try {
          const response = await fetch(source, {
            signal: AbortSignal.timeout(20000),
            redirect: "error",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          if (Number(response.headers.get("content-length")) > 10_000_000)
            throw new Error("Photo exceeds size limit");
          const original = Buffer.from(await response.arrayBuffer());
          if (original.length > 10_000_000)
            throw new Error("Photo exceeds size limit");
          // Preserve the photograph; strip metadata and optimize its delivery size.
          const photo = await sharp(original, { limitInputPixels: 40_000_000 })
            .rotate()
            .resize({
              width: 1200,
              height: 1200,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toBuffer();
          const filename = `${createHash("sha256").update(photo).digest("hex").slice(0, 20)}.webp`;
          await writeFile(path.join(photoDir, filename), photo);
          manifest[source] = `/images/catalog/${filename}`;
          copied++;
        } catch (error) {
          failures.push(
            `${new URL(source).pathname}: ${error instanceof Error ? error.message : "failed"}`
          );
        }
      }
    })
  );
  await writeFile(
    manifestFile,
    `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2)}\n`
  );
  console.log(
    JSON.stringify({
      photos: sources.length,
      copied,
      mapped: Object.keys(manifest).length,
      failures,
    })
  );
  if (failures.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
