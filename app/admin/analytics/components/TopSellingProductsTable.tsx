"use client";

import { useCurrency } from "@/lib/currency";

interface TopSellingProduct {
  name: string;
  price: number;
  sold: number;
  revenue: number;
}

export function TopSellingProductsTable({
  products,
}: {
  products: TopSellingProduct[];
}) {
  const { formatPrice } = useCurrency();

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b text-xs font-medium text-muted-foreground">
          <th className="pb-3 pt-1 text-left">Product</th>
          <th className="pb-3 pt-1 text-left">Price</th>
          <th className="pb-3 pt-1 text-left">Units Sold</th>
          <th className="pb-3 pt-1 text-left">Revenue</th>
          <th className="pb-3 pt-1 text-left">Performance</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product: TopSellingProduct, index: number) => (
          <tr key={product.name} className="border-b last:border-0">
            <td className="py-3 text-sm font-medium">{product.name}</td>
            <td className="py-3 text-sm">{formatPrice(product.price)}</td>
            <td className="py-3 text-sm">{product.sold}</td>
            <td className="py-3 text-sm">{formatPrice(product.revenue)}</td>
            <td className="py-3">
              <div className="flex w-32 items-center gap-2">
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${100 - index * 15}%` }}
                  ></div>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
