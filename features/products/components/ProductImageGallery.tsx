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
}

export function ProductImageGallery({
  images,
  alt,
  className,
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

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg sm:rounded-xl border">
        <Image
          src={images[currentImageIndex] || "/placeholder-product.png"}
          alt={`${alt} - Image ${currentImageIndex + 1}`}
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
              className="absolute left-1 sm:left-2 top-1/2 h-6 w-6 sm:h-8 sm:w-8 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 sm:right-2 top-1/2 h-6 w-6 sm:h-8 sm:w-8 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 rounded-full bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs backdrop-blur-sm">
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
                "relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-md border transition-all duration-200",
                currentImageIndex === index && "ring-2 ring-primary scale-105"
              )}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
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
