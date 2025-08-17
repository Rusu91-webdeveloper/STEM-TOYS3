import { cva, type VariantProps } from "class-variance-authority";
import {
  // Navigation & UI
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  Settings,

  // E-commerce
  ShoppingCart,
  ShoppingBag,
  Heart,
  Star,
  Package,
  CreditCard,
  MapPin,
  Truck,
  Gift,

  // User & Account
  User,
  Users,
  UserPlus,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,

  // Content & Media
  Search,
  Filter,
  SlidersHorizontal,
  Download,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  BookOpen,
  Book,

  // Communication
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  Bell,
  BellOff,
  Share,
  Share2,

  // Status & Feedback
  Check,
  CheckCircle,
  CheckCircle2,
  X as XIcon,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Loader,
  Loader2,

  // Actions
  Plus,
  Minus,
  Edit,
  Edit2,
  Trash,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Save,

  // Categories & STEM
  Atom,
  Beaker,
  Calculator,
  Compass,
  Cpu,
  Dna,
  Microscope,
  Puzzle,
  Rocket,
  Zap,

  // Media & Social
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Github,

  // Time & Calendar
  Calendar,
  Clock,
  Clock3,
  Timer,

  // File & Data
  Folder,
  FolderOpen,
  File,
  Database,
  HardDrive,
  Cloud,
  CloudDownload,
  CloudUpload,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const iconVariants = cva("inline-flex items-center justify-center", {
  variants: {
    size: {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      default: "w-5 h-5",
      md: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-10 h-10",
      "2xl": "w-12 h-12",
    },
    variant: {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning",
      info: "text-info",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

interface IconProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof iconVariants> {
  icon: React.ComponentType<any>;
  label?: string;
  decorative?: boolean;
}

function Icon({
  icon: IconComponent,
  size,
  variant,
  className,
  label,
  decorative = false,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={cn(iconVariants({ size, variant, className }))}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative}
      role={decorative ? "presentation" : undefined}
      {...props}
    />
  );
}

// Predefined icon collections for common use cases
export const NavigationIcons = {
  Menu,
  Close: X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  Settings,
} as const;

export const EcommerceIcons = {
  Cart: ShoppingCart,
  Bag: ShoppingBag,
  Wishlist: Heart,
  Star,
  Package,
  Payment: CreditCard,
  Location: MapPin,
  Shipping: Truck,
  Gift,
} as const;

export const UserIcons = {
  User,
  Users,
  UserPlus,
  Login: LogIn,
  Logout: LogOut,
  Show: Eye,
  Hide: EyeOff,
  Lock,
  Unlock,
  Security: Shield,
} as const;

export const ContentIcons = {
  Search,
  Filter,
  Adjust: SlidersHorizontal,
  Download,
  Upload,
  Document: FileText,
  Image,
  Video,
  Audio: Music,
  DigitalBook: BookOpen,
  PhysicalBook: Book,
} as const;

export const CommunicationIcons = {
  Email: Mail,
  Phone,
  Chat: MessageCircle,
  Message: MessageSquare,
  Notification: Bell,
  NotificationOff: BellOff,
  Share,
  ShareExternal: Share2,
} as const;

export const StatusIcons = {
  Success: CheckCircle,
  Error: XCircle,
  Warning: AlertTriangle,
  Info: AlertCircle,
  Help: HelpCircle,
  Loading: Loader2,
  Check,
  Close: XIcon,
} as const;

export const ActionIcons = {
  Add: Plus,
  Remove: Minus,
  Edit,
  EditText: Edit2,
  Delete: Trash2,
  Copy,
  External: ExternalLink,
  Refresh: RefreshCw,
  Undo: RotateCcw,
  Save,
} as const;

export const STEMIcons = {
  Science: Atom,
  Chemistry: Beaker,
  Math: Calculator,
  Engineering: Compass,
  Technology: Cpu,
  Biology: Dna,
  Physics: Microscope,
  Logic: Puzzle,
  Space: Rocket,
  Energy: Zap,
} as const;

export const SocialIcons = {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Github,
} as const;

export const TimeIcons = {
  Calendar,
  Clock,
  Timer,
} as const;

export const DataIcons = {
  Folder,
  FolderOpen,
  File,
  Database,
  Storage: HardDrive,
  Cloud,
  CloudDownload,
  CloudUpload,
} as const;

// Icon size guidelines
export const IconSizes = {
  xs: "12px", // Very small icons in dense layouts
  sm: "16px", // Small icons in buttons, form inputs
  default: "20px", // Default icons in most UI elements
  md: "24px", // Medium icons for emphasis
  lg: "32px", // Large icons for headers, empty states
  xl: "40px", // Extra large for illustrations
  "2xl": "48px", // Hero icons, main illustrations
} as const;

// Usage guidelines and best practices
export const IconGuidelines = {
  // Accessibility
  accessibility: {
    decorative:
      "Use aria-hidden='true' for decorative icons that don't convey meaning",
    meaningful: "Provide aria-label for icons that convey meaning without text",
    redundant: "Icons with adjacent text are usually decorative",
  },

  // Sizing
  sizing: {
    buttons: "Use 'sm' (16px) for button icons",
    navigation: "Use 'default' (20px) for navigation icons",
    headers: "Use 'lg' (32px) for section headers",
    emptyStates: "Use 'xl' or '2xl' (40-48px) for empty state illustrations",
    inline: "Use 'xs' or 'sm' (12-16px) for inline text icons",
  },

  // Context
  context: {
    ecommerce: "Use EcommerceIcons for shopping-related actions",
    content: "Use ContentIcons for file and media operations",
    user: "Use UserIcons for authentication and profile actions",
    status: "Use StatusIcons for feedback and states",
    navigation: "Use NavigationIcons for UI navigation",
    stem: "Use STEMIcons for educational content categories",
  },

  // Consistency
  consistency: {
    family: "Stick to Lucide React icons for visual consistency",
    weight: "All icons have consistent stroke width and style",
    spacing: "Use consistent spacing around icons (usually 8px)",
    alignment: "Align icons to pixel grid for crisp rendering",
  },

  // Colors
  colors: {
    default: "Use default variant to inherit text color",
    muted: "Use muted variant for less important icons",
    semantic:
      "Use semantic variants (success, warning, destructive) for status",
    brand: "Use primary/secondary variants for brand colors",
  },
} as const;

// Icon usage examples
interface IconUsageExampleProps {
  title: string;
  examples: Array<{
    name: string;
    icon: React.ComponentType<any>;
    size?: VariantProps<typeof iconVariants>["size"];
    variant?: VariantProps<typeof iconVariants>["variant"];
    usage: string;
  }>;
}

function IconUsageExample({ title, examples }: IconUsageExampleProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {examples.map((example, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 border rounded-lg"
          >
            <Icon
              icon={example.icon}
              size={example.size || "default"}
              variant={example.variant || "default"}
              decorative
            />
            <div>
              <div className="font-medium text-sm">{example.name}</div>
              <div className="text-xs text-muted-foreground">
                {example.usage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick reference component
function IconReference() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Icon System Reference</h2>
        <p className="text-muted-foreground">
          Standardized iconography for consistent user experience
        </p>
      </div>

      <IconUsageExample
        title="Size Guidelines"
        examples={[
          {
            name: "Button Icon",
            icon: Plus,
            size: "sm",
            usage: "16px - Icons in buttons and inputs",
          },
          {
            name: "Navigation Icon",
            icon: Menu,
            size: "default",
            usage: "20px - Standard UI icons",
          },
          {
            name: "Header Icon",
            icon: Rocket,
            size: "lg",
            usage: "32px - Section headers",
          },
          {
            name: "Empty State Icon",
            icon: ShoppingCart,
            size: "2xl",
            usage: "48px - Illustrations",
          },
        ]}
      />

      <IconUsageExample
        title="Status & Feedback"
        examples={[
          {
            name: "Success",
            icon: CheckCircle,
            variant: "success",
            usage: "Positive feedback",
          },
          {
            name: "Error",
            icon: XCircle,
            variant: "destructive",
            usage: "Error states",
          },
          {
            name: "Warning",
            icon: AlertTriangle,
            variant: "warning",
            usage: "Caution messages",
          },
          {
            name: "Info",
            icon: Info,
            variant: "info",
            usage: "Informational content",
          },
        ]}
      />

      <IconUsageExample
        title="E-commerce Actions"
        examples={[
          {
            name: "Add to Cart",
            icon: ShoppingCart,
            usage: "Shopping actions",
          },
          { name: "Wishlist", icon: Heart, usage: "Save for later" },
          {
            name: "Rating",
            icon: Star,
            variant: "warning",
            usage: "Product ratings",
          },
          { name: "Shipping", icon: Truck, usage: "Delivery information" },
        ]}
      />
    </div>
  );
}

export {
  Icon,
  IconReference,
  IconUsageExample,
  iconVariants,
  type IconProps,
  type IconUsageExampleProps,
};
