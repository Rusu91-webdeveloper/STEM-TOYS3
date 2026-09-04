import { render, screen } from "@testing-library/react";

import StemGiftsSixToEightPage, {
  metadata,
} from "@/app/cadouri-stem-6-8-ani/page";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    product: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill: _fill, priority: _priority, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const findMany = db.product.findMany as jest.Mock;

describe("/cadouri-stem-6-8-ani", () => {
  beforeEach(() => {
    findMany.mockResolvedValue([
      {
        slug: "set-cristale-rosu-4m-experiment-stem-viral-4M-03929",
        name: "Set Cristale Roșu 4M - Experiment STEM Viral",
        price: 101.43,
        stockQuantity: 5,
        images: ["https://example.com/cristale.png"],
        attributes: { brand: "4M", originalAgeText: "7-10 ani" },
      },
      {
        slug: "cubologic-9-joc-de-logica-DJ08581",
        name: "Cubologic 9 - Joc de Logică",
        price: 180.88,
        stockQuantity: 10,
        images: ["https://example.com/cubologic.png"],
        attributes: { brand: "Djeco", originalAgeText: "6-9 ani" },
      },
      {
        slug: "animonsters",
        name: "Animonsters",
        price: 100,
        stockQuantity: 0,
        images: [],
        attributes: { brand: "Djeco" },
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the locked copy, CTAs, and only one H1", async () => {
    const view = render(await StemGiftsSixToEightPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Cadouri STEM pentru 6–8 ani",
      })
    ).toBeInTheDocument();
    expect(view.container.querySelectorAll("h1")).toHaveLength(1);
    expect(
      screen.getByText(
        "Experimente și jocuri de logică — fără ecran. Livrare 1–3 zile."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Vezi kiturile 6–8 →" })
    ).toHaveAttribute("href", "/products?ageGroup=ELEMENTARY_6_8");
    expect(screen.getByRole("link", { name: "Vezi setul →" })).toHaveAttribute(
      "href",
      "/products/set-cristale-rosu-4m-experiment-stem-viral-4M-03929"
    );
    expect(screen.queryByText(/Animonsters/i)).not.toBeInTheDocument();
  });

  it("publishes an InStock 4M offer first and only four LP FAQs", async () => {
    const view = render(await StemGiftsSixToEightPage());
    const script = view.container.querySelector(
      'script[type="application/ld+json"]'
    );
    const schemas = JSON.parse(script?.textContent || "[]");
    const itemList = schemas.find(
      (schema: any) => schema["@type"] === "ItemList"
    );
    const faqPage = schemas.find(
      (schema: any) => schema["@type"] === "FAQPage"
    );
    const firstProduct = itemList.itemListElement[0].item;

    expect(firstProduct.name).toContain("Set Cristale Roșu 4M");
    expect(firstProduct.brand.name).toBe("4M");
    expect(firstProduct.offers.price).toBe(101.43);
    expect(firstProduct.offers.availability).toBe("https://schema.org/InStock");
    expect(firstProduct.audience.suggestedMinAge).toBe(10);
    expect(faqPage.mainEntity).toHaveLength(4);
    expect(JSON.stringify(schemas)).not.toContain("Animonsters");
  });

  it("exports the exact SEO title and meta description", () => {
    expect(metadata.title).toBe(
      "Cadouri STEM 6–8 ani — fără ecran, livrare 1–3 zile | TechTots"
    );
    expect(metadata.description).toBe(
      "Kituri STEM pentru 6–8 ani: experimente și logică, vârstă pe cutie. Lead: Set Cristale 4M. Livrare 1–3 zile în România."
    );
  });
});
