import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { db } from "@/lib/db";
import {
  CRISTALE_4M_SLUG,
  getProductContentOverride,
} from "@/lib/products/catalog-content-overrides";

import GiftIdeasEmailCapture from "./GiftIdeasEmailCapture";

export const dynamic = "force-dynamic";

const PAGE_PATH = "/cadouri-stem-6-8-ani";
const PAGE_URL = `https://www.techtots.ro${PAGE_PATH}`;
const AGE_FILTER_URL = "/products?ageGroup=ELEMENTARY_6_8";

const PRODUCT_SLUGS = [
  CRISTALE_4M_SLUG,
  "cubologic-9-joc-de-logica-DJ08581",
  "crab-robot-hibrid-4m-kit-eco-stem-4M-03448",
  "creagami-panda-origami-3d-educational-CTV-734",
  "set-educativ-sapa-si-descopera-dinozauri---t-rex-4M-03221",
] as const;

const UPGRADE_COPY: Record<string, string> = {
  "cubologic-9-joc-de-logica-DJ08581":
    "Joc de logică cu provocări vizuale și piese din lemn.",
  "crab-robot-hibrid-4m-kit-eco-stem-4M-03448":
    "Kit de construcție pentru explorarea mecanismelor și energiei hibride.",
  "creagami-panda-origami-3d-educational-CTV-734":
    "Activitate de origami 3D construită pas cu pas.",
  "set-educativ-sapa-si-descopera-dinozauri---t-rex-4M-03221":
    "Kit de săpături pentru descoperirea unui model de T-Rex.",
};

const FAQS = [
  {
    question: "Ce e un cadou STEM bun la 6–8 ani?",
    answer:
      "Experiment sau joc de logică, vârstă clară pe cutie, fără ecran — timp pe masă, nu pe tabletă.",
  },
  {
    question: "Cât durează livrarea?",
    answer: "1–3 zile cu FanCourier, după confirmarea stocului.",
  },
  {
    question: "De unde încep?",
    answer:
      "Set Cristale Roșu 4M (~100 lei). Upgrade: Cubologic, Crab Robot, Creagami sau T-Rex dig — dacă sunt InStock.",
  },
  {
    question: "Cum plătesc?",
    answer: "Card via Stripe sau Netopia.",
  },
] as const;

export const metadata: Metadata = {
  title: "Cadouri STEM 6–8 ani — fără ecran, livrare 1–3 zile | TechTots",
  description:
    "Kituri STEM pentru 6–8 ani: experimente și logică, vârstă pe cutie. Lead: Set Cristale 4M. Livrare 1–3 zile în România.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Cadouri STEM 6–8 ani — fără ecran, livrare 1–3 zile | TechTots",
    description:
      "Kituri STEM pentru 6–8 ani: experimente și logică, vârstă pe cutie. Lead: Set Cristale 4M. Livrare 1–3 zile în România.",
    url: PAGE_URL,
    type: "website",
    locale: "ro_RO",
    siteName: "TechTots",
  },
};

type LandingProduct = {
  slug: string;
  name: string;
  price: number;
  stockQuantity: number;
  images: string[];
  attributes: unknown;
};

function getAttributes(product: LandingProduct): Record<string, unknown> {
  return product.attributes && typeof product.attributes === "object"
    ? (product.attributes as Record<string, unknown>)
    : {};
}

function getBrand(product: LandingProduct): string | null {
  const override = getProductContentOverride(product.slug);
  if (override?.brand) return override.brand;

  const brand = getAttributes(product).brand;
  return typeof brand === "string" && brand.trim() ? brand.trim() : null;
}

function getManufacturerAge(product: LandingProduct): string | null {
  const override = getProductContentOverride(product.slug);
  if (override?.manufacturerAge) return override.manufacturerAge;

  const attributes = getAttributes(product);
  const age =
    attributes.manufacturerRecommendedAge ?? attributes.originalAgeText;
  return typeof age === "string" && age.trim() ? age.trim() : null;
}

function getAudience(age: string | null) {
  if (!age) return undefined;
  const match = age.match(/(\d+)\s*(?:[-–]\s*(\d+)|\+)/);
  if (!match) return undefined;

  return {
    "@type": "PeopleAudience",
    suggestedMinAge: Number(match[1]),
    ...(match[2] ? { suggestedMaxAge: Number(match[2]) } : {}),
  };
}

function productUrl(slug: string) {
  return `https://www.techtots.ro/products/${slug}`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(price);
}

async function getLandingProducts(): Promise<LandingProduct[]> {
  const products = await db.product.findMany({
    where: {
      slug: { in: [...PRODUCT_SLUGS] },
      isActive: true,
      status: "APPROVED",
      stockQuantity: { gt: 0 },
    },
    select: {
      slug: true,
      name: true,
      price: true,
      stockQuantity: true,
      images: true,
      attributes: true,
    },
  });

  const productBySlug = new Map<string, LandingProduct>(
    products.map(product => [product.slug, product])
  );
  return PRODUCT_SLUGS.map(slug => productBySlug.get(slug))
    .filter((product): product is LandingProduct => product !== undefined)
    .filter(product => product.stockQuantity > 0 && Boolean(getBrand(product)));
}

function buildStructuredData(products: LandingProduct[]) {
  const productItems = products.map((product, index) => {
    const url = productUrl(product.slug);
    const manufacturerAge = getManufacturerAge(product);

    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        url,
        image: product.images,
        brand: {
          "@type": "Brand",
          name: getBrand(product),
        },
        ...(getAudience(manufacturerAge)
          ? { audience: getAudience(manufacturerAge) }
          : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "RON",
          price: product.price,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "TechTots",
            url: "https://www.techtots.ro",
          },
        },
      },
    };
  });

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: "Cadouri STEM pentru 6–8 ani",
      description:
        "Experimente și jocuri de logică — fără ecran. Livrare 1–3 zile.",
      inLanguage: "ro-RO",
      isPartOf: { "@id": "https://www.techtots.ro/#website" },
      about: [
        { "@type": "Thing", name: "vârstă 6–8" },
        { "@type": "Organization", name: "TechTots" },
        { "@type": "Organization", name: "FanCourier" },
        { "@type": "Organization", name: "Stripe" },
        { "@type": "Organization", name: "Netopia" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Acasă",
          item: "https://www.techtots.ro/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Cadouri STEM pentru 6–8 ani",
          item: PAGE_URL,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${PAGE_URL}#products`,
      name: "Kituri STEM 6–8 ani în stoc",
      numberOfItems: productItems.length,
      itemListElement: productItems,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];
}

export default async function StemGiftsSixToEightPage() {
  const products = await getLandingProducts();
  const lead = products.find(product => product.slug === CRISTALE_4M_SLUG);
  const upgrades = products.filter(
    product => product.slug !== CRISTALE_4M_SLUG
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_42%,#fffaf0_100%)] text-slate-950">
      <SeoJsonLd data={buildStructuredData(products)} />

      <section className="relative overflow-hidden border-b border-sky-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-bold text-sky-800 shadow-sm">
            Kit STEM 6–8 ani · fără ecran · livrare 1–3 zile
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Cadouri STEM pentru 6–8 ani
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
            Experimente și jocuri de logică — fără ecran. Livrare 1–3 zile.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={AGE_FILTER_URL}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-600 px-6 font-black text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500"
            >
              Vezi kiturile 6–8 →
            </Link>
            <Link
              href="#idei-cadou-email"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-700"
            >
              Primește idei de cadou pe email
            </Link>
          </div>

          <p className="mt-10 rounded-2xl border border-white/80 bg-white/75 px-5 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
            Livrare 1–3 zile · FanCourier · Stripe / Netopia · Vârstă pe cutie
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-14 sm:px-6 lg:px-8">
        {lead ? (
          <section className="grid overflow-hidden rounded-[2rem] border border-rose-200 bg-white shadow-[0_28px_70px_-38px_rgba(190,24,93,0.5)] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-72 bg-rose-50">
              {lead.images[0] ? (
                <Image
                  src={lead.images[0]}
                  alt="Set Cristale Roșu 4M"
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-contain p-8"
                />
              ) : null}
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-700">
                Entry STEM
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Set Cristale Roșu 4M
              </h2>
              <p className="mt-3 text-lg font-bold text-slate-700">
                ~{Math.round(lead.price)} lei · 7–10 (overlap cadou 6–8)
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-700">
                Crești cristale acasă. Entry STEM, unboxing clar.
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Vârsta recomandată de producător: 10+.
              </p>
              <Link
                href={`/products/${CRISTALE_4M_SLUG}`}
                className="mt-7 inline-flex min-h-12 w-fit items-center justify-center rounded-xl bg-rose-600 px-6 font-black text-white transition hover:bg-rose-500"
              >
                Vezi setul →
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_25px_65px_-45px_rgba(15,23,42,0.55)] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">
            Cum alegi
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Un traseu simplu de selecție
          </h2>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-700">
            vârstă pe cutie → entry ~100 lei (Cristale) → upgrade
            logică/robotică → Zig &amp; Go dacă vrei demo filmabil (later)
          </p>
        </section>

        {upgrades.length > 0 ? (
          <section>
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
                Upgrade-uri în stoc
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Logică, robotică și descoperire
              </h2>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {upgrades.map(product => (
                <article
                  key={product.slug}
                  className="flex overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_55px_-40px_rgba(15,23,42,0.55)]"
                >
                  <div className="flex w-full flex-col">
                    <div className="relative aspect-square bg-slate-50">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          className="object-contain p-5"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                        {getBrand(product)}
                      </p>
                      <h3 className="mt-2 text-lg font-black leading-6">
                        {product.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {UPGRADE_COPY[product.slug]}
                      </p>
                      <p className="mt-4 font-black text-slate-900">
                        {formatPrice(product.price)}
                      </p>
                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 font-bold text-sky-800 transition hover:bg-sky-100"
                      >
                        Vezi produsul
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <GiftIdeasEmailCapture />

        <section aria-labelledby="faq-cadouri-stem">
          <h2 id="faq-cadouri-stem" className="text-3xl font-black sm:text-4xl">
            Întrebări frecvente
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {FAQS.map(faq => (
              <article
                key={faq.question}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.55)]"
              >
                <h3 className="text-lg font-black">{faq.question}</h3>
                <p className="mt-3 leading-7 text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <nav
          aria-label="Pagini utile"
          className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-8 text-sm font-bold text-sky-800"
        >
          <Link href={`/products/${CRISTALE_4M_SLUG}`}>
            Set Cristale Roșu 4M
          </Link>
          <Link href={AGE_FILTER_URL}>Toate produsele 6–8 ani</Link>
          <Link href="/faq">FAQ TechTots</Link>
          <Link href="/about">Despre TechTots</Link>
          <Link href="/shipping">Livrare</Link>
        </nav>
      </div>
    </main>
  );
}
