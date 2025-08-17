import React from "react";

export function ProductsPageSkeleton() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero skeleton */}
      <div className="w-full h-[20vh] min-h-[180px] bg-gray-200 rounded-xl mb-6 animate-pulse" />

      {/* Category filters skeleton */}
      <div className="flex justify-center gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-24 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Content layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full bg-gray-200 rounded mb-3 animate-pulse"
              />
            ))}
            <div className="h-8 w-full bg-gray-200 rounded mt-5 animate-pulse" />
          </div>
        </div>

        {/* Products grid skeleton */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-200 rounded mb-3" />
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
