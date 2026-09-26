"use client";

import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function CartProductImage({ src, name, className, sizes = "80px" }: {
  src?: string;
  name: string;
  className: string;
  sizes?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className={`relative shrink-0 overflow-hidden bg-white ${className}`}>
      {src && failedSource !== src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          className="object-contain p-1"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <div role="img" aria-label={name} className="flex h-full w-full items-center justify-center text-slate-300">
          <ShoppingBag aria-hidden className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}
