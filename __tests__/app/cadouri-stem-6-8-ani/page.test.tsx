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
        slug: "instrument-optic-3-in-1-telescop-periscop-microscop-navir-N_8097",
        name: "Instrument optic 3 în 1 Navir",
        price: 101.43,
        stockQuantity: 5,
        images: ["https://example.com/navir.png"],
        attributes: { brand: "Navir", originalAgeText: "6 - 9, 9+" },
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
    expect(view.container.textContent).not.toMatch(
      /cristale|unboxing|bestseller/i
    );
    expect(
      screen.getByText(
        /Telescop, periscop și microscop într-un singur instrument/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Observație și descoperire — fără ecran. Livrare 1–4 zile lucrătoare."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Vezi kiturile 6–8 →" })
    ).toHaveAttribute("href", "#selectie-cadouri");
    expect(screen.getByRole("link", { name: "Vezi setul →" })).toHaveAttribute(
      "href",
      "/products/instrument-optic-3-in-1-telescop-periscop-microscop-navir-N_8097"
    );
    expect(screen.queryByText(/Animonsters/i)).not.toBeInTheDocument();
  });

  it("publishes an InStock Navir offer first and only four LP FAQs", async () => {
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

    expect(firstProduct.name).toContain("Instrument optic 3 în 1 Navir");
    expect(firstProduct.brand.name).toBe("Navir");
    expect(firstProduct.offers.price).toBe(101.43);
    expect(firstProduct.offers.availability).toBe("https://schema.org/InStock");
    expect(firstProduct.audience.suggestedMinAge).toBe(6);
    expect(faqPage.mainEntity).toHaveLength(4);
    expect(JSON.stringify(schemas)).not.toContain("Animonsters");
  });

  it("does not promote an out-of-stock lead", async () => {
    findMany.mockResolvedValue([]);
    render(await StemGiftsSixToEightPage());
    expect(screen.queryByText("Selectat de TechTots")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Vezi setul →" })
    ).not.toBeInTheDocument();
  });

  it("exports the exact SEO title and meta description", () => {
    expect(metadata.title).toBe(
      "Cadouri STEM 6–8 ani — fără ecran, livrare 1–4 zile lucrătoare | TechTots"
    );
    expect(metadata.description).toBe(
      "Cadouri STEM fără ecran pentru 6–8 ani, alese după vârsta de pe cutie. Descoperire și joacă practică. Livrare 1–4 zile lucrătoare."
    );
  });
});
