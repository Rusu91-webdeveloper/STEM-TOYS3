"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

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
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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
  const openFullscreen = () => setIsFullscreenOpen(true);
  const closeFullscreen = () => setIsFullscreenOpen(false);

  useEffect(() => {
    if (!isFullscreenOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFullscreen();
      } else if (images.length > 1 && event.key === "ArrowLeft") {
        handlePrevImage();
      } else if (images.length > 1 && event.key === "ArrowRight") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [images.length, isFullscreenOpen]);

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
        <button
          type="button"
          onClick={openFullscreen}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="Open image in full screen"
        >
          <span className="sr-only">Open image in full screen</span>
        </button>
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
              className="absolute left-1 top-1/2 z-20 h-7 w-7 -translate-y-1/2 rounded-full border border-white/15 bg-slate-900/70 backdrop-blur sm:left-2 sm:h-9 sm:w-9"
              onClick={event => {
                event.stopPropagation();
                handlePrevImage();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 z-20 h-7 w-7 -translate-y-1/2 rounded-full border border-white/15 bg-slate-900/70 backdrop-blur sm:right-2 sm:h-9 sm:w-9"
              onClick={event => {
                event.stopPropagation();
                handleNextImage();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </>
        )}

        <div className="absolute bottom-1 left-1 z-20 rounded-full border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[10px] font-medium text-slate-100 backdrop-blur sm:hidden">
          Tap to zoom
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-1 right-1 z-20 rounded-full border border-white/10 bg-slate-950/70 px-1.5 py-0.5 text-xs text-slate-100 backdrop-blur sm:bottom-2 sm:right-2 sm:px-2 sm:py-1">
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
              type="button"
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

      {isFullscreenOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image full screen viewer"
          className="fixed inset-0 z-[90] bg-black/95 p-3 sm:p-6"
          onClick={closeFullscreen}
        >
          <div
            className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center"
            onClick={event => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 z-20 h-10 w-10 rounded-full border border-white/25 bg-black/60 text-white hover:bg-black/80 sm:right-2 sm:top-2"
              onClick={closeFullscreen}
              aria-label="Close full screen image viewer"
            >
              <X className="h-5 w-5" />
            </Button>

            {images.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/60 text-white hover:bg-black/80 sm:left-2"
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            <div className="relative h-full w-full">
              <Image
                src={images[currentImageIndex] || "/placeholder-product.png"}
                alt={getAlt(currentImageIndex)}
                fill
                priority
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {images.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/60 text-white hover:bg-black/80 sm:right-2"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}

            <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/25 bg-black/70 px-3 py-1 text-xs font-medium text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
