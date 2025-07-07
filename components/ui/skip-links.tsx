import * as React from "react"

import { cn } from "@/lib/utils"

interface SkipLink {
  href: string
  text: string
  description?: string
}

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

const defaultSkipLinks: SkipLink[] = [
  {
    href: '#main-content',
    text: 'Skip to main content',
    description: 'Jump to the primary content of the page'
  },
  {
    href: '#navigation',
    text: 'Skip to navigation',
    description: 'Jump to the main navigation menu'
  },
  {
    href: '#footer',
    text: 'Skip to footer',
    description: 'Jump to the page footer'
  }
]

function SkipLinks({ links = defaultSkipLinks, className }: SkipLinksProps) {
  return (
    <nav
      aria-label="Skip links"
      className={cn(
        // Hidden by default, visible when focused
        "fixed inset-x-0 top-0 z-[9999] flex flex-col gap-1 p-2",
        "translate-y-[-100%] transition-transform duration-300",
        "focus-within:translate-y-0",
        className
      )}
    >
      {links.map((link, index) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            // Base styles
            "inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "shadow-lg outline-none ring-2 ring-transparent",
            // Focus styles
            "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            // Hover styles
            "hover:bg-primary/90",
            // Skip link specific positioning
            "sr-only focus:not-sr-only"
          )}
          onClick={(e) => {
            // Prevent default and manually handle navigation
            e.preventDefault()
            const target = document.querySelector(link.href)
            if (target) {
              target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              })
              // Set focus to the target element if it's focusable
              if (target instanceof HTMLElement) {
                target.focus()
                // If target is not naturally focusable, add tabindex temporarily
                if (!target.hasAttribute('tabindex')) {
                  target.setAttribute('tabindex', '-1')
                  target.addEventListener('blur', () => {
                    target.removeAttribute('tabindex')
                  }, { once: true })
                }
              }
            }
          }}
          aria-describedby={link.description ? `skip-link-desc-${index}` : undefined}
        >
          {link.text}
          {link.description && (
            <span
              id={`skip-link-desc-${index}`}
              className="sr-only"
            >
              {link.description}
            </span>
          )}
        </a>
      ))}
    </nav>
  )
}

export { SkipLinks, defaultSkipLinks, type SkipLink, type SkipLinksProps } 