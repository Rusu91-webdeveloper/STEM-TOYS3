"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  // Don't render pagination if there's only one page
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
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={createPageUrl(i)}>{i}</Link>
          </Button>
        );
      }
    } else {
      // Show ellipsis for larger page counts
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      // Always show first page
      if (startPage > 1) {
        pages.push(
          <Button key={1} variant="outline" size="sm" asChild>
            <Link href={createPageUrl(1)}>1</Link>
          </Button>
        );
        if (startPage > 2) {
          pages.push(
            <Button key="start-ellipsis" variant="ghost" size="sm" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
      }

      // Show current page range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={createPageUrl(i)}>{i}</Link>
          </Button>
        );
      }

      // Always show last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(
            <Button key="end-ellipsis" variant="ghost" size="sm" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        pages.push(
          <Button key={totalPages} variant="outline" size="sm" asChild>
            <Link href={createPageUrl(totalPages)}>{totalPages}</Link>
          </Button>
        );
      }
    }

    return pages;
  };

  return (
    <nav
      className="flex items-center justify-between px-2"
      aria-label="Pagination"
    >
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link
              href={createPageUrl(currentPage - 1)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </span>
          )}
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">{renderPageNumbers()}</div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link
              href={createPageUrl(currentPage + 1)}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
}
