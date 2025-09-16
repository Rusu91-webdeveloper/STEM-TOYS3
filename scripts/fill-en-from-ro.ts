// Fill English multilingual fields from Romanian when EN is empty
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fill-en-from-ro.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const blogs = await prisma.blog.findMany({});
  let updated = 0;

  for (const blog of blogs) {
    const meta: any = blog.metadata || {};
    const multilingual = meta.multilingual || {};
    const ro = multilingual.ro;
    const en = multilingual.en;

    if (ro && ro.content && (!en || !en.content)) {
      const newMeta = {
        ...meta,
        language: "both" as const,
        multilingual: {
          en: {
            title: en?.title || ro.title || blog.title,
            excerpt: en?.excerpt || ro.excerpt || blog.excerpt,
            content: en?.content || ro.content,
          },
          ro,
        },
      };

      await prisma.blog.update({
        where: { id: blog.id },
        data: { metadata: newMeta },
      });
      // eslint-disable-next-line no-console
      console.log(`Filled EN from RO for ${blog.slug}`);
      updated += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Fill complete. Updated ${updated} blogs.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
