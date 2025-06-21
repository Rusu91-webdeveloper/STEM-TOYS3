import { LoadingGrid } from "@/components/ui/loading";

export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4"></div>
        <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Product grid with loading skeletons */}
      <LoadingGrid
        count={12}
        columns={4}
      />
    </div>
  );
}
