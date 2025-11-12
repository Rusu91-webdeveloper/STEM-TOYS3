"use client";

import {
  CheckSquare,
  Square,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Bookmark,
  X,
  Plus,
} from "lucide-react";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Dropdown menu imports removed (no bulk quantity control)
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  glassCardClass,
  glassPanelClass,
} from "@/features/home/components/homeTheme";

import { useShoppingCart } from "../context/CartContext";

interface BulkCartOperationsProps {
  className?: string;
}

export function BulkCartOperations({ className }: BulkCartOperationsProps) {
  const {
    items,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    removeSelectedItems,
    updateSelectedItemsQuantity,
    moveSelectedToSavedForLater,
    savedForLaterItems,
    moveFromSavedForLater,
    removeSavedForLaterItem,
    clearSavedForLater,
  } = useShoppingCart();

  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [showSavedForLater, setShowSavedForLater] = useState(false);

  const selectedCount = selectedItems.size;
  const hasSelection = selectedCount > 0;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const hasItems = items.length > 0;
  const hasSavedItems = savedForLaterItems.length > 0;

  // Calculate selected items total
  const selectedTotal = items
    .filter(item => selectedItems.has(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllItems();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection Toolbar */}
      {hasItems && (
        <div
          className={`${glassPanelClass} flex items-center justify-between border-white/10 p-3 text-slate-100`}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="p-1 text-slate-300 hover:bg-white/10 hover:text-slate-100"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-sky-300" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>

            <span className="text-sm font-medium text-slate-100">
              {hasSelection ? `${selectedCount} selected` : "Select items"}
            </span>

            {hasSelection && (
              <Badge
                variant="secondary"
                className="border border-white/20 bg-white/10 text-xs text-slate-100"
              >
                {formatPrice(selectedTotal)}
              </Badge>
            )}
          </div>

          {hasSelection && (
            <div className="flex items-center gap-2">
              {/* Clear Selection */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="p-1 text-slate-300 hover:bg-white/10 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Saved for Later Section */}
      {hasSavedItems && (
        <Card
          className={cn(
            glassCardClass,
            "border-white/10 bg-slate-900/60 text-slate-100 shadow-lg shadow-black/30"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                  <Bookmark className="h-4 w-4 text-amber-300" />
                  Saved for Later
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="border border-white/20 bg-white/10 text-xs text-slate-100"
                >
                  {savedForLaterItems.length} items
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavedForLater(!showSavedForLater)}
                  className="text-slate-300 hover:bg-white/10 hover:text-slate-100"
                >
                  {showSavedForLater ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {!showSavedForLater && (
              <CardDescription className="text-xs text-slate-300">
                Click to view and manage saved items
              </CardDescription>
            )}
          </CardHeader>

          {showSavedForLater && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {savedForLaterItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    {/* Item Image */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-slate-100">
                        {item.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-xs text-slate-400">
                          Qty: {item.quantity}
                        </span>
                        <Separator className="h-3 bg-white/20" orientation="vertical" />
                        <span className="font-medium">
                          {formatPrice(item.price)}
                        </span>
                        {item.isBook && (
                          <Badge
                            variant="outline"
                            className="border border-sky-400/40 bg-sky-500/10 text-xs text-sky-100"
                          >
                            Digital
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFromSavedForLater(item.id)}
                        className="p-1 text-sky-300 hover:bg-sky-500/15 hover:text-sky-100"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSavedForLaterItem(item.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/15 hover:text-rose-200"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Saved for Later Actions */}
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      savedForLaterItems.forEach(item =>
                        moveFromSavedForLater(item.id)
                      );
                    }}
                    className="border-white/20 bg-white/5 text-sky-200 hover:border-white/30 hover:bg-white/10"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Move All to Cart
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSavedForLater}
                    className="border-white/20 bg-white/5 text-rose-300 hover:border-white/30 hover:bg-white/10"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Actions Bar - shown when no selection */}
      {hasItems && !hasSelection && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 p-2 text-xs text-sky-100">
          <CheckSquare className="h-3 w-3" />
          <span>Tip: Select items to clear selection</span>
        </div>
      )}
    </div>
  );
}
