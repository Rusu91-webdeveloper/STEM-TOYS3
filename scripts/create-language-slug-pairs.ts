// Create -ro and -en slug pairs from existing bilingual blogs
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/create-language-slug-pairs.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUGS: string[] = [
  "top-10-jucarii-stem-pentru-dezvoltarea-timpurie",
  "cum-jucariile-de-programare-pregatesc-copiii-pentru-viitor",
  "jocuri-matematice-care-fac-invatarea-distractiva",
  "construirea-podurilor-proiecte-de-inginerie-pentru-copii",
];

async function main() {
  let created = 0;
  for (const base of TARGET_SLUGS) {
    const original = await prisma.blog.findUnique({ where: { slug: base } });
    if (!original) {
      console.log(`Skip ${base} (not found)`);
      continue;
    }
    const meta: any = original.metadata || {};
    const ml = meta.multilingual || {};
    const ro = ml.ro || {
      title: original.title,
      excerpt: original.excerpt,
      content: original.content,
    };
    const en = ml.en || {
      title: original.title,
      excerpt: original.excerpt,
      content: original.content,
    };

    const roSlug = `${base}-ro`;
    const enSlug = `${base}-en`;

    // Create RO if missing
    const existingRo = await prisma.blog.findUnique({
      where: { slug: roSlug },
    });
    if (!existingRo) {
      await prisma.blog.create({
        data: {
          title: ro.title || original.title,
          slug: roSlug,
          excerpt: ro.excerpt || original.excerpt,
          content: ro.content || original.content,
          coverImage: original.coverImage,
          categoryId: original.categoryId,
          authorId: original.authorId,
          stemCategory: original.stemCategory,
          tags: original.tags,
          isPublished: original.isPublished,
          publishedAt: original.publishedAt ?? new Date(),
          readingTime: original.readingTime,
          metadata: { ...meta, language: "ro" },
        },
      });
      console.log(`Created ${roSlug}`);
      created += 1;
    }

    // Create EN if missing
    const existingEn = await prisma.blog.findUnique({
      where: { slug: enSlug },
    });
    if (!existingEn) {
      await prisma.blog.create({
        data: {
          title: en.title || original.title,
          slug: enSlug,
          excerpt: en.excerpt || original.excerpt,
          content: en.content || original.content,
          coverImage: original.coverImage,
          categoryId: original.categoryId,
          authorId: original.authorId,
          stemCategory: original.stemCategory,
          tags: original.tags,
          isPublished: original.isPublished,
          publishedAt: original.publishedAt ?? new Date(),
          readingTime: original.readingTime,
          metadata: { ...meta, language: "en" },
        },
      });
      console.log(`Created ${enSlug}`);
      created += 1;
    }
  }

  console.log(`Slug pairing complete. Created ${created} posts.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
