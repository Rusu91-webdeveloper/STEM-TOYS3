"use client";

import { useCurrency } from "@/lib/currency";

interface CategorySales {
  categoryId: string;
  category: string;
  amount: number;
  percentage: number;
}

export function SalesByCategoryChart({
  categories,
}: {
  categories: CategorySales[];
}) {
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-4">
      {categories.map((category: CategorySales) => (
        <div key={category.categoryId} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full bg-primary`}
                style={{
                  opacity: 0.3 + (category.percentage / 100) * 0.7,
                }}
              ></div>
              <span className="text-sm font-medium">{category.category}</span>
            </div>
            <div className="text-sm">{formatPrice(category.amount)}</div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${category.percentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {category.percentage}%
          </div>
        </div>
      ))}
    </div>
  );
}
