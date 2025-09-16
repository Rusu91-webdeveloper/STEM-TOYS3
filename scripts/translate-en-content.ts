// Provide full English translations for four Romanian blogs
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/translate-en-content.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Translation = {
  title: string;
  excerpt: string;
  content: string;
};

const EN_TRANSLATIONS: Record<string, Translation> = {
  "top-10-jucarii-stem-pentru-dezvoltarea-timpurie": {
    title: "Top 10 STEM Toys for Early Childhood Development",
    excerpt:
      "A curated list of STEM toys that build curiosity, fine motor skills, and foundational thinking for ages 3–6.",
    content: `# Top 10 STEM Toys for Early Childhood Development

Early childhood (ages 3–6) is the perfect time to spark curiosity and build the foundations for logical thinking, language, and fine motor skills. The toys below encourage hands-on exploration while keeping play joyful and frustration-free.

## What Matters at This Stage
- Short, repeatable activities with clear feedback
- Tactile materials and easy-to-handle pieces
- Naming steps out loud: put, push, count, sort

## Our Top Picks
1. Magnetic Tiles – Explore shapes, colors, and symmetry while building stable structures.
2. Large Construction Blocks – Practice stacking, balance, and perseverance.
3. Sorting & Matching Games – Classify by color, shape, and size to train categories and attention.
4. Simple Gears & Wheels – Discover cause-and-effect through visible motion.
5. Sensory Bins – Pouring, scooping, and transferring develop fine motor control.
6. Beginner Puzzles – Complete-to-fit builds spatial reasoning and patience.
7. Counting Bears & Number Trays – Make early numeracy concrete through manipulation.
8. Magnetic Mazes – Strengthen hand–eye coordination and planning.
9. Story-Based Science Kits – Observe, compare, and describe simple phenomena.
10. Pattern Blocks – Recognize patterns and compose shapes creatively.

## Parent Tips
- Keep sessions 10–15 minutes and celebrate effort, not perfection.
- Alternate free play with guided challenges ("Build a bridge that holds 3 blocks").
- Use process language: observe → try → adjust → try again.
`,
  },
  "cum-jucariile-de-programare-pregatesc-copiii-pentru-viitor": {
    title: "How Coding Toys Prepare Children for the Future",
    excerpt:
      "From sequences and loops to tangible robots, coding toys turn abstract ideas into playful problem solving.",
    content: `# How Coding Toys Prepare Children for the Future

Coding toys translate abstract computer science concepts into hands-on play. Children build sequences, test ideas, and get immediate feedback—exactly how real programming works.

## Why Start Early
- Builds logical thinking and planning
- Encourages persistence and iteration
- Turns "errors" into learning signals

## Screen-Free Coding Options
- Programmable Robots: Enter commands via buttons/cards and watch the plan run.
- Coding Board Games: Practice loops, conditions, and functions through movement.
- Construction + Coding: Build mechanisms, then create rules for how they move.

## When Screens Make Sense
- Block-Based Platforms: Snap blocks to focus on logic instead of syntax.
- Game-Based Learning: Challenges and levels keep motivation high.

## Parent Tips
- Praise process over outcome.
- Ask: "What did you expect? What actually happened? What will you change?"
- Connect to real life: traffic lights, elevators, apps—all follow logic!
`,
  },
  "jocuri-matematice-care-fac-invatarea-distractiva": {
    title: "Math Games That Make Learning Fun",
    excerpt:
      "Number sense, patterns, and logic—developed through joyful, low-pressure games children actually love.",
    content: `# Math Games That Make Learning Fun

Mathematics becomes engaging when children manipulate, compare, and explain ideas themselves. Good math games reduce anxiety and build genuine confidence.

## Core Concepts Through Play
- Number Sense: compare quantities, make estimates
- Patterns: spot, extend, and create sequences
- Spatial Reasoning: rotate and compose shapes
- Logic: justify choices and find multiple solutions

## Game Ideas by Focus
- Early Counting: number paths, matching cards, counting tokens
- Operations: trading games (tens/ones), card sums, dice challenges
- Fractions: tiles, pizza games, and measuring activities
- Strategy & Logic: puzzles and grid-based games that reward planning

## Parent Tips
- Embed math in daily life: cooking, shopping, and scheduling.
- Ask open questions: "How do you know? Is there another way?"
- Value thinking over speed. Accuracy follows understanding.
`,
  },
  "construirea-podurilor-proiecte-de-inginerie-pentru-copii": {
    title: "Building Bridges: Engineering Projects for Kids",
    excerpt:
      "Hands-on bridge projects teach stability, load, and iteration—the essence of engineering thinking.",
    content: `# Building Bridges: Engineering Projects for Kids

Engineering is a mindset: define a problem, prototype, test, and improve. Bridge projects make this concrete, visible, and exciting.

## Concepts Kids Experience
- Stability & Support: bases, spans, and pillars
- Load Distribution: where weight sits and how it travels
- Materials & Constraints: stiffness, flexibility, connection strength

## Project Ideas
1. Paper Beam Bridge – Fold paper into different shapes and test which holds more coins.
2. Straw Truss Bridge – Use triangles to increase rigidity and measure load to failure.
3. Cardboard Arch – Cut an arch, add keystone, compare with a flat beam.
4. Suspension Model – String + paper deck to understand tension vs. compression.

## Document the Process
- Plan → Build → Test → Improve
- Take photos at each version and write one thing learned per test.
- Celebrate iteration: "It didn’t fail—it taught us what to change."
`,
  },
};

async function main() {
  let updated = 0;
  for (const [slug, tr] of Object.entries(EN_TRANSLATIONS)) {
    const blog = await prisma.blog.findUnique({ where: { slug } });
    if (!blog) {
      // eslint-disable-next-line no-console
      console.log(`Skip ${slug} (not found)`);
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
      title: tr.title,
      excerpt: tr.excerpt,
      content: tr.content,
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
    console.log(`Translated EN body for ${slug}`);
  }
  // eslint-disable-next-line no-console
  console.log(`Translation complete. Updated ${updated} blogs.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
