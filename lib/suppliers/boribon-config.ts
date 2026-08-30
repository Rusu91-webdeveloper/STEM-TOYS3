import type { FieldMapping } from "@/lib/suppliers/types";

export const BORIBON_FEEDS = [
  {
    name: "Boribon General",
    sourceUrl:
      "https://www.boribon.ro/feed/products/6b4ddf7503cbf24a7fe711636e57d127",
    authoritativeForMissingStock: true,
  },
  {
    name: "Boribon Djeco",
    sourceUrl:
      "https://www.boribon.ro/feed/products/eede0e22ab27952666cabcdb8286a8f5",
  },
  {
    name: "Boribon Londji",
    sourceUrl:
      "https://www.boribon.ro/feed/products/ccd46761bcd1b8d7f9fbc285df4b0c87",
  },
  {
    name: "Boribon Egmont",
    sourceUrl:
      "https://www.boribon.ro/feed/products/02c7bdc8cdaadae49a162d1857ee38d5",
  },
  {
    name: "Boribon Fridolin",
    sourceUrl:
      "https://www.boribon.ro/feed/products/8e6b0708a46d57d49bf189f18156cd7c",
  },
  {
    name: "Boribon Creativamente",
    sourceUrl:
      "https://www.boribon.ro/feed/products/ef1948938b4414b1026d27f17254e7f7",
  },
  {
    name: "Boribon Clicstoys",
    sourceUrl:
      "https://www.boribon.ro/feed/products/2656fdf3dd7bc41d805f0f7a8bc24179",
  },
] as const;

export const BORIBON_ALLOWED_SKUS = [
  "B_2901",
  "B_3901",
  "B_3902",
  "CC-1001",
  "CC-1002",
  "CC-1003",
  "CC-1004",
  "CC-1007",
  "CC-1011",
  "CC-1019",
  "CC-1020",
  "CTV-711",
  "CTV-734",
  "CTV-842",
  "CTV_012",
  "DJ00807",
  "DJ00808",
  "DJ00817",
  "DJ03136",
  "DJ05600",
  "DJ05603",
  "DJ05611",
  "DJ05640",
  "DJ05641",
  "DJ05642",
  "DJ05645",
  "DJ08576",
  "DJ08581",
  "Egm_511172",
  "Egm_570135",
  "Egm_630526",
  "F_559882",
  "F_559890",
  "F_564068",
  "F_564070",
  "F_569016",
  "F_569018",
  "F_571905",
  "Fr_17131",
  "Fr_17197",
  "Fr_17265",
  "Fr_17266",
  "Fr_17323",
  "Fr_17342",
  "Fr_17351",
  "Fr_17366",
  "Fr_17422",
  "Fr_17462",
  "Fr_17481",
  "Fr_17519",
  "Fr_17523",
  "G_1409",
  "G_7080",
  "G_7087",
  "G_7088",
  "G_7412R",
  "G_7449",
  "K_550049",
  "K_567012",
  "K_567017",
  "K_620392",
  "K_620417",
  "K_676919",
  "K_678002",
  "LJ_CD022U",
  "LJ_CD023U",
  "LJ_PZ617U",
  "Lj_CD037U",
  "N_5015",
  "N_6010/CB",
  "N_6050",
  "N_8097",
  "Sv_23155",
  "Sv_23156",
  "TB_120473",
  "TB_160032",
  "TB_160128",
] as const;

export function buildBoribonMapping(
  authoritativeForMissingStock = false
): FieldMapping {
  return {
    sku: ["model", "sku", "id"],
    name: "name",
    description: "description",
    cost: "price_b2b",
    vat: "TVA",
    costVatMode: "net",
    retailPrice: "price_b2c",
    stock: "quantity",
    images: [
      "avatar",
      "image_additional1",
      "image_additional2",
      "image_additional3",
      "image_additional4",
    ],
    categoryPath: "categories",
    requiredFields: ["supplierSku", "retailPrice", "images"],
    enforceAllowedSkus: true,
    allowedSkus: [...BORIBON_ALLOWED_SKUS],
    autoCreateProducts: false,
    authoritativeForMissingStock,
    minimumExpectedItems: authoritativeForMissingStock ? 70 : undefined,
  };
}

export function validateBoribonConfig() {
  const uniqueSkus = new Set(BORIBON_ALLOWED_SKUS);
  const uniqueSources = new Set(BORIBON_FEEDS.map(feed => feed.sourceUrl));
  if (uniqueSkus.size !== 77) {
    throw new Error(`Expected 77 unique Boribon SKUs, found ${uniqueSkus.size}`);
  }
  if (uniqueSources.size !== 7) {
    throw new Error(
      `Expected 7 unique Boribon feed sources, found ${uniqueSources.size}`
    );
  }
  if (
    BORIBON_FEEDS.filter(
      feed =>
        "authoritativeForMissingStock" in feed &&
        feed.authoritativeForMissingStock
    ).length !== 1
  ) {
    throw new Error("Exactly one Boribon feed must be authoritative for missing stock");
  }
}
