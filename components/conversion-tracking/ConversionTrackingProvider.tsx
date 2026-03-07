"use client";

import { useEffect } from "react";

function extractConversionData(element: HTMLElement) {
  const conversion = element.getAttribute("data-conversion");
  const type = element.getAttribute("data-conversion-type");
  const category = element.getAttribute("data-conversion-category");
  const action = element.getAttribute("data-conversion-action");
  const elementId = element.getAttribute("data-conversion-element");
  const metadataStr = element.getAttribute("data-conversion-metadata");

  if (!conversion || !type || !category || !action) {
    return null;
  }

  let metadata = {};
  if (metadataStr) {
    try {
      metadata = JSON.parse(metadataStr);
    } catch {
      // Ignore malformed metadata to keep tracking non-blocking.
    }
  }

  return {
    type,
    category,
    action,
    elementId,
    metadata,
  };
}

export default function ConversionTrackingProvider() {
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let cleanup = () => {};

    const initConversionTracking = async () => {
      const tracking = await import("@/lib/utils/conversion-tracking");
      if (cancelled) return;

      const tracker = tracking.getConversionTracker();
      if (!tracker) return;

      const handleConversionClick = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const element = target.closest<HTMLElement>("[data-conversion]");
        if (!element) return;

        const conversionData = extractConversionData(element);
        if (!conversionData || conversionData.type !== "click") return;

        tracker.trackCTAClick(element, conversionData.action, {
          ...conversionData.metadata,
          elementType: element.tagName.toLowerCase(),
          elementText: element.textContent?.trim() || "",
          elementHref: (element as HTMLAnchorElement).href || "",
          elementId: element.id || "",
          elementClass: element.className || "",
        });
      };

      const handleConversionSubmit = (event: SubmitEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLFormElement)) return;

        const conversionElement =
          target.closest<HTMLElement>("[data-conversion]") || target;
        const conversionData = extractConversionData(conversionElement);
        if (!conversionData) return;

        tracker.trackFormSubmit(target, conversionData.action, {
          ...conversionData.metadata,
          formAction: target.action || "",
          formMethod: target.method || "GET",
          formId: target.id || "",
          formClass: target.className || "",
        });
      };

      document.addEventListener("click", handleConversionClick, {
        passive: true,
      });
      document.addEventListener("submit", handleConversionSubmit, true);

      cleanup = () => {
        document.removeEventListener("click", handleConversionClick);
        document.removeEventListener("submit", handleConversionSubmit, true);
      };
    };

    const scheduleInitialization = () => {
      const requestIdleCallbackRef = window.requestIdleCallback?.bind(window);

      if (requestIdleCallbackRef) {
        idleId = requestIdleCallbackRef(
          () => {
            void initConversionTracking();
          },
          { timeout: 4000 }
        );
        return;
      }

      timeoutId = window.setTimeout(() => {
        void initConversionTracking();
      }, 2000);
    };

    scheduleInitialization();

    return () => {
      cancelled = true;

      if (typeof idleId === "number" && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }

      if (typeof timeoutId === "number") {
        window.clearTimeout(timeoutId);
      }

      cleanup();
    };
  }, []);

  return null;
}
