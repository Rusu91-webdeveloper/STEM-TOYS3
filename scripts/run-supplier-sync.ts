import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import { runSupplierFeedSync } from "../lib/suppliers/sync";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

async function main() {
  const results = await runSupplierFeedSync();
  console.log("Supplier sync complete:");
  for (const result of results) {
    console.log(
      `- ${result.feedId} (${result.status}): imported ${result.imported}, updated ${result.updated}, failed ${result.failed}`
    );
  }
}

main().catch(error => {
  console.error("Supplier sync failed:", error);
  process.exit(1);
});
