"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fillTemplate } from "@/lib/format/template";
import { useTranslation } from "@/lib/i18n";
import { buildProductsListingPath } from "@/lib/utils/products-listing-url";
import { cn } from "@/lib/utils";
import {
  productsGlassPanelClass,
  productsAccentPillClass,
} from "./productsTheme";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
  totalItems?: number;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
  totalItems,
}: ProductsPaginationProps) {
  const { t } = useTranslation();
  // Show pagination even for single page so the UI is visible (e.g. "Pagina 1 din 1 · 12 produse")
  if (totalPages < 1) return null;

  const createPageUrl = (page: number) => {
    const path = buildProductsListingPath(searchParams, page);
    if (baseUrl === "/products") return path;
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `${baseUrl}${query}`;
  };

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full px-3",
              currentPage === i
                ? "bg-slate-900 text-white hover:bg-slate-900/90"
                : "border-slate-200 text-slate-600 hover:text-slate-900"
            )}
            asChild
          >
            <Link href={createPageUrl(i)}>{i}</Link>
          </Button>
        );
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        pages.push(
          <Button
            key={1}
            variant="outline"
            size="sm"
            className="rounded-full px-3 border-slate-200 text-slate-600 hover:text-slate-900"
            asChild
          >
            <Link href={createPageUrl(1)}>1</Link>
          </Button>
        );
        if (startPage > 2) {
          pages.push(
            <span
              key="start-ellipsis"
              className="flex h-8 w-8 items-center justify-center text-slate-400"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full px-3",
              currentPage === i
                ? "bg-slate-900 text-white hover:bg-slate-900/90"
                : "border-slate-200 text-slate-600 hover:text-slate-900"
            )}
            asChild
          >
            <Link href={createPageUrl(i)}>{i}</Link>
          </Button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(
            <span
              key="end-ellipsis"
              className="flex h-8 w-8 items-center justify-center text-slate-400"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }
        pages.push(
          <Button
            key={totalPages}
            variant="outline"
            size="sm"
            className="rounded-full px-3 border-slate-200 text-slate-600 hover:text-slate-900"
            asChild
          >
            <Link href={createPageUrl(totalPages)}>{totalPages}</Link>
          </Button>
        );
      }
    }

    return pages;
  };

  return (
    <nav
      className={cn(
        productsGlassPanelClass,
        "flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      )}
      aria-label={t("paginationNav", "Pagination")}
    >
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className={productsAccentPillClass}>{t("pagesLabel", "Pages")}</span>
        <span>
          {fillTemplate(t("paginationPage", "Page {page} of {total}"), {
            page: currentPage,
            total: totalPages,
          })}
          {typeof totalItems === "number"
            ? ` · ${fillTemplate(t("paginationItems", "{count} items"), {
                count: totalItems,
              })}`
            : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-slate-200 text-slate-600 hover:text-slate-900"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={createPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
              {t("paginationPrevious", "Previous")}
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              {t("paginationPrevious", "Previous")}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-1">{renderPageNumbers()}</div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-slate-200 text-slate-600 hover:text-slate-900"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={createPageUrl(currentPage + 1)}>
              {t("paginationNext", "Next")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              {t("paginationNext", "Next")}
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}
