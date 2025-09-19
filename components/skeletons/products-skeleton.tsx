import React from "react";

export function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton - exact dimensions */}
      <div
        className="w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse"
        style={{ height: "40vh", minHeight: "320px" }}
      />

      {/* Category navigation skeleton */}
      <div className="container mx-auto px-3 sm:px-4 py-6">
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-28 bg-gray-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>

        {/* Age filters skeleton (hidden on mobile) */}
        <div className="hidden md:block mb-8">
          <div className="flex gap-3 justify-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-20 bg-gray-200 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Benefits section skeleton */}
        <div className="mb-8 p-6 bg-gray-100 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl mx-auto mb-3 animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Main content layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar skeleton - exact dimensions */}
          <div className="w-full lg:w-80 shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl sticky top-24">
              <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse" />

              {/* Categories section */}
              <div className="mb-6">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3 animate-pulse" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-6 bg-gray-200 rounded ml-auto animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Price range section */}
              <div className="mb-6">
                <div className="h-4 w-16 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="h-6 w-full bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Other filters */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-6">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Products grid skeleton */}
          <div className="flex-1">
            {/* Header section */}
            <div className="mb-6 px-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-2xl animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded-2xl animate-pulse" />
            </div>

            {/* Grid container with exact spacing */}
            <div className="rounded-2xl bg-gradient-to-b from-gray-50/30 to-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl animate-pulse"
                    style={{ aspectRatio: "3/4" }} // Match ProductCard aspect ratio
                  >
                    {/* Image placeholder */}
                    <div className="h-48 bg-gray-200 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-300 to-gray-200" />
                    </div>

                    {/* Content placeholder */}
                    <div className="p-4">
                      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-full bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-5/6 bg-gray-200 rounded mb-4 animate-pulse" />

                      {/* Tags */}
                      <div className="flex gap-2 mb-4">
                        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
                      </div>

                      {/* Price and button */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-24 bg-gray-200 rounded-2xl animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
