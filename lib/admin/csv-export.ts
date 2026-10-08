/** Preserve commas, quotes and newlines while neutralizing spreadsheet formulas. */
export function csvCell(value: string | number | null | undefined) {
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  const raw = String(value ?? "");
  const safe = /^\s*[=+\-@]/.test(raw) || /^[\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  return `\uFEFF${[headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")}`;
}
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const url = URL.createObjectURL(
    new Blob([buildCsv(headers, rows)], { type: "text/csv;charset=utf-8;" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
