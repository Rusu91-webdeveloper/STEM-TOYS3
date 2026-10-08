import { buildCsv, csvCell } from "@/lib/admin/csv-export";

describe("admin CSV exports", () => {
  it("keeps Romanian text, currencies, quotes, commas and line breaks", () => {
    expect(
      buildCsv(
        ["Client", "Valoare", "Monedă"],
        [['Ștefan, "client"\nBucurești', 888, "EUR"]]
      )
    ).toBe(
      '\uFEFF"Client","Valoare","Monedă"\r\n"Ștefan, ""client""\nBucurești",888,"EUR"'
    );
  });
  it.each([
    '=HYPERLINK("evil")',
    "  +SUM(A1)",
    "-2+3",
    "@A1",
    "\tformula",
    "\rformula",
  ])("neutralizes spreadsheet formulas in %j", value => {
    expect(csvCell(value).startsWith("\"'")).toBe(true);
  });
  it("does not turn real numeric values into spreadsheet text or expose non-finite values", () => {
    expect(csvCell(-4.5)).toBe("-4.5");
    expect(csvCell(NaN)).toBe("");
    expect(csvCell(undefined)).toBe('""');
  });
});
