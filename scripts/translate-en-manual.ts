// Manually translate EN titles for known Romanian blogs; keep excerpts/content as RO fallback for now
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/translate-en-manual.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TITLE_TRANSLATIONS: Record<string, string> = {
  "top-10-jucarii-stem-pentru-dezvoltarea-timpurie":
    "Top 10 STEM Toys for Early Childhood Development",
  "cum-jucariile-de-programare-pregatesc-copiii-pentru-viitor":
    "How Coding Toys Prepare Children for the Future",
  "jocuri-matematice-care-fac-invatarea-distractiva":
    "Math Games That Make Learning Fun",
  "construirea-podurilor-proiecte-de-inginerie-pentru-copii":
    "Building Bridges: Engineering Projects for Kids",
};

async function main() {
  let updated = 0;
  for (const [slug, enTitle] of Object.entries(TITLE_TRANSLATIONS)) {
    const blog = await prisma.blog.findUnique({ where: { slug } });
    if (!blog) {
      // eslint-disable-next-line no-console
      console.log(`Skipping ${slug} (not found)`);
      continue;
    }
    const meta: any = blog.metadata || {};
    const multilingual = meta.multilingual || {};
    const ro = multilingual.ro || {
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
    };
    const en = {
      title: enTitle,
      excerpt: multilingual.en?.excerpt || ro.excerpt || blog.excerpt,
      content: multilingual.en?.content || ro.content || blog.content,
    };

    const newMeta = {
      ...meta,
      language: "both" as const,
      multilingual: { en, ro },
    };

    await prisma.blog.update({
      where: { id: blog.id },
      data: { metadata: newMeta },
    });
    updated += 1;
    // eslint-disable-next-line no-console
    console.log(`Updated EN title for ${slug}`);
  }
  // eslint-disable-next-line no-console
  console.log(`Manual translation done. Updated ${updated} blogs.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
