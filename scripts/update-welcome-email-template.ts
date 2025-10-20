/**
 * Update the welcome email template messaging to remove manual code instructions
 * and clearly communicate automatic 10% discount on first order.
 *
 * Run: pnpm tsx scripts/update-welcome-email-template.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n✉️  Updating welcome email template messaging...\n");

  const template = await prisma.emailTemplate.findFirst({
    where: { slug: "welcome" },
  });

  if (!template) {
    console.log(
      "⚠️  Welcome template not found in DB. If templates are file-based, skip this."
    );
    return;
  }

  const original = template.content || "";

  // Remove common manual code phrases if present
  const patterns = [
    /STEM10/gi,
    /introdu\s+codul[^<\n]*/gi,
    /codul\s+t(a|ă)u\s+de\s+reducere[^<\n]*/gi,
    /folose[sș]te\s+(cuponul|codul)[^<\n]*/gi,
  ];

  let updated = original;
  for (const p of patterns) {
    updated = updated.replace(p, "");
  }

  // Append/ensure automatic discount messaging exists
  const autoMsg = `\n<p><strong>🎁 Bonus de Bun Venit</strong><br/>\nPrimești automat 10% reducere la prima ta comandă — fără cod. Reducerea se aplică automat la finalizarea comenzii.</p>\n`;
  if (!/Bonus de Bun Venit/.test(updated)) {
    updated = updated + "\n" + autoMsg;
  }

  await prisma.emailTemplate.update({
    where: { id: template.id },
    data: { content: updated },
  });

  console.log("✅ Welcome email template updated.");
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
