"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => {
        if (key === "q") return value.trim() !== "";
        return value !== "all" && value !== "";
      }).length,
    [filters]
  );

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
        label: `Căutare: "${filters.q}"`,
        value: filters.q,
      });
    }

    if (filters.status !== "all") {
      const statusLabels: Record<string, string> = {
        APPROVED: "Aprobat",
        IN_PENDING: "În așteptare",
        REJECTED: "Respins",
        PUBLISHED: "Publicat",
        DENIED: "Refuzat",
      };
      result.push({
        key: "status",
        label: `Stare: ${statusLabels[filters.status] || filters.status}`,
        value: filters.status,
      });
    }

    if (filters.supplierId !== "all") {
      const supplier = suppliers.find(s => s.id === filters.supplierId);
      if (supplier) {
        result.push({
          key: "supplierId",
          label: `Furnizor: ${supplier.companyName || supplier.name}`,
          value: filters.supplierId,
        });
      }
    }

    if (filters.categoryId !== "all") {
      const category = categories.find(c => c.id === filters.categoryId);
      if (category) {
        result.push({
          key: "categoryId",
          label: `Categorie: ${category.name}`,
          value: filters.categoryId,
        });
      }
    }

    if (filters.priceMin) {
      result.push({
        key: "priceMin",
        label: `Preț minim: ${filters.priceMin} RON`,
        value: filters.priceMin,
      });
    }

    if (filters.priceMax) {
      result.push({
        key: "priceMax",
        label: `Preț maxim: ${filters.priceMax} RON`,
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
          <label
            htmlFor="admin-product-search"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Caută
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="admin-product-search"
              placeholder="Nume produs, SKU, descriere..."
              value={filters.q}
              onChange={e => updateFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-product-status"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Stare
          </label>
          <Select
            value={filters.status}
            onValueChange={value => updateFilters({ status: value })}
          >
            <SelectTrigger id="admin-product-status">
              <SelectValue placeholder="Toate stările" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate stările</SelectItem>
              <SelectItem value="APPROVED">Aprobat</SelectItem>
              <SelectItem value="IN_PENDING">În așteptare</SelectItem>
              <SelectItem value="REJECTED">Respins</SelectItem>
              <SelectItem value="PUBLISHED">Publicat</SelectItem>
              <SelectItem value="DENIED">Refuzat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="admin-product-supplier"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Furnizor
          </label>
          <Select
            value={filters.supplierId}
            onValueChange={value => updateFilters({ supplierId: value })}
          >
            <SelectTrigger id="admin-product-supplier">
              <SelectValue placeholder="Toți furnizorii" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți furnizorii</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.companyName || supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="admin-product-category"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Categorie
          </label>
          <Select
            value={filters.categoryId}
            onValueChange={value => updateFilters({ categoryId: value })}
          >
            <SelectTrigger id="admin-product-category">
              <SelectValue placeholder="Toate categoriile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate categoriile</SelectItem>
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
            <label
              htmlFor="admin-product-min"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Preț minim (RON)
            </label>
            <Input
              id="admin-product-min"
              type="number"
              placeholder="0"
              value={filters.priceMin}
              onChange={e => updateFilters({ priceMin: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label
              htmlFor="admin-product-max"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Preț maxim (RON)
            </label>
            <Input
              id="admin-product-max"
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
              Resetează ({activeFiltersCount})
            </Button>
          )}
          {totalResults !== undefined && (
            <div className="text-sm text-muted-foreground">
              {totalResults} produse găsite
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            Filtre aplicate:
          </span>
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
                aria-label={`Elimină filtrul ${filter.label}`}
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
