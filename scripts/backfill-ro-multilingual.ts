// Simple backfill script to add Romanian multilingual stubs to existing blogs
// Usage: ts-node scripts/backfill-ro-multilingual.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const blogs = await prisma.blog.findMany({});
  let updated = 0;

  for (const blog of blogs) {
    const meta: any = blog.metadata || {};
    const multilingual = meta.multilingual || {};
    const hasRo =
      multilingual.ro && (multilingual.ro.title || multilingual.ro.content);

    if (!hasRo) {
      const newMeta = {
        ...meta,
        language: meta.language === "both" ? "both" : meta.language || "en",
        multilingual: {
          en: multilingual.en || {
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
          },
          ro: multilingual.ro || {
            title: "",
            excerpt: "",
            content: "",
          },
        },
      };

      // If we now have both languages, mark as both
      if (newMeta.multilingual.en && newMeta.multilingual.ro) {
        newMeta.language = "both";
      }

      await prisma.blog.update({
        where: { id: blog.id },
        data: { metadata: newMeta },
      });
      updated += 1;
      // eslint-disable-next-line no-console
      console.log(`Updated blog ${blog.slug} with RO multilingual stub`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Backfill complete. Updated ${updated} blogs.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
