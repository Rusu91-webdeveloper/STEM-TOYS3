"use client";

import { useEffect } from "react";
import { conversionTracker } from "@/lib/utils/conversion-tracking";

export default function ConversionTrackingProvider() {
  useEffect(() => {
    // Initialize conversion tracking
    const initConversionTracking = () => {
      // Set up auto-tracking for elements with data-conversion attributes
      const setupConversionTracking = () => {
        const conversionElements =
          document.querySelectorAll("[data-conversion]");

        conversionElements.forEach(element => {
          // Remove existing listeners to prevent duplicates
          element.removeEventListener("click", handleConversionClick);
          element.removeEventListener("submit", handleConversionSubmit);

          // Add click listener for click-type conversions
          if (element.getAttribute("data-conversion-type") === "click") {
            element.addEventListener("click", handleConversionClick);
          }

          // Add submit listener for form submissions
          if (
            element.tagName === "FORM" ||
            element.getAttribute("data-conversion-type") === "form_submit"
          ) {
            element.addEventListener("submit", handleConversionSubmit);
          }
        });
      };

      const handleConversionClick = (event: Event) => {
        const element = event.currentTarget as HTMLElement;
        const conversionData = extractConversionData(element);

        if (conversionData) {
          conversionTracker.trackCTAClick(element, conversionData.action, {
            ...conversionData.metadata,
            elementType: element.tagName.toLowerCase(),
            elementText: element.textContent?.trim() || "",
            elementHref: (element as HTMLAnchorElement).href || "",
            elementId: element.id || "",
            elementClass: element.className || "",
          });
        }
      };

      const handleConversionSubmit = (event: Event) => {
        const element = event.currentTarget as HTMLFormElement;
        const conversionData = extractConversionData(element);

        if (conversionData) {
          conversionTracker.trackFormSubmit(element, conversionData.action, {
            ...conversionData.metadata,
            formAction: element.action || "",
            formMethod: element.method || "GET",
            formId: element.id || "",
            formClass: element.className || "",
          });
        }
      };

      const extractConversionData = (element: HTMLElement) => {
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
          } catch (error) {
            console.warn("Invalid conversion metadata JSON:", metadataStr);
          }
        }

        return {
          type,
          category,
          action,
          elementId,
          metadata,
        };
      };

      // Initial setup
      setupConversionTracking();

      // Set up time on page tracking
      let pageStartTime = Date.now();
      const trackTimeOnPage = () => {
        const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

        // Track at 30 seconds, 1 minute, 2 minutes, and 5 minutes
        if (timeOnPage === 30) {
          // Note: The ConversionTracker handles time tracking internally
          // We can add custom time tracking here if needed
        } else if (timeOnPage === 60) {
          // Track 1 minute milestone
        } else if (timeOnPage === 120) {
          // Track 2 minute milestone
        } else if (timeOnPage === 300) {
          // Track 5 minute milestone
        }
      };

      // Set up event listeners
      // Note: Scroll tracking is handled internally by ConversionTracker

      // Track time on page every second
      const timeInterval = setInterval(trackTimeOnPage, 1000);

      // Set up MutationObserver to handle dynamically added elements
      const observer = new MutationObserver(mutations => {
        let shouldSetup = false;

        mutations.forEach(mutation => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (
                  element.hasAttribute("data-conversion") ||
                  element.querySelector("[data-conversion]")
                ) {
                  shouldSetup = true;
                }
              }
            });
          }
        });

        if (shouldSetup) {
          setupConversionTracking();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Cleanup function
      return () => {
        clearInterval(timeInterval);
        observer.disconnect();

        // Remove all conversion event listeners
        const conversionElements =
          document.querySelectorAll("[data-conversion]");
        conversionElements.forEach(element => {
          element.removeEventListener("click", handleConversionClick);
          element.removeEventListener("submit", handleConversionSubmit);
        });
      };
    };

    // Initialize conversion tracking
    const cleanup = initConversionTracking();

    // Cleanup on unmount
    return cleanup;
  }, []);

  // This component doesn't render anything
  return null;
}
