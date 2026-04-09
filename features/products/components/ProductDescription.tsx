"use client";

import { ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  productBodyTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

interface ProductDescriptionProps {
  description: string;
  categoryName: string;
  t: (key: string, fallback?: string) => string;
  className?: string;
}

/**
 * Product description section component
 */
export function ProductDescription({
  description,
  categoryName,
  t,
  className,
}: ProductDescriptionProps) {
  const descRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  const measureOverflow = useCallback(() => {
    const el = descRef.current;
    if (!el || expanded) {
      return;
    }
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  useLayoutEffect(() => {
    measureOverflow();
  }, [description, measureOverflow]);

  useEffect(() => {
    setExpanded(false);
  }, [description]);

  useEffect(() => {
    const el = descRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => measureOverflow());
    ro.observe(el);
    return () => ro.disconnect();
  }, [description, measureOverflow]);

  const showToggle = isClamped || expanded;

  return (
    <div
      className={cn(
        productSubSectionCardClass,
        "space-y-2.5 sm:space-y-3.5",
        className
      )}
    >
      <h2 className={productTitleClass}>
        {t("productDescription", "Descriere produs")}
      </h2>
      <div className="space-y-3">
        <div className="relative">
          <p
            ref={descRef}
            id="product-detail-description"
            className={cn(productBodyTextClass, !expanded && "line-clamp-6")}
          >
            {description}
          </p>
          {!expanded && isClamped && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/85 to-transparent"
              aria-hidden
            />
          )}
        </div>
        {showToggle && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="w-full border-cyan-200/80 bg-gradient-to-b from-cyan-50/90 to-white text-cyan-900 shadow-sm transition hover:border-cyan-300 hover:from-cyan-100/90 hover:to-cyan-50/50 sm:w-auto sm:min-w-[11rem]"
            aria-expanded={expanded}
            aria-controls="product-detail-description"
          >
            {expanded
              ? t("showLess", "Show less")
              : t("readMore", "Read more")}
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                expanded && "rotate-180"
              )}
              aria-hidden
            />
          </Button>
        )}
      </div>
      <p className={`${productBodyTextClass} pt-1`}>
        {t("stemToyDesigned", "Jucărie STEM concepută pentru")} {categoryName}.{" "}
        {t("providesHandsOn", "Oferă experiențe practice de învățare.")}
      </p>
    </div>
  );
}
