/** Read-only preview by default. Never writes stock or product identities. */
import fs from "fs";
import os from "os";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient, Prisma } from "@prisma/client";
import portfolio from "../lib/suppliers/boribon/portfolio.json";
import {
  GIFT_SLUGS,
  GLOVE_SLUG,
  visibleInBrowse,
} from "../lib/products/merchandising";
const env = Object.assign(
  {},
  ...[".env", ".env.local"].map(p => dotenv.parse(fs.readFileSync(p)))
);
const production = process.argv.includes("--production");
const url = production ? env.DATABASE_URL_PRODUCTION : env.DATABASE_URL;
if (
  !url ||
  (!production && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
)
  throw Error("Remote database requires --production");
const db = new PrismaClient({ datasources: { db: { url } } });
async function main() {
  const products = await db.product.findMany({ where: { isActive: true } });
  const changes = products.map(p => {
    const entry = portfolio.find(e => e.model === p.sku);
    const attributes = { ...((p.attributes as Record<string, unknown>) ?? {}) };
    let ageGroup = p.ageGroup;
    // Reviewed supplier age-on-box in the existing portfolio. Ambiguous bands remain unasserted.
    if (entry && !/verify/i.test(entry.recommendedAge)) {
      attributes.manufacturerRecommendedAge = `${entry.minAge}+`;
      attributes.manufacturerAgeSource = entry.url;
      attributes.brand = entry.brand;
    }
    if (p.slug === GLOVE_SLUG) {
      attributes.originalAgeText = "8+ cu ajutor / 10+ individual";
      attributes.manufacturerRecommendedAge = "8+";
      ageGroup = "MIDDLE_SCHOOL_9_12";
    }
    const rank = GIFT_SLUGS.indexOf(p.slug as (typeof GIFT_SLUGS)[number]);
    const excluded = /bluetooth|chimie|anatomia/i.test(p.name);
    const previous = (p.metadata as any)?.merchandising ?? {};
    const metadata = {
      ...((p.metadata as Record<string, unknown>) ?? {}),
      merchandising: {
        ...previous,
        featuredOrder: rank < 0 ? null : rank + 1,
        homepageExcluded: rank < 0,
        adsExcluded: excluded || !visibleInBrowse(p),
      },
    };
    if (rank >= 0) {
      const copy = [
        "Rachetă cu propulsie pe apă TopBright, pentru experimente în aer liber. Vârsta recomandată: 6+. Livrare 1–4 zile lucrătoare. Plată și ramburs.",
        "Mănușă robotică Genius Toy de construit: 8+ cu ajutor, 10+ individual. Livrare 1–4 zile lucrătoare. Plată și ramburs.",
        "Kit Genius Toy cu turbină eoliană și mașinuță electrică. Vârsta recomandată: 8+. Livrare 1–4 zile lucrătoare. Plată și ramburs.",
        "Instrument optic Navir 3 în 1: telescop, periscop și microscop, de la 6 ani. Livrare 1–4 zile lucrătoare. Plată și ramburs.",
      ][rank];
      Object.assign(metadata, {
        metaTitle: p.name,
        metaTitleRo: p.name,
        metaDescription: copy,
        metaDescriptionRo: copy,
      });
    }
    return {
      id: p.id,
      data: {
        attributes: attributes as Prisma.InputJsonValue,
        metadata: metadata as Prisma.InputJsonValue,
        ageGroup,
        featured: rank >= 0 && p.stockQuantity > 1,
      },
    };
  });
  console.log(
    JSON.stringify(
      {
        active: products.length,
        lowStock: products.filter(p => p.stockQuantity <= 1).length,
        unknownAgesLeftBlank: products.filter(p => !p.ageGroup).length,
        heroes: products
          .filter(p => GIFT_SLUGS.includes(p.slug as any))
          .map(p => ({
            slug: p.slug,
            stock: p.stockQuantity,
            price: p.price,
            status: p.status,
            images: p.images.length,
          })),
        apply: process.argv.includes("--apply"),
      },
      null,
      2
    )
  );
  if (!process.argv.includes("--apply")) return;
  const dir = path.join(
    os.homedir(),
    ".codex/backups",
    `merchandising-${Date.now()}`
  );
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    path.join(dir, "products-before.json"),
    JSON.stringify(products, null, 2),
    { mode: 0o600 }
  );
  await db.$transaction(
    changes.map(c => db.product.update({ where: { id: c.id }, data: c.data }))
  );
  console.log(`Recovery snapshot: ${dir}/products-before.json`);
}
main().finally(() => db.$disconnect());
