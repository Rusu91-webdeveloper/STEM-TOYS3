import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  RotateCcw,
  Building2,
  MessageSquare,
  BarChart3,
  Settings,
  Layers,
  Star,
  BookOpen,
  Truck,
  ClipboardList,
  AlertCircle,
  Receipt,
  RefreshCw,
  Tag,
  FileText,
  Image,
  Mail,
  Calendar,
  // Search,
  ShieldCheck,
  Calculator,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  title: string;
  icon: LucideIcon;
}
export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNavItems: AdminNavItem[] = [
  { title: "Prezentare generală", href: "/admin", icon: LayoutDashboard },
  { title: "Comenzi", href: "/admin/orders", icon: ShoppingCart },
  { title: "Produse", href: "/admin/products", icon: Package },
  { title: "Clienți", href: "/admin/customers", icon: Users },
  { title: "Retururi", href: "/admin/returns", icon: RotateCcw },
  { title: "Furnizori", href: "/admin/suppliers", icon: Building2 },
  {
    title: "Asistență clienți",
    href: "/admin/communication",
    icon: MessageSquare,
  },
  { title: "Rapoarte", href: "/admin/analytics", icon: BarChart3 },
  { title: "Setări", href: "/admin/settings", icon: Settings },
];

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Catalog și conținut",
    items: [
      { title: "Categorii", href: "/admin/categories", icon: Layers },
      {
        title: "Produse recomandate",
        href: "/admin/featured-products",
        icon: Star,
      },
      {
        title: "Cărți și fișiere digitale",
        href: "/admin/books",
        icon: BookOpen,
      },
      { title: "Blog", href: "/admin/blog", icon: FileText },
      { title: "Imagini", href: "/admin/images", icon: Image },
    ],
  },
  {
    title: "Operațiuni",
    items: [
      {
        title: "Sarcini de lucru",
        href: "/admin/ops-queue",
        icon: ClipboardList,
      },
      {
        title: "Expediere și procesare",
        href: "/admin/order-management",
        icon: Truck,
      },
      {
        title: "Probleme de livrare",
        href: "/admin/fulfillment-issues",
        icon: AlertCircle,
      },
      {
        title: "Sincronizare furnizori",
        href: "/admin/suppliers/feeds",
        icon: RefreshCw,
      },
      {
        title: "Facturi furnizori",
        href: "/admin/supplier-invoices",
        icon: Receipt,
      },
      {
        title: "Cereri de retragere",
        href: "/admin/withdrawals",
        icon: FileText,
      },
      {
        title: "Tichete de asistență",
        href: "/admin/tickets",
        icon: MessageSquare,
      },
      { title: "Mesaje", href: "/admin/messages", icon: Mail },
    ],
  },
  {
    title: "Marketing",
    items: [
      { title: "Cupoane", href: "/admin/coupons", icon: Tag },
      {
        title: "Automatizări email",
        href: "/admin/email-automation",
        icon: Mail,
      },
      {
        title: "Șabloane email",
        href: "/admin/email-templates",
        icon: FileText,
      },
      { title: "Secvențe email", href: "/admin/email-sequences", icon: Mail },
      { title: "Reguli email", href: "/admin/email-triggers", icon: Mail },
      {
        title: "Calendar de conținut",
        href: "/admin/content-calendar",
        icon: Calendar,
      },

      {
        title: "Configurare pixeli",
        href: "/admin/analytics/pixel-config",
        icon: Target,
      },
    ],
  },
  {
    title: "Financiar și administrare",
    items: [
      {
        title: "Raport de vânzări",
        href: "/admin/analytics/sales",
        icon: BarChart3,
      },
      {
        title: "Costuri și marje",
        href: "/admin/analytics/unit-economics",
        icon: Calculator,
      },
      {
        title: "Gestionare costuri",
        href: "/admin/cost-management",
        icon: Receipt,
      },
      {
        title: "Starea magazinului",
        href: "/admin/store-health",
        icon: ShieldCheck,
      },
      { title: "Confidențialitate", href: "/admin/privacy", icon: ShieldCheck },
    ],
  },
];

export function activeAdminHref(pathname: string): string | undefined {
  return [...adminNavItems, ...adminNavGroups.flatMap(group => group.items)]
    .filter(
      item =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function adminPageTitle(pathname: string): string {
  const href = activeAdminHref(pathname);
  return (
    [...adminNavItems, ...adminNavGroups.flatMap(group => group.items)].find(
      item => item.href === href
    )?.title ?? "Administrare"
  );
}

// These pages contain generated/demo figures. Preserve their routes, but do not
// present them as business reports or expose their metrics in the admin UI.
export const disconnectedReports: Record<string, string> = {
  "/admin/advanced-analytics": "Analiză predictivă",
  "/admin/analytics/dashboard": "Analiza comportamentului",
  "/admin/competitor-analysis": "Analiza concurenței",
  "/admin/seo-dashboard": "Monitorizare SEO",
  "/admin/seo/google-search-console": "Google Search Console",
};
