"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon, STEMIcons } from "@/components/ui/icon-system";

import { blogGlassPanelClass } from "./blogTheme";

type TranslateFn = (key: string) => string;

interface BlogFilterBarProps {
  categories: Array<{
    id: string;
    name: string;
  }>;
  activeCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
  onResetFilters: () => void;
  t: TranslateFn;
}

const DEFAULT_CATEGORY = {
  id: "all",
  name: "All",
};

export function BlogFilterBar({
  categories,
  activeCategoryId,
  onCategorySelect,
  onResetFilters,
  t,
}: BlogFilterBarProps) {
  const isFiltered = activeCategoryId !== DEFAULT_CATEGORY.id;

  const getCategoryIcon = (name: string) => {
    const upper = name.trim().toUpperCase();
    switch (upper) {
      case "SCIENCE":
        return STEMIcons.Science;
      case "TECHNOLOGY":
        return STEMIcons.Technology;
      case "ENGINEERING":
        return STEMIcons.Engineering;
      case "MATHEMATICS":
        return STEMIcons.Math;
      default:
        return STEMIcons.Logic;
    }
  };

  const renderCategoryButton = (categoryId: string, label: string) => {
    const isActive = activeCategoryId === categoryId;

    return (
      <Button
        key={categoryId}
        variant={isActive ? "default" : "outline"}
        className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-all border ${isActive ? "border-indigo-500 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg shadow-indigo-500/30" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}
        onClick={() => onCategorySelect(categoryId)}
        aria-pressed={isActive}
      >
        <Icon icon={getCategoryIcon(label)} size="sm" decorative />
        <span className="whitespace-nowrap">{label}</span>
      </Button>
    );
  };

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <Container className="py-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={`${blogGlassPanelClass} flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-white transition-colors`}
                aria-label="Open filters"
              >
                <Icon icon={SlidersHorizontal} size="md" decorative />
                <span className="font-medium">
                  {t("Filters") || DEFAULT_CATEGORY.name}
                </span>
                {isFiltered && (
                  <span className="ml-2 flex items-center rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white">
                    {categories.find(cat => cat.id === activeCategoryId)?.name ??
                      t("Filtered") ??
                      "Filtered"}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full rounded-3xl border border-white/15 bg-slate-950/95 p-0 text-white">
              <DialogHeader className="space-y-1 bg-white/5 p-6">
                <DialogTitle className="text-lg font-semibold">
                  {t("Filter by Category") || "Filter by Category"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 p-6">
                <div className="flex flex-wrap gap-2">
                  {renderCategoryButton(DEFAULT_CATEGORY.id, t("All") || "All")}
                  {categories.map(category =>
                    renderCategoryButton(category.id, category.name)
                  )}
                </div>
                {isFiltered && (
                  <Button
                    variant="secondary"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={onResetFilters}
                  >
                    {t("Reset Filters") || "Reset Filters"}
                  </Button>
                )}
              </div>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="w-full rounded-none border-t border-white/10 text-white/80 hover:bg-white/10"
                >
                  {t("Close") || "Close"}
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </Container>
      </div>

      <nav className="hidden md:block sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur">
        <Container className="flex items-center gap-3 overflow-x-auto py-4">
          {renderCategoryButton(DEFAULT_CATEGORY.id, t("All") || "All")}
          {categories.length > 0 && (
            <span className="mx-2 text-sm text-white/30">|</span>
          )}
          {categories.map(category =>
            renderCategoryButton(category.id, category.name)
          )}
          {isFiltered && (
            <Button
              variant="secondary"
              className="ml-4 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onResetFilters}
            >
              {t("Reset Filters") || "Reset Filters"}
            </Button>
          )}
        </Container>
      </nav>
    </>
  );
}

