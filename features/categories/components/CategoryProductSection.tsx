import Link from "next/link";

import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { ProductCard } from "@/features/products/components/ProductCard";
import { getCategoryPageProducts } from "@/lib/products/category-listing";
import {
  CATEGORY_LABELS_RO,
  categoryPagePath,
  type CanonicalCategorySlug,
  formatProductCountRo,
} from "@/lib/products/stem-category";
import { buildProductsUrl } from "@/lib/utils/product-filters-url";

interface CategoryProductSectionProps {
  slug: CanonicalCategorySlug;
  page: number;
}

export async function CategoryProductSection({
  slug,
  page,
}: CategoryProductSectionProps) {
  const listing = await getCategoryPageProducts(slug, page);
  const categoryName = CATEGORY_LABELS_RO[slug];
  const allProductsHref = buildProductsUrl({ category: slug });
  const countLabel = formatProductCountRo(listing.total);

  return (
    <section className="container mx-auto w-full px-4 pt-8 sm:px-6 sm:pt-12 lg:px-10 lg:pt-14">
      <div
        className={`${glassPanelClass} rounded-3xl border-slate-200/70 bg-white/85 px-5 py-6 shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-2xl">
              Produse din categoria {categoryName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{countLabel}</p>
          </div>
          {listing.total > 0 ? (
            <Link
              href={allProductsHref}
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Vezi toate
            </Link>
          ) : null}
        </div>

        {listing.total === 0 ? (
          <div
            className={`${glassCardClass} mt-6 flex flex-col items-start gap-4 rounded-2xl border-slate-200/70 bg-white px-5 py-8`}
          >
            <p className="text-base text-slate-700">
              Nu avem încă produse în categoria {categoryName}.
            </p>
            <Link
              href="/products"
              className={`${gradientButtonClass} inline-flex items-center px-4 py-2 text-sm font-semibold`}
            >
              Vezi toate produsele
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listing.products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {listing.totalPages > 1 ? (
              <nav
                className="mt-6 flex items-center justify-between gap-3"
                aria-label="Paginare produse"
              >
                {listing.page > 1 ? (
                  <Link
                    href={`${categoryPagePath(slug)}?page=${listing.page - 1}`}
                    className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    Pagina anterioară
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">
                    Pagina anterioară
                  </span>
                )}
                <p className="text-sm text-slate-600">
                  Pagina {listing.page} din {listing.totalPages}
                </p>
                {listing.page < listing.totalPages ? (
                  <Link
                    href={`${categoryPagePath(slug)}?page=${listing.page + 1}`}
                    className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    Pagina următoare
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">
                    Pagina următoare
                  </span>
                )}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
