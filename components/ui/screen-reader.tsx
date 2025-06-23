import * as React from "react"
import { cn } from "@/lib/utils"

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

/**
 * Content that is only visible to screen readers
 */
function ScreenReaderOnly({ 
  children, 
  className, 
  as: Component = "span" 
}: ScreenReaderOnlyProps) {
  return (
    <Component
      className={cn(
        "sr-only",
        className
      )}
    >
      {children}
    </Component>
  )
}

interface LiveRegionProps {
  children: React.ReactNode
  level?: "polite" | "assertive" | "off"
  atomic?: boolean
  relevant?: "additions" | "removals" | "text" | "all"
  className?: string
}

/**
 * Live region for dynamic content announcements
 */
function LiveRegion({ 
  children, 
  level = "polite", 
  atomic = true,
  relevant = "text",
  className 
}: LiveRegionProps) {
  return (
    <div
      className={cn("sr-only", className)}
      aria-live={level}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {children}
    </div>
  )
}

interface AnnouncementProps {
  message: string
  level?: "polite" | "assertive"
  delay?: number
}

/**
 * Hook for making screen reader announcements
 */
function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState<string>("")
  const [level, setLevel] = React.useState<"polite" | "assertive">("polite")
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const announce = React.useCallback((
    message: string, 
    priority: "polite" | "assertive" = "polite",
    delay: number = 100
  ) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Clear current announcement first
    setAnnouncement("")
    setLevel(priority)

    // Set new announcement after a brief delay
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message)
    }, delay)
  }, [])

  const clear = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setAnnouncement("")
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    announcement,
    level,
    announce,
    clear
  }
}

/**
 * Component for making announcements to screen readers
 */
function Announcement({ message, level = "polite", delay = 100 }: AnnouncementProps) {
  const [displayMessage, setDisplayMessage] = React.useState<string>("")

  React.useEffect(() => {
    if (message) {
      // Clear first, then set message
      setDisplayMessage("")
      const timeout = setTimeout(() => {
        setDisplayMessage(message)
      }, delay)

      return () => clearTimeout(timeout)
    }
  }, [message, delay])

  if (!displayMessage) return null

  return (
    <LiveRegion level={level}>
      {displayMessage}
    </LiveRegion>
  )
}

interface DescriptionProps {
  id: string
  children: React.ReactNode
  className?: string
}

/**
 * Hidden description for aria-describedby
 */
function Description({ id, children, className }: DescriptionProps) {
  return (
    <div
      id={id}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  )
}

interface LabelProps {
  id: string
  children: React.ReactNode
  className?: string
}

/**
 * Hidden label for aria-labelledby
 */
function Label({ id, children, className }: LabelProps) {
  return (
    <div
      id={id}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  )
}

interface StatusProps {
  children: React.ReactNode
  className?: string
}

/**
 * Status indicator for screen readers
 */
function Status({ children, className }: StatusProps) {
  return (
    <div
      className={cn("sr-only", className)}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  )
}

interface AlertProps {
  children: React.ReactNode
  className?: string
}

/**
 * Alert for urgent announcements
 */
function Alert({ children, className }: AlertProps) {
  return (
    <div
      className={cn("sr-only", className)}
      role="alert"
      aria-live="assertive"
    >
      {children}
    </div>
  )
}

interface ProgressAnnouncementProps {
  value: number
  max?: number
  unit?: string
  format?: (value: number, max: number) => string
}

/**
 * Announces progress changes to screen readers
 */
function ProgressAnnouncement({ 
  value, 
  max = 100, 
  unit = "percent",
  format
}: ProgressAnnouncementProps) {
  const [lastAnnounced, setLastAnnounced] = React.useState<number>(-1)
  const { announce } = useAnnouncement()

  React.useEffect(() => {
    // Only announce at 10% intervals or at completion
    const percentage = Math.round((value / max) * 100)
    const shouldAnnounce = percentage % 10 === 0 || percentage === 100
    
    if (shouldAnnounce && percentage !== lastAnnounced) {
      const message = format 
        ? format(value, max)
        : `Progress: ${percentage} ${unit} complete`
      
      announce(message, "polite", 500)
      setLastAnnounced(percentage)
    }
  }, [value, max, unit, format, announce, lastAnnounced])

  return null
}

interface LoadingAnnouncementProps {
  isLoading: boolean
  loadingMessage?: string
  completeMessage?: string
  errorMessage?: string
  error?: boolean
}

/**
 * Announces loading state changes
 */
function LoadingAnnouncement({ 
  isLoading, 
  loadingMessage = "Loading",
  completeMessage = "Loading complete",
  errorMessage = "Loading failed",
  error = false
}: LoadingAnnouncementProps) {
  const { announce } = useAnnouncement()
  const previousLoadingRef = React.useRef(isLoading)

  React.useEffect(() => {
    const wasLoading = previousLoadingRef.current
    
    if (isLoading && !wasLoading) {
      // Started loading
      announce(loadingMessage, "polite")
    } else if (!isLoading && wasLoading) {
      // Finished loading
      if (error) {
        announce(errorMessage, "assertive")
      } else {
        announce(completeMessage, "polite")
      }
    }
    
    previousLoadingRef.current = isLoading
  }, [isLoading, error, loadingMessage, completeMessage, errorMessage, announce])

  return null
}

interface NavigationHelpProps {
  shortcuts?: Array<{
    key: string
    description: string
  }>
  className?: string
}

/**
 * Provides keyboard navigation help for screen readers
 */
function NavigationHelp({ shortcuts = [], className }: NavigationHelpProps) {
  const defaultShortcuts = [
    { key: "Tab", description: "Navigate to next interactive element" },
    { key: "Shift + Tab", description: "Navigate to previous interactive element" },
    { key: "Enter or Space", description: "Activate buttons and links" },
    { key: "Escape", description: "Close dialogs and menus" },
    { key: "Arrow keys", description: "Navigate within menus and lists" }
  ]

  const allShortcuts = [...defaultShortcuts, ...shortcuts]

  return (
    <div className={cn("sr-only", className)}>
      <h3>Keyboard Navigation Help</h3>
      <ul>
        {allShortcuts.map((shortcut, index) => (
          <li key={index}>
            <strong>{shortcut.key}:</strong> {shortcut.description}
          </li>
        ))}
      </ul>
    </div>
  )
}

export {
  ScreenReaderOnly,
  LiveRegion,
  Announcement,
  Description,
  Label,
  Status,
  Alert,
  ProgressAnnouncement,
  LoadingAnnouncement,
  NavigationHelp,
  useAnnouncement,
  type ScreenReaderOnlyProps,
  type LiveRegionProps,
  type AnnouncementProps,
  type DescriptionProps,
  type LabelProps,
  type StatusProps,
  type AlertProps,
  type ProgressAnnouncementProps,
  type LoadingAnnouncementProps,
  type NavigationHelpProps,
} 