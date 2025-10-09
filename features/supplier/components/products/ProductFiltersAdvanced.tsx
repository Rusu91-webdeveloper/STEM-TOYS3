"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProductFilters {
  lowStock?: boolean;
  lowStockThreshold?: number;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
}

interface ProductFiltersAdvancedProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

export function ProductFiltersAdvanced({
  filters,
  onFiltersChange,
}: ProductFiltersAdvancedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ProductFilters];
    return value !== undefined && value !== "" && value !== false;
  }).length;

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Advanced Filters
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Advanced Filters
            </>
          )}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {isExpanded && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Low Stock Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Alert</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!filters.lowStock}
                    onChange={e =>
                      onFiltersChange({
                        ...filters,
                        lowStock: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-muted-foreground">
                    Show low stock items
                  </span>
                </div>
                {filters.lowStock && (
                  <Input
                    type="number"
                    placeholder="Threshold"
                    value={filters.lowStockThreshold ?? 5}
                    onChange={e =>
                      onFiltersChange({
                        ...filters,
                        lowStockThreshold: Number(e.target.value),
                      })
                    }
                    className="mt-2"
                    min={0}
                  />
                )}
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range (RON)</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice ?? ""}
                    onChange={e =>
                      onFiltersChange({
                        ...filters,
                        minPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    min={0}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice ?? ""}
                    onChange={e =>
                      onFiltersChange({
                        ...filters,
                        maxPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  placeholder="Filter by tags..."
                  value={filters.tags || ""}
                  onChange={e =>
                    onFiltersChange({
                      ...filters,
                      tags: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated tags
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
