"use client";

import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function CartSkeleton() {
  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-sm p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full mt-6" />
      </div>
    </div>
  );
}
