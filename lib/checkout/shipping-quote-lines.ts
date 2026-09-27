import { db } from "@/lib/db";

export interface ShippingQuoteLineInput {
  productId: string;
  quantity: number;
  isBook?: boolean;
}

export interface AuthoritativeQuoteLine {
  productId: string;
  quantity: number;
  isBook: false;
}

export interface AuthoritativeQuoteProduct {
  id: string;
  weight: number | null;
  dimensions: unknown;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string | null;
    companyName: string | null;
  } | null;
}

/**
 * Shipping quotes must follow the lines the shopper is checking out.
 * Prices, weight, and supplier come from the database. A truncated guest
 * cookie is never a substitute for this list.
 */
export async function loadAuthoritativePhysicalLines(
  lines: ShippingQuoteLineInput[]
): Promise<{
  lines: AuthoritativeQuoteLine[];
  products: AuthoritativeQuoteProduct[];
}> {
  const ids = Array.from(
    new Set(
      lines
        .map(line => line.productId)
        .filter(productId => productId.length > 0)
    )
  );

  if (ids.length === 0) {
    return { lines: [], products: [] };
  }

  const [products, books] = await Promise.all([
    db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      select: {
        id: true,
        weight: true,
        dimensions: true,
        supplierId: true,
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    }),
    db.book.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    }),
  ]);

  const bookIds = new Set(books.map(book => book.id));
  const productMap = new Map(products.map(product => [product.id, product]));
  const physical: AuthoritativeQuoteLine[] = [];

  for (const line of lines) {
    if (bookIds.has(line.productId) && !productMap.has(line.productId)) {
      continue;
    }

    const product = productMap.get(line.productId);
    if (!product) continue;

    const quantity = Math.floor(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    physical.push({
      productId: product.id,
      quantity,
      isBook: false,
    });
  }

  const usedIds = new Set(physical.map(line => line.productId));

  return {
    lines: physical,
    products: products.filter(product => usedIds.has(product.id)),
  };
}
