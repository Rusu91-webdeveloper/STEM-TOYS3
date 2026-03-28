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
  const [failedImageIndexes, setFailedImageIndexes] = useState<number[]>([]);

  const visibleImages = images
    .map((image, index) => ({
      image,
      originalIndex: index,
      meta: metadata?.[index],
    }))
    .filter(entry => !failedImageIndexes.includes(entry.originalIndex));

  const isRemoteImage = (src: string) =>
    typeof src === "string" && /^https?:\/\//i.test(src);

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev =>
      prev === 0 ? visibleImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev =>
      prev === visibleImages.length - 1 ? 0 : prev + 1
    );
  };

  const openFullscreen = () => setIsFullscreenOpen(true);
  const closeFullscreen = () => setIsFullscreenOpen(false);

  const handleImageError = (originalIndex: number) => {
    setFailedImageIndexes(prev =>
      prev.includes(originalIndex) ? prev : [...prev, originalIndex]
    );
  };

  useEffect(() => {
    if (!isFullscreenOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFullscreen();
      } else if (visibleImages.length > 1 && event.key === "ArrowLeft") {
        handlePrevImage();
      } else if (visibleImages.length > 1 && event.key === "ArrowRight") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreenOpen, visibleImages.length]);

  useEffect(() => {
    setFailedImageIndexes([]);
    setCurrentImageIndex(0);
  }, [images, metadata]);

  useEffect(() => {
    if (currentImageIndex >= visibleImages.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, visibleImages.length]);

  if (!visibleImages || visibleImages.length === 0) {
    return (
      <div className={cn("relative aspect-square w-full bg-muted", className)}>
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          No image available
        </div>
      </div>
    );
  }

  const getAlt = (index: number) => {
    const metaAlt = visibleImages[index]?.meta?.alt;
    if (metaAlt && metaAlt.trim().length > 0) return metaAlt;
    return `${alt} - Image ${index + 1}`;
  };

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
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
          src={visibleImages[currentImageIndex]?.image || "/placeholder-product.png"}
          alt={getAlt(currentImageIndex)}
          fill
          priority={currentImageIndex === 0}
          unoptimized={isRemoteImage(visibleImages[currentImageIndex]?.image || "")}
          onError={() =>
            handleImageError(
              visibleImages[currentImageIndex]?.originalIndex ?? currentImageIndex
            )
          }
          className="object-contain bg-white p-2 transition-opacity sm:p-3"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {visibleImages.length > 1 && (
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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={event => {
            event.stopPropagation();
            openFullscreen();
          }}
          className="absolute bottom-1 left-1 z-20 h-7 rounded-full border border-white/15 bg-slate-950/70 px-2.5 text-[10px] font-semibold text-slate-100 backdrop-blur hover:bg-slate-900/80 sm:hidden"
        >
          View full
        </Button>

        {visibleImages.length > 1 && (
          <div className="absolute bottom-1 right-1 z-20 rounded-full border border-white/10 bg-slate-950/70 px-1.5 py-0.5 text-xs text-slate-100 backdrop-blur sm:bottom-2 sm:right-2 sm:px-2 sm:py-1">
            {currentImageIndex + 1} / {visibleImages.length}
          </div>
        )}
      </div>

      {visibleImages.length > 1 && (
        <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-1">
          {visibleImages.map(({ image, originalIndex }, index) => (
            <button
              key={originalIndex}
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
                unoptimized={isRemoteImage(image)}
                onError={() => handleImageError(originalIndex)}
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
          className="fixed inset-0 z-[90] bg-black/95"
          onClick={closeFullscreen}
        >
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              closeFullscreen();
            }}
            aria-label="Close full screen image viewer"
            className="absolute right-3 top-3 z-[100] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur border border-white/30 hover:bg-white/30 transition-colors sm:right-5 sm:top-5 sm:h-12 sm:w-12"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center pb-24 sm:pb-16 sm:px-16"
            onClick={event => event.stopPropagation()}
          >
            {visibleImages.length > 1 && (
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
                src={visibleImages[currentImageIndex]?.image || "/placeholder-product.png"}
                alt={getAlt(currentImageIndex)}
                fill
                priority
                unoptimized={isRemoteImage(visibleImages[currentImageIndex]?.image || "")}
                onError={() =>
                  handleImageError(
                    visibleImages[currentImageIndex]?.originalIndex ??
                      currentImageIndex
                  )
                }
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {visibleImages.length > 1 && (
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

            {visibleImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/25 bg-black/70 px-3 py-1 text-xs font-medium text-white">
                {currentImageIndex + 1} / {visibleImages.length}
              </div>
            )}
          </div>

          <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center sm:bottom-8">
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                closeFullscreen();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-xl hover:bg-slate-100 transition-colors active:scale-95"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
