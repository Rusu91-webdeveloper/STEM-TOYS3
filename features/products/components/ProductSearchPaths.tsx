"use client";

import InternalLinkCards from "@/components/seo/InternalLinkCards";
import { generateProductInternalLinks } from "@/lib/seo/internal-linking";
import {
  getRegionalStemLinks,
  type SearchRouteCard,
} from "@/lib/seo/regional-search";
import type { Product } from "@/types/product";

type ProductSearchPathsProps = {
  product: Product;
};

export default function ProductSearchPaths({
  product,
}: ProductSearchPathsProps) {
  const productLinks: SearchRouteCard[] = generateProductInternalLinks(
    product
  ).map(link => ({
    href: link.url,
    label: link.anchor,
    description: link.context,
  }));

  const regionalLinks = getRegionalStemLinks(3).map(link => ({
    ...link,
    description: `${link.description} Util pentru cautari regionale cu intentie de cumparare.`,
  }));

  const links = [...productLinks.slice(0, 4), ...regionalLinks];

  return (
    <InternalLinkCards
      eyebrow="Rute de cautare"
      title="Unde mai castiga acest produs relevanta in cautare"
      description={`Legam produsul "${product.name}" de paginile comerciale si regionale care sustin intentia de selectie, comparatie si cumparare in Romania.`}
      links={links}
    />
  );
}
