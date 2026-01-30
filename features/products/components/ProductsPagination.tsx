"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
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
      aria-label="Pagination"
    >
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className={productsAccentPillClass}>Pagini</span>
        <span>
          Page {currentPage} of {totalPages}
          {typeof totalItems === "number" ? ` · ${totalItems} items` : ""}
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
              Previous
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Previous
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
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}
