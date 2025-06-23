/**
 * App-like Navigation Gestures
 * Provides native app-like navigation patterns for the PWA
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTouchGestures } from "./touch-interactions";

// Gesture configuration
const GESTURE_CONFIG = {
  swipeThreshold: 50,
  velocityThreshold: 0.3,
  edgeZone: 20, // pixels from edge
  backGestureZone: 50, // width of back gesture zone
  pullToRefreshThreshold: 60,
  hapticFeedback: true,
};

// Gesture types
export type AppGesture =
  | "back-swipe"
  | "edge-swipe"
  | "pull-refresh"
  | "quick-action"
  | "tab-switch";

interface AppGestureOptions {
  enableBackSwipe?: boolean;
  enableEdgeSwipe?: boolean;
  enablePullToRefresh?: boolean;
  onBackGesture?: () => void;
  onEdgeSwipe?: (edge: "left" | "right") => void;
  onPullToRefresh?: () => Promise<void>;
  onQuickAction?: (action: string) => void;
}

// Hook for app-like gestures
export function useAppGestures(options: AppGestureOptions = {}) {
  const {
    enableBackSwipe = true,
    enableEdgeSwipe = true,
    enablePullToRefresh = false,
    onBackGesture,
    onEdgeSwipe,
    onPullToRefresh,
    onQuickAction,
  } = options;

  const router = useRouter();
  const [gestureState, setGestureState] = useState({
    isBackGestureActive: false,
    backGestureProgress: 0,
    isPullToRefreshActive: false,
    pullToRefreshProgress: 0,
    edgeSwipeActive: false,
  });

  // Create gesture ref with comprehensive gesture handling
  const gestureRef = useTouchGestures({
    onSwipe: (direction, event) => {
      const touch = event.changedTouches[0];
      const startX = touch.clientX;
      const screenWidth = window.innerWidth;

      // Back swipe gesture (right swipe from left edge)
      if (
        enableBackSwipe &&
        direction === "right" &&
        startX < GESTURE_CONFIG.backGestureZone
      ) {
        if (onBackGesture) {
          onBackGesture();
        } else {
          router.back();
        }

        // Haptic feedback
        if (GESTURE_CONFIG.hapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }

      // Edge swipes
      if (enableEdgeSwipe) {
        const isLeftEdge = startX < GESTURE_CONFIG.edgeZone;
        const isRightEdge = startX > screenWidth - GESTURE_CONFIG.edgeZone;

        if (
          (direction === "right" && isLeftEdge) ||
          (direction === "left" && isRightEdge)
        ) {
          const edge = isLeftEdge ? "left" : "right";
          onEdgeSwipe?.(edge);

          // Haptic feedback
          if (GESTURE_CONFIG.hapticFeedback && "vibrate" in navigator) {
            navigator.vibrate([25, 25, 25]);
          }
        }
      }
    },

    onPan: (deltaX, deltaY, event) => {
      const touch = event.touches[0];
      const startX = touch.clientX - deltaX;
      const startY = touch.clientY - deltaY;

      // Back gesture progress tracking
      if (
        enableBackSwipe &&
        startX < GESTURE_CONFIG.backGestureZone &&
        deltaX > 0
      ) {
        const progress = Math.min(deltaX / 100, 1);
        setGestureState(prev => ({
          ...prev,
          isBackGestureActive: true,
          backGestureProgress: progress,
        }));
      }

      // Pull to refresh tracking
      if (enablePullToRefresh && deltaY > 0 && window.scrollY === 0) {
        const progress = Math.min(
          deltaY / GESTURE_CONFIG.pullToRefreshThreshold,
          1
        );
        setGestureState(prev => ({
          ...prev,
          isPullToRefreshActive: true,
          pullToRefreshProgress: progress,
        }));
      }
    },
  });

  // Reset gesture state on touch end
  useEffect(() => {
    const handleTouchEnd = async () => {
      if (
        gestureState.isPullToRefreshActive &&
        gestureState.pullToRefreshProgress >= 1
      ) {
        if (onPullToRefresh) {
          await onPullToRefresh();
        }
      }

      setGestureState({
        isBackGestureActive: false,
        backGestureProgress: 0,
        isPullToRefreshActive: false,
        pullToRefreshProgress: 0,
        edgeSwipeActive: false,
      });
    };

    document.addEventListener("touchend", handleTouchEnd);
    return () => document.removeEventListener("touchend", handleTouchEnd);
  }, [gestureState, onPullToRefresh]);

  return { gestureRef, gestureState };
}

// Gesture indicator utilities (for use in TSX components)
export const gestureIndicatorStyles = {
  backGesture: (progress: number, isActive: boolean) => ({
    container: {
      position: "fixed" as const,
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 50,
      pointerEvents: "none" as const,
      display: isActive ? "block" : "none",
    },
    indicator: {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(4px)",
      borderRadius: "0 999px 999px 0",
      width: `${progress * 60}px`,
      height: `${progress * 80}px`,
      opacity: progress,
      transition: "all 150ms ease",
    },
    arrow: {
      color: "white",
      transform: `translateX(${progress * 10}px) scale(${progress})`,
      opacity: progress > 0.5 ? 1 : progress * 2,
      transition: "transform 150ms ease",
    },
  }),

  pullToRefresh: (
    progress: number,
    isActive: boolean,
    isRefreshing = false
  ) => ({
    container: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      pointerEvents: "none" as const,
      display: isActive || isRefreshing ? "block" : "none",
    },
    indicator: {
      backgroundColor: "rgba(99, 102, 241, 0.1)",
      backdropFilter: "blur(4px)",
      height: `${progress * 60}px`,
      opacity: progress,
      transition: "all 200ms ease",
    },
    spinner: {
      width: "24px",
      height: "24px",
      border: "2px solid rgb(99, 102, 241)",
      borderTopColor: "transparent",
      borderRadius: "50%",
      transform: `scale(${progress})`,
      opacity: progress > 0.3 ? 1 : progress * 3,
      animation:
        isRefreshing || progress >= 1 ? "spin 1s linear infinite" : "none",
      transition: "transform 200ms ease",
    },
  }),
};

// Tab switching gestures for mobile tab bar
export function useTabSwitchGestures(
  currentTab: number,
  totalTabs: number,
  onTabChange: (tabIndex: number) => void
) {
  const gestureRef = useTouchGestures({
    onSwipe: direction => {
      if (direction === "left" && currentTab < totalTabs - 1) {
        onTabChange(currentTab + 1);

        // Haptic feedback
        if (GESTURE_CONFIG.hapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(25);
        }
      } else if (direction === "right" && currentTab > 0) {
        onTabChange(currentTab - 1);

        // Haptic feedback
        if (GESTURE_CONFIG.hapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(25);
        }
      }
    },
  });

  return gestureRef;
}

// Quick action gestures (long press, double tap)
export function useQuickActionGestures(actions: Record<string, () => void>) {
  const gestureRef = useTouchGestures({
    onLongPress: () => {
      actions.contextMenu?.();

      // Strong haptic feedback for long press
      if (GESTURE_CONFIG.hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate([50, 25, 50]);
      }
    },

    onDoubleTap: () => {
      actions.quickAction?.();

      // Light haptic feedback for double tap
      if (GESTURE_CONFIG.hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(30);
      }
    },
  });

  return gestureRef;
}

// Utility functions for app-like behaviors
export const appGestureUtils = {
  // Enable/disable scroll on gesture
  toggleScroll: (enable: boolean) => {
    document.body.style.overflow = enable ? "auto" : "hidden";
  },

  // Add momentum scrolling for iOS-like feel
  enableMomentumScrolling: (element: HTMLElement) => {
    (element.style as any).webkitOverflowScrolling = "touch";
    (element.style as any).overflowScrolling = "touch";
  },

  // Safe area handling for notched devices
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue("--safe-area-inset-top") || "0"),
      right: parseInt(style.getPropertyValue("--safe-area-inset-right") || "0"),
      bottom: parseInt(
        style.getPropertyValue("--safe-area-inset-bottom") || "0"
      ),
      left: parseInt(style.getPropertyValue("--safe-area-inset-left") || "0"),
    };
  },

  // Haptic feedback wrapper
  hapticFeedback: (pattern: number | number[] = 50) => {
    if ("vibrate" in navigator && GESTURE_CONFIG.hapticFeedback) {
      navigator.vibrate(pattern);
    }
  },
};

export default {
  useAppGestures,
  useTabSwitchGestures,
  useQuickActionGestures,
  gestureIndicatorStyles,
  appGestureUtils,
};
