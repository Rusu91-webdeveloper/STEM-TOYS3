"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SupplierOption {
  id: string;
  name: string;
  companyName?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface FilterState {
  q: string;
  status: string;
  supplierId: string;
  categoryId: string;
  priceMin: string;
  priceMax: string;
}

interface EnhancedProductFilterProps {
  suppliers: SupplierOption[];
  categories: CategoryOption[];
  onFiltersChange?: (filters: Partial<FilterState>) => void;
  totalResults?: number;
}

export function EnhancedProductFilter({
  suppliers,
  categories,
  onFiltersChange,
  totalResults,
}: EnhancedProductFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    supplierId: searchParams.get("supplierId") || "all",
    categoryId: searchParams.get("categoryId") || "all",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
  });

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "q") return value.trim() !== "";
      return value !== "all" && value !== "";
    }).length;
  }, [filters]);

  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      // Call the callback if provided (for client-side filtering)
      if (onFiltersChange) {
        onFiltersChange(updatedFilters);
      }

      // Update URL for server-side filtering
      const params = new URLSearchParams();

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      params.delete("page");

      const query = params.toString();
      router.push(query ? `?${query}` : "?", { scroll: false });
    },
    [filters, onFiltersChange, router]
  );

  const clearFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      q: "",
      status: "all",
      supplierId: "all",
      categoryId: "all",
      priceMin: "",
      priceMax: "",
    };
    setFilters(clearedFilters);

    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }

    router.push("?", { scroll: false });
  }, [onFiltersChange, router]);

  const removeFilter = useCallback(
    (filterKey: keyof FilterState) => {
      const newFilters = { ...filters };
      if (filterKey === "q") {
        newFilters.q = "";
      } else {
        (newFilters as any)[filterKey] = "all";
      }
      updateFilters(newFilters);
    },
    [filters, updateFilters]
  );

  const activeFilters = useMemo(() => {
    const result: Array<{
      key: keyof FilterState;
      label: string;
      value: string;
    }> = [];

    if (filters.q.trim()) {
      result.push({
        key: "q",
        label: `Search: "${filters.q}"`,
        value: filters.q,
      });
    }

    if (filters.status !== "all") {
      const statusLabels: Record<string, string> = {
        APPROVED: "Approved",
        PENDING_APPROVAL: "Pending",
        REJECTED: "Rejected",
        DRAFT: "Draft",
      };
      result.push({
        key: "status",
        label: `Status: ${statusLabels[filters.status] || filters.status}`,
        value: filters.status,
      });
    }

    if (filters.supplierId !== "all") {
      const supplier = suppliers.find(s => s.id === filters.supplierId);
      if (supplier) {
        result.push({
          key: "supplierId",
          label: `Supplier: ${supplier.companyName || supplier.name}`,
          value: filters.supplierId,
        });
      }
    }

    if (filters.categoryId !== "all") {
      const category = categories.find(c => c.id === filters.categoryId);
      if (category) {
        result.push({
          key: "categoryId",
          label: `Category: ${category.name}`,
          value: filters.categoryId,
        });
      }
    }

    if (filters.priceMin) {
      result.push({
        key: "priceMin",
        label: `Min Price: ${filters.priceMin} RON`,
        value: filters.priceMin,
      });
    }

    if (filters.priceMax) {
      result.push({
        key: "priceMax",
        label: `Max Price: ${filters.priceMax} RON`,
        value: filters.priceMax,
      });
    }

    return result;
  }, [filters, suppliers, categories]);

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-5 items-end">
        <div className="md:col-span-2 lg:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Product name, SKU, description..."
              value={filters.q}
              onChange={e => updateFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Status
          </label>
          <Select
            value={filters.status}
            onValueChange={value => updateFilters({ status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Supplier
          </label>
          <Select
            value={filters.supplierId}
            onValueChange={value => updateFilters({ supplierId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.companyName || supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Category
          </label>
          <Select
            value={filters.categoryId}
            onValueChange={value => updateFilters({ categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range Filters */}
      <div className="grid gap-3 md:grid-cols-3 items-end">
        <div className="md:col-span-2 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Min Price (RON)
            </label>
            <Input
              type="number"
              placeholder="0"
              value={filters.priceMin}
              onChange={e => updateFilters({ priceMin: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Max Price (RON)
            </label>
            <Input
              type="number"
              placeholder="999999"
              value={filters.priceMax}
              onChange={e => updateFilters({ priceMax: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear All ({activeFiltersCount})
            </Button>
          )}
          {totalResults !== undefined && (
            <div className="text-sm text-muted-foreground">
              {totalResults} products found
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map(filter => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
