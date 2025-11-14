"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  // Optional metadata parallel array for alt/tags per image
  metadata?: Array<{ alt?: string; tags?: string[] }>;
}

export function ProductImageGallery({
  images,
  alt,
  className,
  metadata,
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Navigate to previous image
  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Navigate to next image
  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className={cn("relative aspect-square w-full bg-muted", className)}>
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          No image available
        </div>
      </div>
    );
  }

  const getAlt = (index: number) => {
    const metaAlt = metadata?.[index]?.alt;
    if (metaAlt && metaAlt.trim().length > 0) return metaAlt;
    return `${alt} - Image ${index + 1}`;
  };

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
        <Image
          src={images[currentImageIndex] || "/placeholder-product.png"}
          alt={getAlt(currentImageIndex)}
          fill
          priority={currentImageIndex === 0}
          className="object-cover transition-opacity"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Navigation arrows - visible on all screen sizes but smaller on mobile */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-white/15 bg-slate-900/70 backdrop-blur sm:left-2 sm:h-9 sm:w-9"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-white/15 bg-slate-900/70 backdrop-blur sm:right-2 sm:h-9 sm:w-9"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-1 right-1 rounded-full border border-white/10 bg-slate-950/70 px-1.5 py-0.5 text-xs text-slate-100 backdrop-blur sm:bottom-2 sm:right-2 sm:px-2 sm:py-1">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                "relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 transition-all duration-200 sm:h-16 sm:w-16",
                currentImageIndex === index &&
                  "scale-105 border-emerald-400/60 ring-2 ring-emerald-400/50"
              )}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={getAlt(index)}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 48px, 64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
