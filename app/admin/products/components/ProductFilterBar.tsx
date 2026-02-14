"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  companyName?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFilterBarProps {
  suppliers: SupplierOption[];
  categories: CategoryOption[];
}

export function ProductFilterBar({
  suppliers,
  categories,
}: ProductFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<string>(
    searchParams.get("status") ?? "all"
  );
  const [supplierId, setSupplierId] = useState<string>(
    searchParams.get("supplierId") ?? "all"
  );
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("categoryId") ?? "all"
  );
  const [priceMin, setPriceMin] = useState<string>(
    searchParams.get("priceMin") ?? ""
  );
  const [priceMax, setPriceMax] = useState<string>(
    searchParams.get("priceMax") ?? ""
  );

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setStatus(searchParams.get("status") ?? "all");
    setSupplierId(searchParams.get("supplierId") ?? "all");
    setCategoryId(searchParams.get("categoryId") ?? "all");
    setPriceMin(searchParams.get("priceMin") ?? "");
    setPriceMax(searchParams.get("priceMax") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status && status !== "all") params.set("status", status);
    if (supplierId && supplierId !== "all")
      params.set("supplierId", supplierId);
    if (categoryId && categoryId !== "all")
      params.set("categoryId", categoryId);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  };

  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setSupplierId("all");
    setCategoryId("all");
    setPriceMin("");
    setPriceMax("");
    router.push("?");
  };

  const supplierOptions = useMemo(() => suppliers ?? [], [suppliers]);
  const categoryOptions = useMemo(() => categories ?? [], [categories]);

  return (
    <div className="grid gap-3 md:grid-cols-5 lg:grid-cols-6 items-end">
      <div className="md:col-span-2 lg:col-span-2">
        <label className="text-xs text-muted-foreground">Căutare</label>
        <Input
          placeholder="Nume, SKU, descriere"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Stare</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Toate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="APPROVED">Aprobate</SelectItem>
            <SelectItem value="PENDING_APPROVAL">În Așteptare</SelectItem>
            <SelectItem value="REJECTED">Respinse</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Furnizor</label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger>
            <SelectValue placeholder="Toți furnizorii" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toți</SelectItem>
            {supplierOptions.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Categorie</label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Toate categoriile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            {categoryOptions.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Preț min</label>
          <Input
            inputMode="decimal"
            placeholder="0"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Preț max</label>
          <Input
            inputMode="decimal"
            placeholder="9999"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters} className="w-full">
          Filtrează
        </Button>
        <Button variant="outline" onClick={resetFilters} className="w-full">
          Reset
        </Button>
      </div>
    </div>
  );
}
