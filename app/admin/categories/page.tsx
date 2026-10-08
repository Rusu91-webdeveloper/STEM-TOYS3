"use client";

import { Plus, RefreshCw, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Reject storefront groups or incomplete data instead of inventing statuses/counts.
const categoryListSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    isActive: z.boolean(),
    productCount: z.number().int().nonnegative(),
  })
);
type Category = z.infer<typeof categoryListSchema>[number];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = categoryListSchema.parse(await response.json());
        if (!controller.signal.aborted) setCategories(data);
      } catch {
        if (!controller.signal.aborted) {
          setError("Lista categoriilor nu a putut fi încărcată. Reîncearcă.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchCategories();
    return () => controller.abort();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Categorii</h1>
          <p className="mt-2 text-muted-foreground">
            Organizarea catalogului și numărul de produse asociate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => setRefresh(value => value + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reîncarcă categoriile
          </Button>
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Adaugă categorie
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categoriile din catalog</CardTitle>
          <CardDescription>
            Starea indică dacă o categorie este activă. Numărul include toate
            produsele asociate direct, inclusiv produsele nepublicate sau
            inactive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" role="status">
              Se încarcă categoriile…
            </div>
          ) : error ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-6"
              role="alert"
            >
              <p>{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRefresh(value => value + 1)}
              >
                Reîncearcă
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-4">Nu există categorii în catalog.</p>
              <Button asChild>
                <Link href="/admin/categories/new">
                  Creează prima categorie
                </Link>
              </Button>
            </div>
          ) : (
            <Table aria-label="Categoriile din catalog">
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead className="hidden md:table-cell">Slug</TableHead>
                  <TableHead>Stare</TableHead>
                  <TableHead className="text-right">Produse asociate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {category.slug}
                    </TableCell>
                    <TableCell>
                      {category.isActive ? (
                        <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                          Activă
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          <EyeOff className="h-3 w-3 mr-1" aria-hidden="true" />
                          Inactivă
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {category.productCount.toLocaleString("ro-RO")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
