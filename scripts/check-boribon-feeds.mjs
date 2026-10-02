import fs from "fs";
import path from "path";
import XLSX from "xlsx";

// Pass private feed URLs through the environment, never source control.
const FEEDS = (process.env.BORIBON_FEED_URLS || "")
  .split(",")
  .map(url => url.trim())
  .filter(Boolean);

function parseDelimitedText(text, delimiter) {
  const rows = [];
  let row = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(currentVal);
      rows.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal);
    rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows
    .slice(1)
    .filter(r => r.some(cell => String(cell).trim() !== ""));

  return dataRows.map(cols => {
    const record = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

function parseRowsFromText(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const usePipeDelimiter = firstLine.includes("|") && !firstLine.includes(",");

  if (usePipeDelimiter) {
    return parseDelimitedText(text, "|");
  }

  const workbook = XLSX.read(text, { type: "string" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
    defval: "",
  });
}

async function fetchFeedRows(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Boribon feed HTTP ${response.status}`);
  }
  const text = await response.text();
  return parseRowsFromText(text);
}

function resolveSku(row) {
  const model = String(row.model ?? "").trim();
  if (model) return model;
  const sku = String(row.sku ?? "").trim();
  if (sku) return sku;
  const id = String(row.id ?? "").trim();
  if (id) return id;
  return "";
}

function loadLocalModels() {
  const filePath = path.resolve(
    process.cwd(),
    "feed_suppliers/boribon_dropshipping.csv"
  );
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing local file: ${filePath}`);
  }
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = parseRowsFromText(text);
  const models = rows
    .map(row => String(row.model ?? "").trim())
    .filter(Boolean);
  return new Set(models);
}

async function main() {
  if (!FEEDS.length) throw new Error("Missing BORIBON_FEED_URLS env var.");
  const localModels = loadLocalModels();
  console.log(`Local boribon models: ${localModels.size}`);

  const feedSkuSet = new Set();
  const perFeedCounts = [];

  for (const url of FEEDS) {
    const rows = await fetchFeedRows(url);
    let skus = 0;
    for (const row of rows) {
      const sku = resolveSku(row);
      if (!sku) continue;
      if (!feedSkuSet.has(sku)) {
        feedSkuSet.add(sku);
      }
      skus += 1;
    }
    perFeedCounts.push({
      index: perFeedCounts.length + 1,
      rows: rows.length,
      skus,
    });
  }

  const missing = Array.from(localModels).filter(
    model => !feedSkuSet.has(model)
  );

  console.log("Per-feed counts:");
  for (const feed of perFeedCounts) {
    console.log(
      `- Feed ${feed.index}: rows=${feed.rows}, skuRows=${feed.skus}`
    );
  }
  console.log(`Total unique SKUs across feeds: ${feedSkuSet.size}`);
  console.log(`Missing from feeds: ${missing.length}`);

  if (missing.length > 0) {
    const outputPath = path.resolve(
      process.cwd(),
      "feed_suppliers/boribon_missing_from_live_feeds.csv"
    );
    const header = "model\n";
    fs.writeFileSync(outputPath, header + missing.join("\n"));
    console.log(`Missing list saved to ${outputPath}`);
    console.log(
      `Sample missing (first 30): ${missing.slice(0, 30).join(", ")}`
    );
  }
}

main().catch(error => {
  console.error(
    "Boribon feed check failed:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exit(1);
});
