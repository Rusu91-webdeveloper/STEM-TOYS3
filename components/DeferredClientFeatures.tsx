"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const AnalyticsWrapper = dynamic(
  () => import("@/components/analytics/AnalyticsWrapper"),
  { ssr: false }
);
const PerformanceMonitor = dynamic(
  () => import("@/components/analytics/PerformanceMonitor"),
  { ssr: false }
);
const ConversionTrackingProvider = dynamic(
  () => import("@/components/conversion-tracking/ConversionTrackingProvider"),
  { ssr: false }
);
const PromotionalPopup = dynamic(
  () => import("@/components/PromotionalPopup"),
  {
    ssr: false,
  }
);
const ServiceWorkerRegistration = dynamic(
  () => import("@/components/ServiceWorkerRegistration"),
  { ssr: false }
);

function canShowPopupOnDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isPhoneViewport = window.matchMedia("(max-width: 767px)").matches;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean };
    }
  ).connection;

  return !isPhoneViewport && !connection?.saveData;
}

export default function DeferredClientFeatures() {
  const pathname = usePathname();
  const [enableCoreFeatures, setEnableCoreFeatures] = useState(false);
  const [enablePromotionalPopup, setEnablePromotionalPopup] = useState(false);

  useEffect(() => {
    let loadTimer: number | undefined;
    let popupTimer: number | undefined;
    let idleId: number | undefined;
    let cancelled = false;

    const activateCoreFeatures = () => {
      if (cancelled) return;

      setEnableCoreFeatures(true);

      popupTimer = window.setTimeout(() => {
        if (!cancelled && pathname !== "/" && canShowPopupOnDevice()) {
          setEnablePromotionalPopup(true);
        }
      }, 6000);
    };

    const scheduleCoreFeatures = () => {
      const requestIdleCallbackRef = window.requestIdleCallback?.bind(window);

      if (requestIdleCallbackRef) {
        idleId = requestIdleCallbackRef(
          () => {
            activateCoreFeatures();
          },
          { timeout: 4000 }
        );
        return;
      }

      loadTimer = window.setTimeout(activateCoreFeatures, 2500);
    };

    if (document.readyState === "complete") {
      scheduleCoreFeatures();
    } else {
      window.addEventListener("load", scheduleCoreFeatures, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleCoreFeatures);

      if (typeof idleId === "number" && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }

      if (typeof loadTimer === "number") {
        window.clearTimeout(loadTimer);
      }

      if (typeof popupTimer === "number") {
        window.clearTimeout(popupTimer);
      }
    };
  }, [pathname]);

  return (
    <>
      {enableCoreFeatures ? (
        <>
          <AnalyticsWrapper />
          <PerformanceMonitor />
          <ServiceWorkerRegistration />
          <ConversionTrackingProvider />
        </>
      ) : null}
      {enablePromotionalPopup && pathname !== "/" ? <PromotionalPopup /> : null}
    </>
  );
}
