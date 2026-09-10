import {
  parseKidstoryCsv,
  selectKidstoryProducts,
} from "@/lib/suppliers/kidstory/feed";

const selection = [{ sourceId: "123", sku: "KIT/EU", ean: "0012345678901" }];
const row = () => ({
  id: "123",
  sku: "KIT/EU",
  ean: "0012345678901",
  base_price: "143,50",
  currency: "RON",
  stock_status: "1",
  stock_status_string: "instock",
  price_vat: "21",
});

describe("Kidstory feed boundary", () => {
  it("preserves exact B2C without inventing quantity or B2B cost", () => {
    expect(selectKidstoryProducts([row()], selection)[0]).toMatchObject({
      valid: true,
      retailPrice: 143.5,
      available: true,
      quantity: null,
      purchaseCost: null,
    });
  });
  it("accepts unavailable products", () => {
    expect(
      selectKidstoryProducts(
        [{ ...row(), stock_status: "0", stock_status_string: "outofstock" }],
        selection
      )[0]
    ).toMatchObject({ valid: true, available: false });
  });
  it.each([
    { sku: "KIT" },
    { ean: "12345678901" },
    { id: "456" },
    { currency: "EUR" },
    { base_price: "0" },
    { base_price: "-1" },
    { base_price: "" },
    { base_price: "NaN" },
    { stock_status: "12" },
    { stock_status_string: "outofstock" },
  ])("closes availability on invalid source fields %j", change => {
    expect(
      selectKidstoryProducts([{ ...row(), ...change }], selection)[0]
    ).toMatchObject({ valid: false, available: false, retailPrice: null });
  });
  it("rejects ambiguous and missing identities", () => {
    for (const rows of [[], [row(), row()]])
      expect(selectKidstoryProducts(rows, selection)[0].valid).toBe(false);
    expect(() =>
      selectKidstoryProducts([row()], [...selection, ...selection])
    ).toThrow("Duplicate");
  });
  it("parses quoted pipe CSV with multiline text and leading-zero EAN", () => {
    const csv =
      'id|sku|ean|base_price|currency|stock_status|stock_status_string|description\n"123"|"KIT/EU"|"0012345678901"|"143.50"|"RON"|"1"|"instock"|"Line one | quoted\nLine two"';
    expect(parseKidstoryCsv(csv, selection)[0]).toMatchObject({
      valid: true,
      retailPrice: 143.5,
    });
  });
  it("rejects unrelated CSV", () => {
    expect(() => parseKidstoryCsv("id,name\n1,Test", selection)).toThrow(
      "Invalid Kidstory"
    );
  });
});

import { kidstoryContent } from "@/lib/suppliers/kidstory/feed";
it("preserves supplier text, age and ordered image list", () => {
  const source = { ...row(), name: "Supplier name", description: "<p>Exact supplier details</p>", file: "https://gomagcdn.ro/first.jpg", image2: "https://gomagcdn.ro/second.jpg", varsta: "7-10 ani", brand_name: "4M", short_description: "Exact short text", disponibilitate: "In stoc" };
  expect(kidstoryContent(source)).toMatchObject({ name: source.name, description: source.description, images: [source.file, source.image2], attributes: { age: source.varsta, shortDescription: source.short_description, inventoryMode: "supplier-availability" } });
  expect(() => kidstoryContent({ ...source, file: "javascript:alert(1)" })).toThrow("invalid Kidstory content");
});
