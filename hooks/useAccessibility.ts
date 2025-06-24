import { useCallback, useEffect, useRef, useState } from "react";

interface UseAccessibilityOptions {
  label?: string;
  description?: string;
  role?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  expanded?: boolean;
  controls?: string;
  describedBy?: string;
  labelledBy?: string;
}

export function useAccessibility(options: UseAccessibilityOptions = {}) {
  const {
    label,
    description,
    role,
    disabled = false,
    required = false,
    invalid = false,
    expanded,
    controls,
    describedBy,
    labelledBy,
  } = options;

  const [announceText, setAnnounceText] = useState<string>("");

  // Generate unique IDs for accessibility relationships
  const idRef = useRef<string>("");
  if (!idRef.current) {
    idRef.current = `a11y-${Math.random().toString(36).substring(2, 11)}`;
  }

  const descriptionId = `${idRef.current}-description`;
  const labelId = `${idRef.current}-label`;

  // Screen reader announcements
  const announce = useCallback(
    (text: string, priority: "polite" | "assertive" = "polite") => {
      setAnnounceText("");
      setTimeout(() => setAnnounceText(text), 10);
    },
    []
  );

  // Common ARIA attributes
  const ariaAttributes = {
    "aria-label": label,
    "aria-describedby": description ? descriptionId : describedBy,
    "aria-labelledby": labelledBy || (label ? undefined : labelId),
    "aria-disabled": disabled,
    "aria-required": required,
    "aria-invalid": invalid,
    "aria-expanded": expanded,
    "aria-controls": controls,
    role,
  };

  // Filter out undefined values
  const filteredAriaAttributes = Object.fromEntries(
    Object.entries(ariaAttributes).filter(([_, value]) => value !== undefined)
  );

  return {
    ariaAttributes: filteredAriaAttributes,
    descriptionId,
    labelId,
    announce,
    announceText,
  };
}

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (stopPropagation) {
        event.stopPropagation();
      }

      switch (event.key) {
        case "Enter":
          if (onEnter) {
            if (preventDefault) event.preventDefault();
            onEnter();
          }
          break;
        case " ":
          if (onSpace) {
            if (preventDefault) event.preventDefault();
            onSpace();
          }
          break;
        case "Escape":
          if (onEscape) {
            if (preventDefault) event.preventDefault();
            onEscape();
          }
          break;
        case "ArrowUp":
          if (onArrowUp) {
            if (preventDefault) event.preventDefault();
            onArrowUp();
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            if (preventDefault) event.preventDefault();
            onArrowDown();
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft) {
            if (preventDefault) event.preventDefault();
            onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (onArrowRight) {
            if (preventDefault) event.preventDefault();
            onArrowRight();
          }
          break;
        case "Tab":
          if (event.shiftKey && onShiftTab) {
            if (preventDefault) event.preventDefault();
            onShiftTab();
          } else if (!event.shiftKey && onTab) {
            if (preventDefault) event.preventDefault();
            onTab();
          }
          break;
      }
    },
    [
      onEnter,
      onSpace,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
      preventDefault,
      stopPropagation,
    ]
  );

  return { handleKeyDown };
}

interface UseFocusManagementOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const { autoFocus = false, restoreFocus = true, trapFocus = false } = options;
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const focusableElement = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (focusableElement) {
        focusableElement.focus();
      } else {
        containerRef.current.focus();
      }
    }

    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [autoFocus, restoreFocus]);

  const handleFocusTrap = useCallback(
    (event: React.KeyboardEvent) => {
      if (!trapFocus || !containerRef.current || event.key !== "Tab") {
        return;
      }

      const focusableElements = containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [trapFocus]
  );

  return {
    containerRef,
    handleFocusTrap,
  };
}

interface UseScreenReaderOptions {
  announceOnMount?: string;
  announceOnUnmount?: string;
  liveRegion?: "polite" | "assertive" | "off";
}

export function useScreenReader(options: UseScreenReaderOptions = {}) {
  const { announceOnMount, announceOnUnmount, liveRegion = "polite" } = options;
  const [announcement, setAnnouncement] = useState<string>("");

  const announce = useCallback((text: string) => {
    setAnnouncement("");
    setTimeout(() => setAnnouncement(text), 10);
  }, []);

  useEffect(() => {
    if (announceOnMount) {
      announce(announceOnMount);
    }

    return () => {
      if (announceOnUnmount) {
        announce(announceOnUnmount);
      }
    };
  }, [announceOnMount, announceOnUnmount, announce]);

  return {
    announcement,
    announce,
    liveRegion,
  };
}

// Skip link component for keyboard navigation
export function useSkipLinks() {
  const skipLinks = [
    { href: "#main-content", text: "Skip to main content" },
    { href: "#navigation", text: "Skip to navigation" },
    { href: "#footer", text: "Skip to footer" },
  ];

  return { skipLinks };
}

// High contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle("high-contrast", newValue);
      localStorage.setItem("high-contrast-mode", newValue.toString());
      return newValue;
    });
  }, []);

  // Apply high contrast class on mount if preference is saved
  useEffect(() => {
    const savedPreference = localStorage.getItem("high-contrast-mode");
    if (savedPreference === "true") {
      setIsHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  return {
    isHighContrast,
    toggleHighContrast,
  };
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { prefersReducedMotion };
}

export type {
  UseAccessibilityOptions,
  UseKeyboardNavigationOptions,
  UseFocusManagementOptions,
  UseScreenReaderOptions,
};
