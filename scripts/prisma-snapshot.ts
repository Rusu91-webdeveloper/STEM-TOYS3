#!/usr/bin/env tsx

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function run(cmd: string) {
  return execSync(cmd, { stdio: "inherit" });
}

function main() {
  const prismaDir = path.resolve(process.cwd(), "prisma");
  const migrationsDir = path.join(prismaDir, "migrations");

  if (!fs.existsSync(prismaDir)) {
    console.error("❌ prisma directory not found.");
    process.exit(1);
  }

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotName = `snapshot-${timestamp}`;

  console.log("📦 Generating Prisma client (safety)...");
  run("npx prisma generate");

  console.log("🧭 Creating migration snapshot from current schema...");
  try {
    run(`npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/${snapshotName}.sql`);
    console.log(`✅ Snapshot created: prisma/migrations/${snapshotName}.sql`);
  } catch (e) {
    console.error("❌ Failed to create snapshot");
  }

  console.log("🔍 Creating diff between database and schema (for drift detection)...
If output is empty, DB matches schema.");
  try {
    run(`npx prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/${snapshotName}-db-diff.sql`);
    console.log(`✅ DB diff created: prisma/migrations/${snapshotName}-db-diff.sql`);
  } catch (e) {
    console.error("⚠️ Failed to create DB diff");
  }

  console.log("📄 Also exporting SQL from schema (SQL dump of current model)...");
  try {
    run(`npx prisma format`);
    run(`npx prisma db push --accept-data-loss --preview-feature --dry-run > prisma/migrations/${snapshotName}-push-preview.txt`);
    console.log(`✅ Preview written: prisma/migrations/${snapshotName}-push-preview.txt`);
  } catch {
    // optional
  }

  console.log("🎉 Prisma snapshot complete.");
}

main();


