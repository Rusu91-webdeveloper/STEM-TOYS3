"use client";

import {
  CheckSquare,
  Square,
  Trash2,
  Heart,
  RotateCcw,
  Edit3,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="p-1"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </Button>

            <span className="text-sm font-medium">
              {hasSelection ? `${selectedCount} selected` : "Select items"}
            </span>

            {hasSelection && (
              <Badge variant="secondary" className="text-xs">
                {formatPrice(selectedTotal)}
              </Badge>
            )}
          </div>

          {hasSelection && (
            <div className="flex items-center gap-2">
              {/* Quantity Update Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Quantity
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => updateSelectedItemsQuantity(1)}
                  >
                    Set to 1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateSelectedItemsQuantity(2)}
                  >
                    Set to 2
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateSelectedItemsQuantity(3)}
                  >
                    Set to 3
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateSelectedItemsQuantity(5)}
                  >
                    Set to 5
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => updateSelectedItemsQuantity(0)}
                  >
                    Remove All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Save for Later */}
              <Button
                variant="outline"
                size="sm"
                onClick={moveSelectedToSavedForLater}
              >
                <Heart className="w-3 h-3 mr-1" />
                Save for Later
              </Button>

              {/* Remove Selected */}
              <Button
                variant="outline"
                size="sm"
                onClick={removeSelectedItems}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>

              {/* Clear Selection */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Saved for Later Section */}
      {hasSavedItems && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-orange-600" />
                  Saved for Later
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {savedForLaterItems.length} items
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavedForLater(!showSavedForLater)}
                >
                  {showSavedForLater ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {!showSavedForLater && (
              <CardDescription className="text-xs">
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
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* Item Image */}
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded border">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="text-sm font-medium">
                          {formatPrice(item.price)}
                        </span>
                        {item.isBook && (
                          <Badge variant="outline" className="text-xs">
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
                        className="p-1 text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSavedForLaterItem(item.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Saved for Later Actions */}
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      savedForLaterItems.forEach(item =>
                        moveFromSavedForLater(item.id)
                      );
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Move All to Cart
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSavedForLater}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
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
        <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
          <CheckSquare className="w-3 h-3" />
          <span>
            Tip: Select items to access bulk operations like quantity updates
            and save for later
          </span>
        </div>
      )}
    </div>
  );
}
