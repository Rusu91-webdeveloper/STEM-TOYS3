// Normalize blogs so current content is assigned to RO in multilingual metadata
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-blog-assign-ro.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function looksRomanian(text: string): boolean {
  const diacritics = /[ăâîșşţțĂÂÎȘŞŢȚ]/;
  const commonWords =
    /(și|pentru|copii|învăț|jucării|dezvoltare|educațional|către|este|aceasta)/i;
  return diacritics.test(text) || commonWords.test(text);
}

async function main() {
  const blogs = await prisma.blog.findMany({});
  let changed = 0;

  for (const blog of blogs) {
    const meta: any = blog.metadata || {};
    const multilingual = meta.multilingual || {};

    // Determine if the main content/title look Romanian
    const contentLooksRo =
      looksRomanian(blog.content || "") || looksRomanian(blog.title || "");

    // If RO slot is empty and content looks Romanian, assign RO from main fields
    const needAssignRo =
      (!multilingual.ro || !multilingual.ro.content) && contentLooksRo;

    if (needAssignRo) {
      const newMeta = {
        ...meta,
        language: "both" as const,
        multilingual: {
          en: multilingual.en || {
            title: "",
            excerpt: "",
            content: "",
          },
          ro: {
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
          },
        },
      };

      await prisma.blog.update({
        where: { id: blog.id },
        data: { metadata: newMeta },
      });
      // eslint-disable-next-line no-console
      console.log(`Assigned RO from main fields for ${blog.slug}`);
      changed += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Migration complete. Updated ${changed} blogs.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
