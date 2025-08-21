/**
 * Professional Email Design System for TechTots
 * Enterprise-grade design tokens and components for multi-million dollar company appearance
 */

// Professional Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Success Colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Warning Colors
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  // Error Colors
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  // Neutral Colors
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Accent Colors
  accent: {
    purple: "#8b5cf6",
    pink: "#ec4899",
    orange: "#f97316",
    teal: "#14b8a6",
    indigo: "#6366f1",
  },
};

// Professional Gradients
export const gradients = {
  primary: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
  success: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  warning: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
  error: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
  premium: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
  sunset: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
  ocean: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
  midnight: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
};

// Professional Typography System
export const typography = {
  fontFamily: {
    primary:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    secondary:
      "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
  },

  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },

  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
};

// Professional Spacing System
export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
  "4xl": "6rem",
};

// Professional Border Radius
export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  base: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

// Professional Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
};

// Professional Breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Professional Animation Durations
export const transitions = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  easing: {
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Professional Component Styles
export const components = {
  // Button Styles
  button: {
    primary: `
      background: ${gradients.primary};
      color: white;
      padding: 12px 24px;
      border-radius: ${borderRadius.lg};
      font-weight: ${typography.fontWeight.semibold};
      font-size: ${typography.fontSize.base};
      text-decoration: none;
      display: inline-block;
      box-shadow: ${shadows.md};
      transition: all ${transitions.duration.normal} ${transitions.easing.ease};
    `,
    secondary: `
      background: white;
      color: ${colors.primary[600]};
      padding: 12px 24px;
      border-radius: ${borderRadius.lg};
      font-weight: ${typography.fontWeight.semibold};
      font-size: ${typography.fontSize.base};
      text-decoration: none;
      display: inline-block;
      border: 2px solid ${colors.primary[600]};
      box-shadow: ${shadows.sm};
      transition: all ${transitions.duration.normal} ${transitions.easing.ease};
    `,
    success: `
      background: ${gradients.success};
      color: white;
      padding: 12px 24px;
      border-radius: ${borderRadius.lg};
      font-weight: ${typography.fontWeight.semibold};
      font-size: ${typography.fontSize.base};
      text-decoration: none;
      display: inline-block;
      box-shadow: ${shadows.md};
      transition: all ${transitions.duration.normal} ${transitions.easing.ease};
    `,
    warning: `
      background: ${gradients.warning};
      color: white;
      padding: 12px 24px;
      border-radius: ${borderRadius.lg};
      font-weight: ${typography.fontWeight.semibold};
      font-size: ${typography.fontSize.base};
      text-decoration: none;
      display: inline-block;
      box-shadow: ${shadows.md};
      transition: all ${transitions.duration.normal} ${transitions.easing.ease};
    `,
  },

  // Card Styles
  card: {
    base: `
      background: white;
      border-radius: ${borderRadius.xl};
      box-shadow: ${shadows.lg};
      padding: ${spacing.xl};
      border: 1px solid ${colors.neutral[200]};
    `,
    elevated: `
      background: white;
      border-radius: ${borderRadius.xl};
      box-shadow: ${shadows["2xl"]};
      padding: ${spacing.xl};
      border: 1px solid ${colors.neutral[200]};
    `,
  },

  // Alert Styles
  alert: {
    info: `
      background: ${colors.primary[50]};
      border: 1px solid ${colors.primary[200]};
      border-radius: ${borderRadius.lg};
      padding: ${spacing.lg};
      color: ${colors.primary[800]};
    `,
    success: `
      background: ${colors.success[50]};
      border: 1px solid ${colors.success[200]};
      border-radius: ${borderRadius.lg};
      padding: ${spacing.lg};
      color: ${colors.success[800]};
    `,
    warning: `
      background: ${colors.warning[50]};
      border: 1px solid ${colors.warning[200]};
      border-radius: ${borderRadius.lg};
      padding: ${spacing.lg};
      color: ${colors.warning[800]};
    `,
    error: `
      background: ${colors.error[50]};
      border: 1px solid ${colors.error[200]};
      border-radius: ${borderRadius.lg};
      padding: ${spacing.lg};
      color: ${colors.error[800]};
    `,
  },
};

// Professional Layout Utilities
export const layout = {
  container: `
    max-width: 600px;
    margin: 0 auto;
    padding: ${spacing.xl};
    background: white;
    font-family: ${typography.fontFamily.primary};
    line-height: ${typography.lineHeight.normal};
    color: ${colors.neutral[800]};
  `,

  section: `
    margin: ${spacing.xl} 0;
    padding: ${spacing.xl};
  `,

  grid: {
    two: `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${spacing.lg};
    `,
    three: `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: ${spacing.lg};
    `,
    responsive: `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: ${spacing.lg};
    `,
  },
};

// Professional Text Utilities
export const text = {
  heading: {
    h1: `
      font-size: ${typography.fontSize["4xl"]};
      font-weight: ${typography.fontWeight.bold};
      line-height: ${typography.lineHeight.tight};
      color: ${colors.neutral[900]};
      margin: 0 0 ${spacing.lg} 0;
    `,
    h2: `
      font-size: ${typography.fontSize["3xl"]};
      font-weight: ${typography.fontWeight.bold};
      line-height: ${typography.lineHeight.tight};
      color: ${colors.neutral[900]};
      margin: 0 0 ${spacing.md} 0;
    `,
    h3: `
      font-size: ${typography.fontSize["2xl"]};
      font-weight: ${typography.fontWeight.semibold};
      line-height: ${typography.lineHeight.tight};
      color: ${colors.neutral[800]};
      margin: 0 0 ${spacing.md} 0;
    `,
    h4: `
      font-size: ${typography.fontSize.xl};
      font-weight: ${typography.fontWeight.semibold};
      line-height: ${typography.lineHeight.tight};
      color: ${colors.neutral[800]};
      margin: 0 0 ${spacing.sm} 0;
    `,
  },

  body: {
    large: `
      font-size: ${typography.fontSize.lg};
      line-height: ${typography.lineHeight.relaxed};
      color: ${colors.neutral[700]};
    `,
    base: `
      font-size: ${typography.fontSize.base};
      line-height: ${typography.lineHeight.normal};
      color: ${colors.neutral[700]};
    `,
    small: `
      font-size: ${typography.fontSize.sm};
      line-height: ${typography.lineHeight.normal};
      color: ${colors.neutral[600]};
    `,
  },
};

// Professional Icon System
export const icons = {
  size: {
    sm: "16px",
    md: "20px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },

  color: {
    primary: colors.primary[600],
    success: colors.success[600],
    warning: colors.warning[600],
    error: colors.error[600],
    neutral: colors.neutral[500],
  },
};

// Professional Animation Keyframes
export const animations = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,

  slideIn: `
    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
};

// Professional Email-Specific Utilities
export const email = {
  // Responsive table wrapper
  tableWrapper: `
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: white;
  `,

  // Mobile-first responsive design
  responsive: `
    @media only screen and (max-width: 600px) {
      .mobile-full { width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-stack { display: block !important; }
    }
  `,

  // Dark mode support
  darkMode: `
    @media (prefers-color-scheme: dark) {
      .dark-mode { background-color: #1f2937 !important; color: #f9fafb !important; }
      .dark-mode-text { color: #f9fafb !important; }
      .dark-mode-border { border-color: #374151 !important; }
    }
  `,

  // Email client specific fixes
  clientFixes: `
    /* Outlook fixes */
    .outlook-fix { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    
    /* Gmail fixes */
    .gmail-fix { display: inline-block !important; }
    
    /* Apple Mail fixes */
    .apple-mail-fix { -webkit-text-size-adjust: 100%; }
  `,
};

// Export all design tokens
export default {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  transitions,
  components,
  layout,
  text,
  icons,
  animations,
  email,
};
