/**
 * Touch Interaction Optimization System
 * Optimized for mobile devices with proper touch targets and gestures
 */

import { useEffect, useRef, useState } from "react";

// Touch target size standards
export const touchStandards = {
  // iOS minimum touch target size
  ios: {
    minSize: 44,
    recommendedSize: 48,
    minSpacing: 8,
  },
  // Android minimum touch target size
  android: {
    minSize: 48,
    recommendedSize: 52,
    minSpacing: 8,
  },
  // Universal safe size
  universal: {
    minSize: 48,
    recommendedSize: 56,
    minSpacing: 12,
  },
} as const;

// Touch-optimized CSS classes
export const touchClasses = {
  // Button touch targets
  "touch-btn-sm":
    "min-h-[44px] min-w-[44px] p-2 active:scale-95 transition-transform",
  "touch-btn-md":
    "min-h-[48px] min-w-[48px] p-3 active:scale-95 transition-transform",
  "touch-btn-lg":
    "min-h-[56px] min-w-[56px] p-4 active:scale-95 transition-transform",

  // Interactive elements
  "touch-interactive":
    "min-h-[44px] p-2 active:bg-gray-100 transition-colors select-none",
  "touch-card": "active:scale-98 transition-transform cursor-pointer",
  "touch-list-item": "min-h-[56px] p-4 active:bg-gray-50 transition-colors",

  // Touch feedback
  "touch-feedback":
    "active:scale-95 active:bg-opacity-80 transition-all duration-150",
  "touch-ripple":
    "relative overflow-hidden active:after:animate-ping active:after:absolute active:after:inset-0 active:after:bg-white active:after:opacity-30 active:after:rounded-full",

  // Scroll areas
  "touch-scroll":
    "overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
  "touch-scroll-x":
    "overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",

  // Drag and drop
  "touch-draggable": "cursor-grab active:cursor-grabbing select-none",

  // Spacing for touch
  "touch-spacing": "space-y-2 md:space-y-1",
  "touch-gap": "gap-3 md:gap-2",
} as const;

// Touch gesture types
export type TouchGesture =
  | "tap"
  | "double-tap"
  | "long-press"
  | "swipe"
  | "pinch"
  | "pan";

interface TouchGestureOptions {
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onSwipe?: (
    direction: "left" | "right" | "up" | "down",
    event: TouchEvent
  ) => void;
  onPinch?: (scale: number, event: TouchEvent) => void;
  onPan?: (deltaX: number, deltaY: number, event: TouchEvent) => void;
  longPressDelay?: number;
  swipeThreshold?: number;
  doubleTapDelay?: number;
}

// Touch gesture hook
export function useTouchGestures(options: TouchGestureOptions = {}) {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPinch,
    onPan,
    longPressDelay = 500,
    swipeThreshold = 50,
    doubleTapDelay = 300,
  } = options;

  const touchRef = useRef<HTMLElement | null>(null);
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTap: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    initialDistance: 0,
  });

  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const now = Date.now();

      setTouchState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: now,
        initialDistance:
          e.touches.length === 2 ? getDistance(e.touches[0], e.touches[1]) : 0,
      }));

      // Long press detection
      if (onLongPress) {
        const timer = setTimeout(() => {
          onLongPress(e);
        }, longPressDelay);

        setTouchState(prev => ({ ...prev, longPressTimer: timer }));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling during gestures

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;

      // Clear long press if moved too much
      if (
        touchState.longPressTimer &&
        (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)
      ) {
        clearTimeout(touchState.longPressTimer);
        setTouchState(prev => ({ ...prev, longPressTimer: null }));
      }

      // Pan gesture
      if (onPan) {
        onPan(deltaX, deltaY, e);
      }

      // Pinch gesture
      if (onPinch && e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / touchState.initialDistance;
        onPinch(scale, e);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      const deltaTime = Date.now() - touchState.startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Clear long press timer
      if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
      }

      // Swipe detection
      if (onSwipe && distance > swipeThreshold && deltaTime < 300) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          onSwipe(deltaX > 0 ? "right" : "left", e);
        } else {
          onSwipe(deltaY > 0 ? "down" : "up", e);
        }
        return;
      }

      // Tap detection (short distance and time)
      if (distance < 10 && deltaTime < 300) {
        const now = Date.now();

        // Double tap detection
        if (onDoubleTap && now - touchState.lastTap < doubleTapDelay) {
          onDoubleTap(e);
        } else if (onTap) {
          onTap(e);
        }

        setTouchState(prev => ({ ...prev, lastTap: now }));
      }
    };

    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPinch,
    onPan,
    longPressDelay,
    swipeThreshold,
    doubleTapDelay,
    touchState,
  ]);

  return touchRef;
}

// Helper function to calculate distance between two touch points
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Device detection utilities
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent);
}

export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent;
  return /Android/.test(userAgent);
}

// Touch accessibility utilities
export const touchA11y = {
  // Add proper ARIA attributes for touch interactions
  touchRole: "button" as const,
  touchTabIndex: 0,
  touchAriaLabel: (action: string) => `Touch to ${action}`,

  // Keyboard equivalents for touch gestures
  keyboardHandlers: {
    onKeyDown: (e: React.KeyboardEvent, callback?: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        callback?.();
      }
    },
  },
} as const;

// Performance optimizations for touch
export const touchPerformance = {
  // Use passive event listeners where possible
  passiveOptions: { passive: true },

  // Debounce touch events
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle touch events for better performance
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
} as const;

// Touch-friendly utility functions
export function getTouchTargetClasses(size: "sm" | "md" | "lg" = "md"): string {
  return touchClasses[`touch-btn-${size}`];
}

export function addTouchFeedback(baseClasses: string): string {
  return `${baseClasses} ${touchClasses["touch-feedback"]}`;
}

export function makeCardTouchable(baseClasses: string): string {
  return `${baseClasses} ${touchClasses["touch-card"]} ${touchClasses["touch-interactive"]}`;
}

// Export default utilities
export default {
  touchStandards,
  touchClasses,
  useTouchGestures,
  isTouchDevice,
  isIOSDevice,
  isAndroidDevice,
  touchA11y,
  touchPerformance,
  getTouchTargetClasses,
  addTouchFeedback,
  makeCardTouchable,
};
